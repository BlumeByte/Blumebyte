import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Target, Heart, Zap, Users, Award, Globe, Shield, TrendingUp } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { SharedNavigation } from '../components/SharedNavigation';

export default function AboutPage() {
  const navigate = useNavigate();

  const values = [
    {
      icon: Heart,
      title: 'People First',
      description: 'We put people at the center of everything we do. Our platform is designed to make HR professionals\' lives easier and employees happier.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'We constantly innovate to deliver cutting-edge HR technology that helps businesses stay ahead of the curve.'
    },
    {
      icon: Shield,
      title: 'Security & Trust',
      description: 'We take security seriously. Bank-level encryption and compliance with global standards keep your data safe.'
    },
    {
      icon: Globe,
      title: 'Global Mindset',
      description: 'Built for companies of all sizes, from startups to enterprises, across all industries and geographies.'
    },
  ];

  const stats = [
    { value: '500+', label: 'Companies Trust Us' },
    { value: '50K+', label: 'Employees Managed' },
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '24/7', label: 'Customer Support' },
  ];

  const team = [
    {
      name: 'Leadership Team',
      description: 'Experienced leaders with decades of combined experience in HR technology',
      icon: Target
    },
    {
      name: 'Engineering',
      description: 'World-class engineers building the future of HR management',
      icon: Zap
    },
    {
      name: 'Customer Success',
      description: 'Dedicated team ensuring your success with our platform',
      icon: Heart
    },
    {
      name: 'Product',
      description: 'Innovative product team creating features you\'ll love',
      icon: Award
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <SharedNavigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              We're Building the Future of HR Management
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Blumebyte was founded with a simple mission: make HR management simple, efficient, and accessible for companies of all sizes. Today, we're helping hundreds of companies transform their HR operations.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-black mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">Our Mission</h2>
              <p className="text-lg text-gray-600 mb-4">
                To empower organizations with intuitive HR technology that simplifies workforce management and helps businesses focus on what matters most - their people.
              </p>
              <p className="text-lg text-gray-600 mb-4">
                We believe that great HR software should be powerful yet simple, comprehensive yet intuitive. That's why we've built Blumebyte from the ground up with user experience at its core.
              </p>
              <p className="text-lg text-gray-600">
                Every feature we build, every decision we make, is guided by one principle: helping you manage your workforce more effectively.
              </p>
            </div>
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Our Vision</CardTitle>
                <CardDescription className="text-base">
                  To become the world's most trusted and user-friendly HR management platform, enabling businesses to build better workplaces and stronger teams.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Our Core Values</h2>
          <p className="text-lg text-gray-600">The principles that guide everything we do</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value, index) => (
            <Card key={index} className="border-2 border-gray-200 hover:border-black transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{value.title}</CardTitle>
                <CardDescription>{value.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">Meet Our Team</h2>
            <p className="text-lg text-gray-600">Passionate professionals dedicated to your success</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((department, index) => (
              <Card key={index} className="border-2 border-gray-200 bg-white">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center mb-3">
                    <department.icon className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg">{department.name}</CardTitle>
                  <CardDescription>{department.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Why Companies Choose Blumebyte</h2>
          <p className="text-lg text-gray-600">What sets us apart from the competition</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-black mb-4" />
              <CardTitle>Easy to Use</CardTitle>
              <CardDescription>
                Intuitive interface that requires minimal training. Your team will be productive from day one.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <Award className="h-10 w-10 text-black mb-4" />
              <CardTitle>Award-Winning Support</CardTitle>
              <CardDescription>
                24/7 customer support from real people who care about your success. No bots, no scripts.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <Zap className="h-10 w-10 text-black mb-4" />
              <CardTitle>Constantly Improving</CardTitle>
              <CardDescription>
                Regular updates with new features and improvements based on customer feedback.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Join Us on Our Journey</h2>
          <p className="text-lg text-gray-300 mb-8">
            Be part of the HR revolution. Start using Blumebyte today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/contact')} className="border-white text-white hover:bg-white hover:text-black">
              Contact Us
            </Button>
          </div>
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