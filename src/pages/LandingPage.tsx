import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, Users, BarChart3, Shield, Clock, FileText, Zap, TrendingUp, Star, Sparkles, Building2, Heart, Briefcase, GraduationCap, Award, Target, TrendingUp as Growth, Book, Calendar, DollarSign, FileCheck, Globe, UserCheck, Trophy, Video } from 'lucide-react';
import { HomepageChatAgent } from '../components/HomepageChatAgent';
import { TechSliders3D } from '../components/TechSliders3D';
import { HeroUIUXAnimation } from '../components/HeroUIUXAnimation';
import { PublicNavbar, PublicFooter } from '../components/PublicNavFooter';

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
    <div className="min-h-screen public-page-bg">
      <PublicNavbar />

      {/* Hero Section with Background Image */}
      <section className="relative overflow-hidden min-h-[700px]">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1769685528172-b74293fdeebd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBvZmZpY2UlMjB0ZWFtJTIwY29sbGFib3JhdGlvbnxlbnwxfHx8fDE3NzUwMjY2NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/85 to-black/90" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side: Text Content */}
            <div className="text-left space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium border border-white/20">
                <Sparkles className="h-4 w-4" />
                AI-Powered HR Management
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-white">
                Modern HR Management for Growing Companies
              </h1>
              <p className="text-xl text-gray-200">
                Streamline your HR operations with Blumebyte. Manage employees, track attendance, process leave requests, and more - all in one powerful platform.
              </p>
              <p className="text-2xl font-bold text-white">
                Starting at just $5 per employee/month
              </p>
              <div className="flex gap-4 pt-4">
                <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-mint-white text-mint-black hover:bg-mint-green-light text-lg px-8">
                  Get Started Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="border-white text-white hover:bg-white hover:text-mint-black text-lg px-8">
                  View Pricing
                </Button>
              </div>
            </div>

            {/* Right side: 3D UI/UX Animation */}
            <div className="hidden lg:flex items-center justify-center h-[600px]">
              <HeroUIUXAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Tech Sliders Section */}
      <TechSliders3D />

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">
            Everything you need to manage your team
          </h2>
          <p className="text-lg text-gray-600">
            Powerful features designed for modern HR teams
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glass-public hover-lift border hover:border-mint-green transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-mint-black flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-mint-black">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform Overview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">
            A Complete HR Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From hiring to retirement, manage every aspect of your employee lifecycle in one place
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="glass-public hover-lift border hover:border-mint-green transition-all">
            <CardHeader>
              <UserCheck className="h-10 w-10 text-mint-green mb-4" />
              <CardTitle className="text-mint-black">Hire & Onboard</CardTitle>
              <CardDescription className="text-sm">
                Attract top talent with our applicant tracking system and create seamless onboarding experiences
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-public hover-lift border hover:border-mint-green transition-all">
            <CardHeader>
              <Growth className="h-10 w-10 text-mint-green mb-4" />
              <CardTitle className="text-mint-black">Grow & Develop</CardTitle>
              <CardDescription className="text-sm">
                Foster employee growth with performance management, training, and development tools
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="glass-public hover-lift border hover:border-mint-green transition-all">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-mint-green mb-4" />
              <CardTitle className="text-mint-black">Analyze & Optimize</CardTitle>
              <CardDescription className="text-sm">
                Make data-driven decisions with comprehensive HR analytics and reporting
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">
              Built for Your Industry
            </h2>
            <p className="text-lg text-gray-600">
              Tailored solutions for businesses across all sectors
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Technology', icon: Zap },
              { name: 'Healthcare', icon: Heart },
              { name: 'Finance', icon: DollarSign },
              { name: 'Education', icon: GraduationCap },
              { name: 'Construction', icon: Building2 },
              { name: 'Manufacturing', icon: Briefcase },
            ].map((industry, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center justify-center p-6 glass-public rounded-lg hover:border-mint-green transition-all group"
              >
                <industry.icon className="h-8 w-8 text-mint-green/60 group-hover:text-mint-green mb-3 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-mint-black transition-colors">
                  {industry.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">
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
                <CardDescription className="text-sm">{plan.billingCycle}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-mint-black">{plan.price}</span>
                  <span className="text-gray-600 text-sm">{plan.period}</span>
                </div>
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

      {/* Why Blumebyte Section */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">
              Why Companies Choose Blumebyte
            </h2>
            <p className="text-lg text-gray-600">
              Award-winning platform trusted by growing businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-public hover-lift border border-mint-green/20">
              <CardHeader>
                <Trophy className="h-10 w-10 text-mint-green mb-4" />
                <CardTitle className="text-mint-black">Award-Winning Support</CardTitle>
                <CardDescription>
                  24/7 customer support with industry-leading response times and satisfaction rates
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="glass-public hover-lift border border-mint-green/20">
              <CardHeader>
                <Shield className="h-10 w-10 text-mint-green mb-4" />
                <CardTitle className="text-mint-black">Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level encryption, 2FA, and compliance with global data protection standards
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="glass-public hover-lift border border-mint-green/20">
              <CardHeader>
                <Zap className="h-10 w-10 text-mint-green mb-4" />
                <CardTitle className="text-mint-black">Easy Implementation</CardTitle>
                <CardDescription>
                  Get up and running in days, not months, with guided onboarding and migration support
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-mint-black border-0 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your HR operations?
            </h2>
            <p className="text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
              Join hundreds of companies already using Blumebyte to streamline their HR processes
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/company-signup')}
                className="text-lg px-8 bg-mint-white text-mint-black hover:bg-mint-green-light"
              >
                Get Started Today
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open('https://blumebyte.com/contact/', '_blank')}
                className="text-lg px-8 border-white text-white hover:bg-white hover:text-mint-black"
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <PublicFooter />

      {/* Homepage Chat Agent for visitors */}
      <HomepageChatAgent />
    </div>
  );
}