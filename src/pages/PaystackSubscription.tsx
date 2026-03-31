import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Users, TrendingUp, Zap, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { api } from '../lib/api-client';
import { useAuth } from '../lib/auth-context';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

interface Plan {
  id: string;
  name: string;
  price: number;
  licenses: number;
  features: string[];
  popular?: boolean;
}

export default function PaystackSubscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<any>(null);

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 15000,
      licenses: 10,
      features: [
        'Up to 10 employees',
        'Employee Management',
        'Leave Management',
        'Basic Reports',
        'Email Support',
        'Mobile Access',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 35000,
      licenses: 50,
      features: [
        'Up to 50 employees',
        'Everything in Starter',
        'Advanced Analytics',
        'Time Tracking & Attendance',
        'Payroll Integration',
        'Priority Support',
        'Custom Workflows',
        'API Access',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 75000,
      licenses: 200,
      features: [
        'Up to 200 employees',
        'Everything in Professional',
        'Dedicated Account Manager',
        'Custom Integrations',
        'SLA Guarantee',
        'Advanced Security',
        'Multi-location Support',
        'Custom Training',
      ],
    },
  ];

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  const loadCompanyInfo = async () => {
    try {
      const data = await api('/company/info');
      setCompanyInfo(data);
    } catch (error) {
      console.error('Error loading company info:', error);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    if (loading) return;
    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      // Initialize Paystack payment
      const response = await api('/subscription/initialize-payment', {
        method: 'POST',
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price,
          licenses: plan.licenses,
        }),
      });

      if (!response.authorizationUrl) {
        throw new Error('Failed to initialize payment');
      }

      // Redirect to Paystack payment page
      window.location.href = response.authorizationUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleUpgradeLicenses = async (additionalLicenses: number) => {
    if (loading) return;
    setLoading(true);

    try {
      const pricePerLicense = 1500; // ₦1,500 per additional license
      const totalAmount = additionalLicenses * pricePerLicense;

      const response = await api('/subscription/upgrade-licenses', {
        method: 'POST',
        body: JSON.stringify({
          additionalLicenses,
          amount: totalAmount,
        }),
      });

      if (!response.authorizationUrl) {
        throw new Error('Failed to initialize payment');
      }

      window.location.href = response.authorizationUrl;
    } catch (error: any) {
      toast.error(error.message || 'Failed to upgrade licenses');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logoImage} alt="Blumebyte" className="h-12" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Plan
          </h2>
          <p className="text-muted-foreground">
            Starting at just $5 per employee/month
          </p>
        </div>

        {/* Current Subscription Info */}
        {companyInfo?.subscription && (
          <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Current Plan: {companyInfo.subscription.plan || 'None'}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {companyInfo.subscription.licenses} licenses • {companyInfo.subscription.usedLicenses || 0} used
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {companyInfo.subscription.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border-2 transition-all hover:shadow-xl ${
                plan.popular ? 'border-blue-600 shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.licenses} employee licenses</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₦{plan.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading && selectedPlan !== plan.id}
                >
                  {loading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Subscribe Now'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add More Licenses */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Need More Licenses?
            </CardTitle>
            <CardDescription>
              Purchase additional licenses at ₦1,500 per employee/month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[5, 10, 25, 50].map((count) => (
                <Button
                  key={count}
                  variant="outline"
                  className="h-auto py-4 flex flex-col items-center gap-2"
                  onClick={() => handleUpgradeLicenses(count)}
                  disabled={loading}
                >
                  <Users className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold">+{count} Licenses</span>
                  <span className="text-sm text-muted-foreground">
                    ₦{(count * 1500).toLocaleString()}/mo
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Features Comparison */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Instant Activation</h3>
              <p className="text-sm text-muted-foreground">
                Your account is activated immediately after payment
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-sm text-muted-foreground">
                Powered by Paystack - Nigeria's most trusted payment platform
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Flexible Scaling</h3>
              <p className="text-sm text-muted-foreground">
                Upgrade or add licenses anytime as your team grows
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/superadmin')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}