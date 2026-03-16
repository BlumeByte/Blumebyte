import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, Users, BarChart3, Shield, Clock, FileText, Zap, TrendingUp, Star, Sparkles } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { HomepageChatAgent } from '../components/HomepageChatAgent';

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Manage your workforce with ease. Track attendance, performance, and more.',
    },
    {
      icon: Clock,
      title: 'Time & Attendance',
      description: 'Clock in/out tracking with real-time monitoring and reports.',
    },
    {
      icon: FileText,
      title: 'Leave Management',
      description: 'Streamline leave requests and approvals with automated workflows.',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Get insights into your workforce with powerful analytics.',
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security with role-based access control.',
    },
    {
      icon: Zap,
      title: 'Automation',
      description: 'Automate routine tasks to save time and reduce errors.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Monthly Plan',
      price: '$6',
      period: '/employee/month',
      billingCycle: 'Billed monthly',
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
      ],
    },
    {
      name: 'Yearly Plan',
      price: '$5',
      period: '/employee/month',
      billingCycle: 'Billed annually at $60/employee',
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
      ],
      popular: true,
      savings: '17% savings',
    },
    {
      name: 'Custom Plan',
      price: 'Contact Us',
      period: '',
      billingCycle: 'Tailored for your needs',
      features: [
        'Everything in Yearly Plan',
        'Custom Integrations',
        'Dedicated Account Manager',
        'White-label Options',
      ],
      contactLink: 'https://blumebyte.com/contact/',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Blumebyte" className="h-8" />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-900 text-sm font-medium mb-6 border border-gray-200">
            <Sparkles className="h-4 w-4" />
            AI-Powered HR Management
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight text-black">
            Modern HR Management for Growing Companies
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Streamline your HR operations with Blumebyte. Manage employees, track attendance, process leave requests, and more - all in one powerful platform.
          </p>
          <p className="text-2xl font-bold text-black mb-8">
            Starting at just $5 per employee/month
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800 text-lg px-8">
              Get Started Now
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gray-50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            Everything you need to manage your team
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features designed for modern HR teams
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-black transition-all hover:shadow-lg bg-white">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-gray-600">
            Choose the plan that's right for your business
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-2 transition-all hover:shadow-xl bg-white ${
                plan.popular ? 'border-black shadow-lg scale-105' : 'border-gray-200'
              }`}
            >
              {plan.popular && plan.savings && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-black text-white text-sm font-medium rounded-full">
                  {plan.savings}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.billingCycle}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-black">{plan.price}</span>
                  <span className="text-gray-600 text-sm">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-black shrink-0 mt-0.5" />
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
                        ? 'bg-black text-white hover:bg-gray-800'
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

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-black border-0 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your HR operations?
            </h2>
            <p className="text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
              Join hundreds of companies already using Blumebyte to streamline their HR processes
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/company-signup')}
              className="text-lg px-8 bg-white text-black hover:bg-gray-100"
            >
              Get Started Today
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img src={logoImage} alt="Blumebyte" className="h-8" />
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate('/security-policy')} className="hover:text-foreground transition-colors">
                Security
              </button>
              <button onClick={() => navigate('/privacy-policy')} className="hover:text-foreground transition-colors">
                Privacy
              </button>
              <button onClick={() => navigate('/terms-conditions')} className="hover:text-foreground transition-colors">
                Terms
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Blumebyte. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Homepage Chat Agent for visitors */}
      <HomepageChatAgent />
    </div>
  );
}