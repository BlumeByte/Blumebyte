import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, Users, BarChart3, Shield, Clock, FileText, Zap, TrendingUp, Star, Sparkles } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

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
        'Employee Management',
        'Leave Management',
        'Time & Attendance',
        'Basic Reports',
        'Email Support',
      ],
    },
    {
      name: 'Yearly Plan',
      price: '$5',
      period: '/employee/month',
      billingCycle: 'Billed annually at $60/employee',
      features: [
        'Everything in Monthly Plan',
        'Save $12 per employee/year',
        'Advanced Analytics',
        'Priority Support',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="Blumebyte" className="h-8" />
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/company-signup')} className="bg-gradient-to-r from-blue-600 to-purple-600">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered HR Management
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Modern HR Management for Growing Companies
          </h1>
          <p className="text-xl text-muted-foreground mb-4 max-w-2xl mx-auto">
            Streamline your HR operations with Blumebyte. Manage employees, track attendance, process leave requests, and more - all in one powerful platform.
          </p>
          <p className="text-2xl font-bold text-blue-600 mb-8">
            Starting at just $5 per employee/month
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-8">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/demo')}>
              Watch Demo
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to manage your team
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed for modern HR teams
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 hover:border-primary transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that's right for your business
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`relative border-2 transition-all hover:shadow-xl ${
                plan.popular ? 'border-blue-600 shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && plan.savings && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-full">
                  {plan.savings}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.billingCycle}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
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
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/company-signup')}
                  >
                    Start Free Trial
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your HR operations?
            </h2>
            <p className="text-lg mb-8 opacity-90 max-w-2xl mx-auto">
              Join hundreds of companies already using Blumebyte to streamline their HR processes
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/company-signup')}
              className="text-lg px-8"
            >
              Start Your Free Trial
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img src={logoImage} alt="Blumebyte" className="h-8" />
            <p className="text-sm text-muted-foreground">
              © 2026 Blumebyte. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}