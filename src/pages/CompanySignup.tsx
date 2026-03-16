import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Building2, User, Loader2, CreditCard, Check, Users, ChevronRight, ChevronLeft, Settings } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function CompanySignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Company Info, 2 = License Selection & Payment
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [paystackPublicKey, setPaystackPublicKey] = useState<string | null>(null);
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

  // Exchange rate: 1 USD = 15.5 GHS (Ghana Cedis)
  const USD_TO_GHS = 15.5;

  // Pricing calculation in USD first, then convert to GHS
  const pricePerLicenseUSD = formData.billingCycle === 'monthly' ? 6 : 5;
  const pricePerLicenseGHS = pricePerLicenseUSD * USD_TO_GHS;
  const billingPeriod = formData.billingCycle === 'yearly' ? 12 : 1;
  const totalAmountUSD = formData.licenses * pricePerLicenseUSD * billingPeriod;
  const totalAmountGHS = totalAmountUSD * USD_TO_GHS;

  // Check if Paystack script is loaded
  useEffect(() => {
    const checkPaystack = () => {
      if (typeof (window as any).PaystackPop !== 'undefined') {
        console.log('Paystack script loaded successfully');
        setPaystackLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkPaystack()) return;

    console.log('Waiting for Paystack script to load...');

    // Try to load the script dynamically if not already loaded
    const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (!existingScript) {
      console.log('Dynamically loading Paystack script...');
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
        console.log('Paystack script loaded dynamically');
        setPaystackLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Paystack script dynamically');
      };
      document.head.appendChild(script);
    }

    // If not loaded, check every 100ms for up to 10 seconds
    const interval = setInterval(() => {
      if (checkPaystack()) {
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!paystackLoaded) {
        console.error('Paystack script failed to load after 10 seconds');
        toast.error('Payment system failed to load. Please refresh the page and try again.');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [paystackLoaded]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Fetch Paystack public key
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const url = `https://${projectId}.supabase.co/functions/v1/make-server-668731fc/paystack/public-key`;
        console.log('Fetching Paystack public key from:', url);
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });
        
        console.log('Response status:', response.status);
        
        // If not successful, use fallback immediately
        if (!response.ok) {
          console.log('Server endpoint not available yet (status:', response.status, '), using fallback...');
          handlePublicKeyFallback();
          return;
        }
        
        const contentType = response.headers.get('content-type');
        
        // Check if response is JSON
        if (!contentType || !contentType.includes('application/json')) {
          console.log('Server returned non-JSON response, using fallback...');
          handlePublicKeyFallback();
          return;
        }
        
        const data = await response.json();
        
        if (data.publicKey) {
          console.log('Paystack public key loaded successfully from server');
          setPaystackPublicKey(data.publicKey);
          // Also store it for future use
          localStorage.setItem('paystack_public_key', data.publicKey);
        } else {
          console.error('Failed to load Paystack public key:', data.error);
          handlePublicKeyFallback();
        }
      } catch (error: any) {
        console.error('Error fetching Paystack public key:', error.message);
        console.log('Using fallback method to get Paystack public key...');
        handlePublicKeyFallback();
      }
    };

    const handlePublicKeyFallback = () => {
      // Check localStorage first
      const storedKey = localStorage.getItem('paystack_public_key');
      if (storedKey && (storedKey.startsWith('pk_test_') || storedKey.startsWith('pk_live_'))) {
        console.log('Using Paystack public key from localStorage');
        setPaystackPublicKey(storedKey);
        return;
      }

      // If no key in localStorage, show message to configure it
      console.warn('No Paystack public key found. Please configure it in Dev Settings.');
      toast.error(
        'Payment system needs configuration. Click the settings icon to configure.',
        { duration: 8000 }
      );
    };

    fetchPublicKey();
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
          `https://${projectId}.supabase.co/functions/v1/make-server-668731fc/company/payment-status/${reference}`,
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

    try {
      // Check if Paystack script is loaded
      if (!paystackLoaded) {
        toast.error('Payment system is loading. Please wait a moment and try again.');
        setLoading(false);
        return;
      }

      // Check if public key is loaded
      if (!paystackPublicKey) {
        toast.error('Payment configuration is loading. Please wait a moment and try again.');
        setLoading(false);
        return;
      }

      // Initialize Paystack payment directly (using inline popup)
      const amountInKobo = Math.round(totalAmountGHS * 100);
      
      console.log('Initializing Paystack with key:', paystackPublicKey.substring(0, 10) + '...');
      
      const paystackHandler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: formData.adminEmail.toLowerCase(),
        amount: amountInKobo,
        currency: 'GHS',
        ref: `blumebyte_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        metadata: {
          companyName: formData.companyName,
          adminName: formData.adminName,
          licenses: formData.licenses,
          plan: formData.billingCycle,
          email: formData.adminEmail.toLowerCase(),
        },
        callback: function(response: any) {
          // Use regular function (not async) as Paystack requires
          console.log('Payment successful. Reference:', response.reference);
          setPendingReference(response.reference);
          setPaymentWindowOpened(true);
          
          // Create the company account with the payment reference
          // Use setTimeout to make it async without making the callback async
          setTimeout(() => {
            completeRegistration(response.reference);
          }, 100);
        },
        onClose: function() {
          console.log('Payment window closed');
          if (!pendingReference) {
            toast.warning('Payment was cancelled');
            setLoading(false);
          }
        },
      });

      // Open Paystack inline popup
      paystackHandler.openIframe();
      setLoading(false); // Set loading to false once popup opens
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
      console.error('Payment error:', error);
      setLoading(false);
    }
  };

  // Complete registration after successful payment
  const completeRegistration = async (paymentReference: string) => {
    setLoading(true);
    setPollingStatus('Payment received! Creating your account...');
    
    try {
      console.log('Creating company account with payment reference:', paymentReference);
      toast.info('Verifying payment and setting up your account...');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-668731fc/company/register`,
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
            paymentReference: paymentReference,
            selectedLicenses: formData.licenses,
          }),
        }
      );

      // Safely parse response - handle non-JSON responses
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        console.error('Server response (not JSON):', text);
        throw new Error(`Server error (status ${response.status}). Please contact support with payment reference: ${paymentReference}`);
      }
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to create company account';
        console.error('Registration failed:', errorMessage);
        throw new Error(errorMessage + ` (Payment reference: ${paymentReference})`);
      }

      console.log('Company created successfully:', data);
      toast.success(`🎉 Success! Your company "${formData.companyName}" has been created with ${data.licenses || formData.licenses} licenses!`, {
        duration: 6000,
      });
      
      setPollingStatus('Account created successfully! Redirecting to login...');
      
      // Redirect to login after showing success message
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      setPollingStatus(null);
      toast.error(error.message || 'Failed to create company account. Please contact support.', {
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      {/* Floating Settings Button */}
      {!paystackPublicKey && (
        <button
          onClick={() => navigate('/dev-settings')}
          className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
          title="Configure Paystack"
        >
          <Settings className="h-5 w-5" />
        </button>
      )}
      
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
                    placeholder="Blumebyte"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                    disabled={loading || paymentWindowOpened}
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
                    placeholder="Blume Byte"
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
                    className={
                      formData.billingCycle === 'monthly'
                        ? 'p-4 border-2 rounded-lg text-left transition-all border-blue-600 bg-blue-50'
                        : 'p-4 border-2 rounded-lg text-left transition-all border-gray-200 hover:border-gray-300'
                    }
                    disabled={loading || paymentWindowOpened}
                  >
                    <div className="font-semibold">Monthly</div>
                    <div className="text-2xl font-bold mt-1">$6<span className="text-sm font-normal text-gray-600">/user/mo</span></div>
                    <div className="text-xs text-gray-600 mt-1">Billed monthly</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">₵{(6 * USD_TO_GHS).toFixed(2)} GHS</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, billingCycle: 'yearly' })}
                    className={
                      formData.billingCycle === 'yearly'
                        ? 'p-4 border-2 rounded-lg text-left transition-all relative border-blue-600 bg-blue-50'
                        : 'p-4 border-2 rounded-lg text-left transition-all relative border-gray-200 hover:border-gray-300'
                    }
                    disabled={loading || paymentWindowOpened}
                  >
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Save 17%
                    </div>
                    <div className="font-semibold">Yearly</div>
                    <div className="text-2xl font-bold mt-1">$5<span className="text-sm font-normal text-gray-600">/user/mo</span></div>
                    <div className="text-xs text-gray-600 mt-1">Billed annually ($60/user/year)</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">₵{(5 * USD_TO_GHS).toFixed(2)} GHS</div>
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
                  <span className="text-gray-600">Price per license (USD):</span>
                  <span className="font-medium">${pricePerLicenseUSD}/{formData.billingCycle === 'monthly' ? 'mo' : 'mo'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per license (GHS):</span>
                  <span className="font-medium">₵{pricePerLicenseGHS.toFixed(2)}/{formData.billingCycle === 'monthly' ? 'mo' : 'mo'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Billing period:</span>
                  <span className="font-medium">{formData.billingCycle === 'monthly' ? 'Monthly' : 'Yearly (12 months)'}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Total (USD):</span>
                    <span>${totalAmountUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-1">
                    <span>Total (GHS):</span>
                    <span className="text-blue-600">₵{totalAmountGHS.toFixed(2)}</span>
                  </div>
                  {formData.billingCycle === 'yearly' && (
                    <p className="text-xs text-gray-600 text-right mt-1">
                      You save ₵{((formData.licenses * 12) * USD_TO_GHS).toFixed(2)} GHS compared to monthly billing
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

              {/* Paystack Configuration Warning */}
              {!paystackPublicKey && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-yellow-900">Payment Configuration Required</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Paystack public key is not configured. Click below to set it up.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate('/dev-settings')}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
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
                Secure payment powered by Paystack. Your account will be created immediately after successful payment.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                <p className="text-xs text-gray-700 text-center">
                  <strong>Need help?</strong> If you encounter any issues during payment or account creation, 
                  please contact us at <a href="https://blumebyte.com/contact/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">blumebyte.com/contact</a> with your payment reference.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}