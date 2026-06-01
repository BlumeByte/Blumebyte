import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Building2, User, Loader2, CreditCard, Check, Users, ChevronRight, ChevronLeft, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { publicAnonKey } from '../utils/supabase/info';
import { fetchFunctionsUrl } from '../lib/functions-base';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function CompanySignup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Company Info, 2 = License Selection & Payment
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [paystackPublicKey, setPaystackPublicKey] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companySize: '',
    industry: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    licenses: 2,
    billingCycle: 'monthly' as 'monthly' | 'yearly',
  });
  const [customIndustry, setCustomIndustry] = useState('');

  // Payment tracking
  const [paymentWindowOpened, setPaymentWindowOpened] = useState(false);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const currencySymbols: Record<string, string> = {
    GHS: '₵',
    NGN: '₦',
    USD: '$',
  };
  const minLicenses = Number(paymentConfig?.minLicenses || 2);
  const currency = paymentConfig?.currency || 'GHS';
  const currencySymbol = currencySymbols[currency] || `${currency} `;
  const monthlyPricing = paymentConfig?.pricing?.monthly;
  const yearlyPricing = paymentConfig?.pricing?.yearly;
  const pricePerLicenseUSD = formData.billingCycle === 'monthly'
    ? Number(monthlyPricing?.amountUsd || 3.55)
    : Number(yearlyPricing?.monthlyEquivalentUsd || 2.55);
  const pricePerLicenseDisplay = formData.billingCycle === 'monthly'
    ? Number(monthlyPricing?.amountDisplay || 0)
    : Number(yearlyPricing?.monthlyEquivalentDisplay || 0);
  const billingPeriod = formData.billingCycle === 'yearly' ? 12 : 1;
  const totalAmountUSD = formData.licenses * pricePerLicenseUSD * billingPeriod;
  const totalAmountDisplay = formData.billingCycle === 'monthly'
    ? formData.licenses * Number(monthlyPricing?.amountDisplay || 0)
    : formData.licenses * Number(yearlyPricing?.amountDisplay || 0);

  // Check if Paystack script is loaded
  useEffect(() => {
    const checkPaystack = () => {
      if (typeof (window as any).PaystackPop !== 'undefined') {
        setPaystackLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkPaystack()) return;


    // Try to load the script dynamically if not already loaded
    const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => {
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

  // Fetch Paystack payment configuration from the backend
  useEffect(() => {
    const fetchPublicKey = async () => {
      try {
        const response = await fetchFunctionsUrl('/paystack/public-key', {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || 'Payment system is not configured');
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Payment system returned an invalid response');
        }

        const data = await response.json();

        if (data.publicKey) {
          setPaystackPublicKey(data.publicKey);
          setPaymentConfig(data);
        } else {
          throw new Error(data.error || 'Payment public key is missing');
        }
      } catch (error: any) {
        console.warn('Paystack configuration unavailable:', error.message);
        toast.error(
          error.message || 'Payment system is unavailable. Please contact support.',
          { duration: 8000 }
        );
      }
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

    // Validate custom industry if "other" is selected
    if (formData.industry === 'other' && !customIndustry.trim()) {
      toast.error('Please specify your industry');
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
        const res = await fetchFunctionsUrl(
          `/company/payment-status/${reference}`,
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
          toast.success('Payment successful! Account setup complete.', { duration: 5000 });
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
    if (formData.licenses < minLicenses) {
      toast.error(`Please select at least ${minLicenses} licenses`);
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

      const quoteResponse = await fetchFunctionsUrl(
        `/paystack/registration-quote?licenses=${encodeURIComponent(String(formData.licenses))}&plan=${encodeURIComponent(formData.billingCycle)}`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const quote = await quoteResponse.json().catch(() => null);
      if (!quoteResponse.ok || !quote?.amountSmallestUnit || !quote?.currency) {
        throw new Error(quote?.error || 'Failed to calculate payment amount');
      }

      // Initialize Paystack payment directly (using inline popup)
      const paystackHandler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: formData.adminEmail.toLowerCase(),
        amount: quote.amountSmallestUnit,
        currency: quote.currency,
        ref: `blumebyte_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        metadata: {
          companyName: formData.companyName,
          adminName: formData.adminName,
          licenses: formData.licenses,
          plan: formData.billingCycle,
          email: formData.adminEmail.toLowerCase(),
          amountUsd: quote.amountUsd,
        },
        callback: function(response: any) {
          // Use regular function (not async) as Paystack requires
          setPendingReference(response.reference);
          setPaymentWindowOpened(true);
          
          // Create the company account with the payment reference
          // Use setTimeout to make it async without making the callback async
          setTimeout(() => {
            completeRegistration(response.reference);
          }, 100);
        },
        onClose: function() {
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
      toast.info('Verifying payment and setting up your account...');
      
      const response = await fetchFunctionsUrl(
        '/company/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            companySize: formData.companySize,
            industry: formData.industry === 'other' ? customIndustry : formData.industry,
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

      toast.success(`🎉 Success! Your company "${formData.companyName}" has been created with ${data.licenses || formData.licenses} licenses!`, {
        duration: 6000,
      });
      
      setPollingStatus('Account created successfully! Redirecting to login...');
      
      // 2FA is temporarily disabled platform-wide; send users directly to login.
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
                      onValueChange={(value: string) => setFormData({ ...formData, companySize: value })}
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
                      onValueChange={(value: string) => {
                        setFormData({ ...formData, industry: value });
                        if (value !== 'other') {
                          setCustomIndustry('');
                        }
                      }}
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

                {/* Custom Industry Input - shown when "Other" is selected */}
                {formData.industry === 'other' && (
                  <div className="space-y-2">
                    <Label htmlFor="customIndustry">Please specify your industry *</Label>
                    <Input
                      id="customIndustry"
                      placeholder="e.g., Education, Hospitality, Construction"
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      disabled={loading || paymentWindowOpened}
                      required
                    />
                  </div>
                )}
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
                      autoComplete="new-password"
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
                      autoComplete="new-password"
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
                    <div className="text-2xl font-bold mt-1">$3.55<span className="text-sm font-normal text-gray-600">/user/mo</span></div>
                    <div className="text-xs text-gray-600 mt-1">Billed monthly</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      {pricePerLicenseDisplay ? `${currencySymbol}${pricePerLicenseDisplay.toFixed(2)} ${currency}` : 'Server pricing unavailable'}
                    </div>
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
                    <div className="font-semibold">Yearly</div>
                    <div className="text-2xl font-bold mt-1">$2.55<span className="text-sm font-normal text-gray-600">/user/mo</span></div>
                    <div className="text-xs text-gray-600 mt-1">Billed annually ($30.60/user/year)</div>
                    <div className="text-xs text-blue-600 mt-1 font-medium">
                      {yearlyPricing?.monthlyEquivalentDisplay
                        ? `${currencySymbol}${Number(yearlyPricing.monthlyEquivalentDisplay).toFixed(2)} ${currency}/mo`
                        : 'Server pricing unavailable'}
                    </div>
                  </button>
                </div>
              </div>

              {/* License Selection with +/- Buttons */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Employee Licenses
                </h3>

                <div className="flex items-center justify-center gap-6 py-6 bg-gray-50 rounded-lg">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setFormData({ ...formData, licenses: Math.max(minLicenses, formData.licenses - 1) })}
                    disabled={loading || paymentWindowOpened || formData.licenses <= minLicenses}
                    className="w-14 h-14 rounded-full"
                  >
                    <Minus className="h-6 w-6" />
                  </Button>
                  <div className="flex flex-col items-center">
                    <span className="text-5xl font-bold text-blue-600">{formData.licenses}</span>
                    <span className="text-sm text-gray-600 mt-1">employee {formData.licenses === 1 ? 'license' : 'licenses'}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setFormData({ ...formData, licenses: formData.licenses + 1 })}
                    disabled={loading || paymentWindowOpened}
                    className="w-14 h-14 rounded-full"
                  >
                    <Plus className="h-6 w-6" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Each license allows one employee to access the platform. Minimum purchase: {minLicenses} licenses.
                </p>
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
                  <span className="text-gray-600">Price per license ({currency}):</span>
                  <span className="font-medium">
                    {pricePerLicenseDisplay ? `${currencySymbol}${pricePerLicenseDisplay.toFixed(2)}/mo` : 'Unavailable'}
                  </span>
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
                    <span>Total ({currency}):</span>
                    <span className="text-blue-600">
                      {totalAmountDisplay ? `${currencySymbol}${totalAmountDisplay.toFixed(2)}` : 'Calculated at checkout'}
                    </span>
                  </div>
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
                        Paystack keys must be configured on the server before company signup can accept payments.
                      </p>
                    </div>
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
                  disabled={loading || paymentWindowOpened || !paystackPublicKey || !paymentConfig}
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
