import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, Users, BarChart3, Shield, Clock, FileText, Zap, TrendingUp, Star, Sparkles, ChevronDown, Building2, Heart, Briefcase, GraduationCap, Award, Target, TrendingUp as Growth, Book, Calendar, DollarSign, FileCheck, Globe, UserCheck, Trophy, Video } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { HomepageChatAgent } from '../components/HomepageChatAgent';
import { Monochrome3DBackground } from '../components/Monochrome3DBackground';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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

  // Dropdown menu content
  const platformMenu = [
    {
      title: 'Core Platform',
      items: [
        { name: 'Platform Overview', icon: BarChart3, description: 'Complete HR management solution' },
        { name: 'HR Data & Reporting', icon: FileText, description: 'Advanced analytics and insights' },
        { name: 'Time & Attendance', icon: Clock, description: 'Clock in/out and time tracking' },
      ]
    },
    {
      title: 'Workforce Management',
      items: [
        { name: 'Payroll', icon: DollarSign, description: 'Streamlined payroll processing' },
        { name: 'Performance Management', icon: Trophy, description: 'Track and improve performance' },
        { name: 'Compensation', icon: Award, description: 'Manage pay grades and bonuses' },
      ]
    },
    {
      title: 'Talent & Growth',
      items: [
        { name: 'Applicant Tracking', icon: UserCheck, description: 'Recruit and hire top talent' },
        { name: 'Onboarding', icon: Users, description: 'Seamless new hire experience' },
        { name: 'Employee Experience', icon: Heart, description: 'Boost engagement and satisfaction' },
      ]
    }
  ];

  const solutionsMenu = [
    {
      title: 'By Industry',
      items: [
        { name: 'Construction', icon: Building2 },
        { name: 'Education', icon: GraduationCap },
        { name: 'Finance', icon: DollarSign },
        { name: 'Healthcare', icon: Heart },
        { name: 'Manufacturing', icon: Briefcase },
        { name: 'Technology', icon: Zap },
      ]
    },
    {
      title: 'By Company Size',
      items: [
        { name: 'Startups', icon: Sparkles },
        { name: 'Small Companies (1-50)', icon: Users },
        { name: 'Mid-sized (51-200)', icon: Building2 },
        { name: 'Large Companies (200+)', icon: Globe },
      ]
    },
    {
      title: 'By Stakeholder',
      items: [
        { name: 'Executives', icon: Target },
        { name: 'HR Leaders', icon: Users },
        { name: 'Finance Teams', icon: DollarSign },
        { name: 'IT Departments', icon: Shield },
      ]
    }
  ];

  const resourcesMenu = [
    {
      title: 'Learn',
      items: [
        { name: 'HR Toolkit', icon: Briefcase, description: 'Templates and tools' },
        { name: 'Content Library', icon: Book, description: 'Guides and resources' },
        { name: 'HR Glossary', icon: FileText, description: 'Industry terminology' },
        { name: 'Webinar Library', icon: Video, description: 'On-demand videos' },
        { name: 'Events Hub', icon: Calendar, description: 'Upcoming events' },
        { name: 'HR Virtual Summit', icon: Trophy, description: 'Annual conference' },
      ]
    }
  ];

  const whyBlumebyte = [
    {
      title: 'Award-Winning Support',
      items: [
        { name: 'Award-Winning Service', icon: Trophy, description: '24/7 customer support' },
        { name: 'Case Studies', icon: FileCheck, description: 'Success stories' },
        { name: 'Implementation Support', icon: UserCheck, description: 'Guided onboarding' },
      ]
    }
  ];

  const handleMouseEnter = (menu: string) => {
    setOpenDropdown(menu);
  };

  const handleMouseLeave = () => {
    setOpenDropdown(null);
  };

  const DropdownMenu = ({ menu, content }: { menu: string; content: any[] }) => (
    <div
      className="relative isolate"
      onMouseEnter={() => handleMouseEnter(menu)}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors">
        {menu}
        <ChevronDown className="h-4 w-4" />
      </button>
      
      {openDropdown === menu && (
        <div className="absolute top-full left-0 mt-2 w-[600px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-6">
          <div className="grid grid-cols-2 gap-6">
            {content.map((section, idx) => (
              <div key={idx}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item: any, itemIdx: number) => (
                    <li key={itemIdx}>
                      <button 
                        onClick={() => {
                          setOpenDropdown(null);
                          if (menu === 'Our Platform') {
                            navigate('/platform-overview');
                          } else if (menu === 'Solutions' && section.title === 'By Industry') {
                            navigate(`/industry/${item.name.toLowerCase()}`);
                          } else if (menu === 'Solutions' && (section.title === 'By Company Size' || section.title === 'By Stakeholder')) {
                            // Navigate to platform overview for company size and stakeholder
                            navigate('/platform-overview');
                          } else if (menu === 'Why Blumebyte') {
                            // Navigate to about page for Why Blumebyte items
                            navigate('/about');
                          } else if (menu === 'Resources') {
                            navigate('/resources');
                          }
                        }}
                        className="flex items-start gap-3 w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors group"
                      >
                        <item.icon className="h-5 w-5 text-gray-400 group-hover:text-black mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-black">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white relative isolate">
      <Monochrome3DBackground variant="landing" />
      {/* Navigation */}
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <img src={logoImage} alt="Blumebyte" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
              
              {/* Desktop Navigation with Dropdowns */}
              <div className="hidden md:flex items-center gap-1">
                <DropdownMenu menu="Our Platform" content={platformMenu} />
                <DropdownMenu menu="Solutions" content={solutionsMenu} />
                <DropdownMenu menu="Why Blumebyte" content={whyBlumebyte} />
                <DropdownMenu menu="Resources" content={resourcesMenu} />
                <button 
                  onClick={() => navigate('/pricing')}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                >
                  Pricing
                </button>
              </div>
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

      {/* Platform Overview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            A Complete HR Platform
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From hiring to retirement, manage every aspect of your employee lifecycle in one place
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 border-gray-200 hover:border-black transition-all">
            <CardHeader>
              <UserCheck className="h-10 w-10 text-black mb-4" />
              <CardTitle>Hire & Onboard</CardTitle>
              <CardDescription className="text-sm">
                Attract top talent with our applicant tracking system and create seamless onboarding experiences
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 border-gray-200 hover:border-black transition-all">
            <CardHeader>
              <Growth className="h-10 w-10 text-black mb-4" />
              <CardTitle>Grow & Develop</CardTitle>
              <CardDescription className="text-sm">
                Foster employee growth with performance management, training, and development tools
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 border-gray-200 hover:border-black transition-all">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-black mb-4" />
              <CardTitle>Analyze & Optimize</CardTitle>
              <CardDescription className="text-sm">
                Make data-driven decisions with comprehensive HR analytics and reporting
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
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
                className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-lg hover:border-black transition-all group"
              >
                <industry.icon className="h-8 w-8 text-gray-400 group-hover:text-black mb-3" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-black">
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

      {/* Why Blumebyte Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
              Why Companies Choose Blumebyte
            </h2>
            <p className="text-lg text-gray-600">
              Award-winning platform trusted by growing businesses
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <Trophy className="h-10 w-10 text-black mb-4" />
                <CardTitle>Award-Winning Support</CardTitle>
                <CardDescription>
                  24/7 customer support with industry-leading response times and satisfaction rates
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <Shield className="h-10 w-10 text-black mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level encryption, 2FA, and compliance with global data protection standards
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <Zap className="h-10 w-10 text-black mb-4" />
                <CardTitle>Easy Implementation</CardTitle>
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
        <Card className="bg-black border-0 text-white">
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
                className="text-lg px-8 bg-white text-black hover:bg-gray-100"
              >
                Get Started Today
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open('https://blumebyte.com/contact/', '_blank')}
                className="text-lg px-8 border-white text-white hover:bg-white hover:text-black"
              >
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={logoImage} alt="Blumebyte" className="h-8 mb-4" />
              <p className="text-sm text-gray-600">
                Modern HR management platform for growing companies
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-black mb-3">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><button onClick={() => navigate('/platform-overview')} className="hover:text-black">Overview</button></li>
                <li><button onClick={() => navigate('/features')} className="hover:text-black">Features</button></li>
                <li><button onClick={() => navigate('/integrations')} className="hover:text-black">Integrations</button></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-black">Pricing</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-black mb-3">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><button onClick={() => navigate('/about')} className="hover:text-black">About Us</button></li>
                <li><button onClick={() => navigate('/careers')} className="hover:text-black">Careers</button></li>
                <li><button onClick={() => navigate('/contact')} className="hover:text-black">Contact</button></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-black mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-black">Privacy</button></li>
                <li><button onClick={() => navigate('/terms-conditions')} className="hover:text-black">Terms</button></li>
                <li><button onClick={() => navigate('/security-policy')} className="hover:text-black">Security</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              © 2026 Blumebyte. All rights reserved.
            </p>
            <div className="flex gap-6">
              <button className="text-gray-600 hover:text-black">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </button>
              <button className="text-gray-600 hover:text-black">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Homepage Chat Agent for visitors */}
      <HomepageChatAgent />
    </div>
  );
}
