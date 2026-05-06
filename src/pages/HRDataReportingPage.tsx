import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart3, FileText, TrendingUp, PieChart, Users, Clock, DollarSign, Target, Shield, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function HRDataReportingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Deep insights into workforce trends, turnover, and productivity metrics with customizable dashboards.',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Reporting',
      description: 'Get up-to-the-minute data on attendance, performance, and key HR metrics.',
    },
    {
      icon: PieChart,
      title: 'Custom Reports',
      description: 'Build custom reports tailored to your specific business needs and compliance requirements.',
    },
    {
      icon: Users,
      title: 'Headcount Analytics',
      description: 'Track workforce growth, department distribution, and hiring trends over time.',
    },
    {
      icon: Clock,
      title: 'Time & Attendance Reports',
      description: 'Analyze attendance patterns, overtime, and time-off trends across your organization.',
    },
    {
      icon: DollarSign,
      title: 'Compensation Analytics',
      description: 'Benchmark salaries, track compensation costs, and ensure pay equity.',
    },
  ];

  const benefits = [
    'Make data-driven decisions with real-time insights',
    'Identify trends and patterns before they become problems',
    'Ensure compliance with automated reporting',
    'Export reports in multiple formats (PDF, Excel, CSV)',
    'Schedule automated report delivery to stakeholders',
    'Role-based access to sensitive data',
  ];

  return (
    <div className="min-h-screen public-page-bg">
      <SharedNavigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6">
              <FileText className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              HR Data & Reporting
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Transform your HR data into actionable insights with powerful analytics and custom reporting tools.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Powerful Reporting Features</h2>
          <p className="text-lg text-gray-600">
            Everything you need to analyze and understand your workforce
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glass-public hover-lift border-gray-200">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-black mb-4" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">Why Choose Our Reporting?</h2>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-black shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-gray-200">
              <h3 className="text-2xl font-bold mb-4 text-black">Key Metrics Dashboard</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Employee Turnover</span>
                    <span className="text-sm font-bold text-black">8.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full" style={{ width: '8.5%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Time to Hire</span>
                    <span className="text-sm font-bold text-black">21 days</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Employee Satisfaction</span>
                    <span className="text-sm font-bold text-black">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-black h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to unlock your HR data?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Start making data-driven decisions with powerful analytics
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
            Get Started Now
          </Button>
        </div>
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