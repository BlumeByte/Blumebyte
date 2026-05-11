import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { SharedNavigation } from '../components/SharedNavigation';

export default function PricingPage() {
  const navigate = useNavigate();

  const pricingPlans = [
    {
      name: 'Monthly Plan',
      price: '$2.59',
      period: '/employee/month',
      billingCycle: 'Billed monthly',
      description: 'Perfect for companies wanting flexibility',
      features: [
        'Operations and Compliance',
        'Performance Management',
        'Organization Management',
        'Compensation and Payroll',
        'Reporting and Analytics',
        'Time and Attendance',
        'People Management',
        'Learning and Development',
        'System Administration',
        'Communication',
        'Documents',
        'Assets',
        'Employee Self-Service Portal',
        'Leave Management',
        'Recruitment & Hiring',
        '24/7 Support',
      ],
    },
    {
      name: 'Yearly Plan',
      price: '$3.59',
      period: '/employee/month',
      billingCycle: 'Billed annually at $43.08/employee',
      description: 'Best value for growing companies',
      features: [
        'Operations and Compliance',
        'Performance Management',
        'Organization Management',
        'Compensation and Payroll',
        'Reporting and Analytics',
        'Time and Attendance',
        'People Management',
        'Learning and Development',
        'System Administration',
        'Communication',
        'Documents',
        'Assets',
        'Employee Self-Service Portal',
        'Leave Management',
        'Recruitment & Hiring',
        '24/7 Support',
        'Priority Support',
        'Quarterly Business Reviews',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      billingCycle: 'Tailored for your needs',
      description: 'For large organizations with specific requirements',
      features: [
        'Everything in Yearly Plan',
        'Custom Integrations',
        'Dedicated Account Manager',
        'White-label Options',
        'Advanced Security Features',
        'Custom SLA',
        'Onboarding Support',
        'Training Sessions',
      ],
      contactLink: 'https://blumebyte.com/contact/',
    },
  ];

  const faqs = [
    {
      question: 'What is included in the free trial?',
      answer: 'The free trial includes full access to all features for 14 days. No credit card required.'
    },
    {
      question: 'How is pricing calculated?',
      answer: 'Pricing is per employee per month. The minimum purchase is 2 licenses.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards and bank transfers via Paystack.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No, there are no setup fees or hidden costs. Pay only for what you use.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied.'
    },
  ];

  return (
    <div className="min-h-screen public-page-bg">
      {/* Navigation */}
      <SharedNavigation />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-mint-black">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            No hidden fees. No surprises. Just powerful HR management at an affordable price.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`glass-public hover-lift relative border transition-all hover:shadow-xl ${
                plan.popular ? 'border-mint-green shadow-lg scale-105' : 'border-mint-green/20'
              }`}
            >
              {plan.popular && plan.savings && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-mint-black text-white text-sm font-medium rounded-full">
                  {plan.savings}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl text-mint-black">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-mint-black">{plan.price}</span>
                  <span className="text-gray-600 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.billingCycle}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-mint-green shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.contactLink ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => window.open(plan.contactLink, '_blank')}
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-mint-black text-white hover:bg-[#1a3525]'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/company-signup')}
                  >
                    Get Started
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-mint py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-mint-black">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know about pricing</p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass-public hover-lift border border-mint-green/20">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                  <CardDescription>{faq.answer}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-mint-black text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Our team is here to help you find the perfect plan for your business
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-mint-white text-mint-black hover:bg-mint-green-light">
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open('https://blumebyte.com/contact/', '_blank')} className="border-white bg-transparent text-white hover:bg-white hover:text-mint-black">
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-mint-green/15 bg-mint-white/80 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-600">© 2026 Blumebyte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
