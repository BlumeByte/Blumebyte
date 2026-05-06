import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, BarChart3, Clock, DollarSign, Trophy, UserCheck, Shield, Zap, FileText, Calendar, Award, CheckCircle2 } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { SharedNavigation } from '../components/SharedNavigation';

export default function PlatformOverview() {
  const navigate = useNavigate();

  const modules = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Complete employee lifecycle management from hire to retire',
      features: ['Employee profiles', 'Organization charts', 'Department management', 'Role-based access']
    },
    {
      icon: Clock,
      title: 'Time & Attendance',
      description: 'Track work hours and attendance with precision',
      features: ['Clock in/out', 'Shift management', 'Overtime tracking', 'Real-time monitoring']
    },
    {
      icon: FileText,
      title: 'Leave Management',
      description: 'Streamline leave requests and approvals',
      features: ['Leave requests', 'Approval workflows', 'Leave balance tracking', 'Calendar integration']
    },
    {
      icon: DollarSign,
      title: 'Payroll',
      description: 'Accurate and timely payroll processing',
      features: ['Payroll processing', 'Pay slips', 'Tax calculations', 'Payment history']
    },
    {
      icon: Trophy,
      title: 'Performance Management',
      description: 'Drive employee performance and growth',
      features: ['Performance reviews', 'Goal setting', 'Feedback system', '360° evaluations']
    },
    {
      icon: UserCheck,
      title: 'Recruitment',
      description: 'Attract and hire top talent',
      features: ['Job postings', 'Applicant tracking', 'Interview scheduling', 'Candidate pipeline']
    },
    {
      icon: Award,
      title: 'Compensation',
      description: 'Manage salaries, bonuses, and benefits',
      features: ['Pay grades', 'Bonus management', 'Benefits administration', 'Compensation planning']
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Data-driven insights for better decisions',
      features: ['Custom reports', 'HR dashboards', 'Workforce analytics', 'Export capabilities']
    },
    {
      icon: Shield,
      title: 'Security & Compliance',
      description: 'Enterprise-grade security and compliance',
      features: ['2FA authentication', 'Audit logs', 'Role permissions', 'Data encryption']
    },
  ];

  return (
    <div className="min-h-screen public-page-bg">
      {/* Navigation */}
      <SharedNavigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/5716030/pexels-photo-5716030.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Complete HR Platform for Modern Teams
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Everything you need to manage your workforce in one powerful, intuitive platform. 
              From employee management to analytics, we've got you covered.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
                Get Started Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="border-white bg-transparent text-white hover:bg-white hover:text-black">
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Modules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black">
            All-in-One HR Solution
          </h2>
          <p className="text-lg text-gray-600">
            Powerful modules that work together seamlessly
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => (
            <Card key={index} className="glass-public hover-lift border-gray-200 hover:border-black transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <module.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{module.title}</CardTitle>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {module.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-black shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Integration Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">Built for Scalability</h2>
            <p className="text-lg text-gray-600">
              From 2 to 2,000 employees, our platform grows with you
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-public hover-lift border-gray-200">
              <CardHeader>
                <Zap className="h-10 w-10 text-black mb-4" />
                <CardTitle>Fast Implementation</CardTitle>
                <CardDescription>
                  Get up and running in days with our guided onboarding process
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-public hover-lift border-gray-200">
              <CardHeader>
                <Shield className="h-10 w-10 text-black mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level encryption and compliance with global standards
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="glass-public hover-lift border-gray-200">
              <CardHeader>
                <Users className="h-10 w-10 text-black mb-4" />
                <CardTitle>24/7 Support</CardTitle>
                <CardDescription>
                  Award-winning customer support whenever you need help
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-black text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of companies using Blumebyte to transform their HR operations
            </p>
            <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Get Started Now
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-600">© 2026 Blumebyte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}