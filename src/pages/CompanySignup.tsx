import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Building2, User, Loader2, CreditCard, Check, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function CompanySignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Company Info, 2 = License Selection & Payment
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    licenses: 5,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
  });

  // Payment tracking
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const paymentWindowRef = useRef<Window | null>(null);

  // Pricing calculation
  const pricePerLicense = formData.billingCycle === 'monthly' ? 6 : 5;
  const billingPeriod = formData.billingCycle === 'yearly' ? 12 : 1;
  const totalAmount = formData.licenses * pricePerLicense * billingPeriod;

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation for step 1
    if (!formData.companyName || !formData.adminEmail || !formData.password || !formData.adminName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    // Move to license selection
    setStep(2);
  };

  const pollPaymentStatus = async (reference: string) => {
    if (pollingRef.current) return; // Already polling

    setPollingStatus('Waiting for payment...');
    
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-a35148f0/company/payment-status/${reference}`,
          {
            headers: { Authorization: `Bearer ${publicAnonKey}` },
          }
        );
        const data = await res.json();

        if (data.status === 'verified') {
          // Payment verified and account created!
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus(null);
          setPaymentWindowOpened(false);
          setPendingReference(null);
          toast.success('Payment successful! Your account has been created. Please sign in.', { duration: 5000 });
          navigate('/login');
        } else if (data.status === 'paid') {
          // Payment succeeded on Paystack but not yet verified server-side
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus('Payment received! Creating your account...');
          
          // Give the webhook/verification a moment, then poll again
          setTimeout(() => {
            setPendingReference(reference);
            pollPaymentStatus(reference);
          }, 2000);
        } else if (data.status === 'failed') {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          setPollingStatus(null);
          setPaymentWindowOpened(false);
          setPendingReference(null);
          toast.error('Payment failed. Please try again.');
        }
        // 'pending' or 'unknown' — keep polling
      } catch (err) {
        console.error('Payment poll error:', err);
      }
    }, 3000); // Poll every 3 seconds
  };

  const handlePayment = async () => {
    if (formData.licenses < 1) {
      toast.error('Please select at least 1 license');
      return;
    }

    setLoading(true);

    // Open payment window immediately (before async work to avoid popup blockers)
    const payWindow = window.open('', '_blank');
    if (payWindow) {
      payWindow.document.write(`
        <html>
          <head><title>Connecting to Paystack...</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                   display: flex; flex-direction: column; align-items: center;
                   justify-content: center; min-height: 100vh; margin: 0;
                   background: linear-gradient(135deg, #1d4ed8 0%, #1e3a8a 100%); color: #fff; }
            .spinner {
              width: 48px; height: 48px;
              border: 4px solid rgba(255,255,255,0.3);
              border-top-color: #fff;
              border-radius: 50%;
              animation: spin 0.8s linear infinite;
              margin-bottom: 24px;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h2 { margin: 0 0 8px 0; font-size: 1.5rem; }
            p  { margin: 0; opacity: 0.8; font-size: 0.95rem; }
          </style>
          </head>
          <body>
            <div class="spinner"></div>
            <h2>Connecting to Paystack…</h2>
            <p>Please wait while we prepare your payment.</p>
          </body>
        </html>`);
      payWindow.document.close();
    }
    paymentWindowRef.current = payWindow;

    try {
      // Initialize payment with company registration data
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a35148f0/company/init-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            companySize: formData.companySize,
            industry: formData.industry,
            adminName: formData.adminName,
            adminEmail: formData.adminEmail.toLowerCase(),
            password: formData.password,
            licenses: formData.licenses,
            billingCycle: formData.billingCycle,
            amount: totalAmount,
          }),
        }
      );

      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Response text:', text);
        console.error('Response status:', response.status);
        console.error('Response headers:', Object.fromEntries(response.headers.entries()));
        toast.error(`Server error (${response.status}): ${text.substring(0, 200)}`);
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment');
      }

      console.log('Payment init success. Authorization URL:', data.authorization_url);

      if (data.authorization_url && data.reference) {
        setPendingReference(data.reference);
        setPaymentWindowOpened(true);

        if (payWindow && !payWindow.closed) {
          // Navigate the already-open tab to Paystack
          payWindow.location.href = data.authorization_url;
          
          // Start polling for payment status
          pollPaymentStatus(data.reference);
        } else {
          // Tab was closed or blocked — fall back to same-window navigation
          console.warn('Payment tab was closed or blocked; falling back to same-window redirect');
          window.location.href = data.authorization_url;
        }
      } else {
        throw new Error('Payment initialization failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
      console.error('Payment error:', error);
      if (payWindow && !payWindow.closed) {
        payWindow.close();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Blumebyte" className="h-12" />
          </div>
          <CardTitle className="text-3xl">Create Your Company Account</CardTitle>
          <CardDescription>
            {step === 1 
              ? 'Set up your company profile and admin account'
              : 'Choose your plan and complete payment to activate your account'
            }
          </CardDescription>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              {step > 1 ? <Check className="h-4 w-4" /> : '1'}
            </div>
            <div className={`h-1 w-12 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
              2
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            /* STEP 1: Company & Admin Info */
            <form onSubmit={handleNextStep} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    placeholder="Acme Corporation"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select
                      value={formData.companySize}
                      onValueChange={(value) => setFormData({ ...formData, companySize: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="companySize">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="500+">500+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => setFormData({ ...formData, industry: value })}
                      disabled={loading}
                    >
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Admin Information */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Admin Account
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="adminName">Your Name *</Label>
                  <Input
                    id="adminName"
                    placeholder="John Doe"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Email Address *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@company.com"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                size="lg"
                disabled={loading}
              >
                Continue to License Selection
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Sign in
                </button>
              </p>
            </form>
          ) : (
            /* STEP 2: License Selection & Payment */
            <div className="space-y-6">
              {/* Billing Cycle Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Choose Your Plan
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: 'monthly' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      formData.billingCycle === 'monthly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={loading || paymentWindowOpened}
                  >
                    <div className="font-semibold">Monthly</div>
                    <div className="text-2xl font-bold mt-1">$6<span className="text-sm font-normal text-gray-600">/user/mo</span></div>
                    <div className="text-xs text-gray-600 mt-1">Billed monthly</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: 'yearly' })}
                    className={`p-4 border-2 rounded-lg text-left transition-all relative ${
                      formData.billingCycle === 'yearly'
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    disabled={loading || paymentWindowOpened}
                  >
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Save 17%
                    </div>
                    <div className="font-semibold">Yearly</div>
                    <div className="text-2xl font-bold mt-1">$5<span className="text-sm font-normal text-gray-600">/user/mo</span></div>
                    <div className="text-xs text-gray-600 mt-1">Billed annually ($60/user/year)</div>
                  </button>
                </div>
              </div>

              {/* License Selection */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Employee Licenses
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="licenses">Licenses (minimum 1)</Label>
                  <Input
                    id="licenses"
                    type="number"
                    min="1"
                    value={formData.licenses}
                    onChange={(e) => setFormData({ ...formData, licenses: Math.max(1, parseInt(e.target.value) || 1) })}
                    disabled={loading || paymentWindowOpened}
                  />
                  <p className="text-sm text-gray-600">
                    Each license allows one employee to access the platform
                  </p>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Licenses:</span>
                  <span className="font-medium">{formData.licenses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per license:</span>
                  <span className="font-medium">${pricePerLicense}/{formData.billingCycle === 'monthly' ? 'mo' : 'mo'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Billing period:</span>
                  <span className="font-medium">{formData.billingCycle === 'monthly' ? 'Monthly' : 'Yearly (12 months)'}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-blue-600">${totalAmount.toFixed(2)}</span>
                  </div>
                  {formData.billingCycle === 'yearly' && (
                    <p className="text-xs text-gray-600 text-right mt-1">
                      You save ${(formData.licenses * 12).toFixed(2)} compared to monthly billing
                    </p>
                  )}
                </div>
              </div>

              {/* Payment Status */}
              {pollingStatus && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">{pollingStatus}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading || paymentWindowOpened}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={handlePayment}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
                  size="lg"
                  disabled={loading || paymentWindowOpened}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </div>

              <p className="text-center text-xs text-gray-600">
                Secure payment powered by Paystack. Your account will be created after successful payment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}