import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Heart, Globe, TrendingUp, Award, Clock } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function CareersPage() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Comprehensive health insurance, mental health support, and wellness programs'
    },
    {
      icon: Globe,
      title: 'Remote First',
      description: 'Work from anywhere with flexible hours and work-life balance'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Continuous learning budget, conferences, and professional development'
    },
    {
      icon: Award,
      title: 'Competitive Pay',
      description: 'Market-leading salaries, equity, and performance bonuses'
    },
    {
      icon: Clock,
      title: 'Unlimited PTO',
      description: 'Take the time you need to recharge and stay productive'
    },
    {
      icon: Users,
      title: 'Great Team',
      description: 'Work with talented, passionate people who care about making an impact'
    },
  ];

  const values = [
    {
      title: 'Move Fast',
      description: 'We ship quickly, iterate based on feedback, and aren\'t afraid to experiment'
    },
    {
      title: 'Customer Obsessed',
      description: 'Everything we do is driven by making our customers successful'
    },
    {
      title: 'Own It',
      description: 'Take ownership of your work and see projects through from start to finish'
    },
    {
      title: 'Learn & Grow',
      description: 'Embrace challenges, learn from mistakes, and continuously improve'
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
              Build the Future of HR with Us
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Join our team of talented individuals working to transform how companies manage their workforce. We're looking for passionate people who want to make a real impact.
            </p>
            <Button onClick={() => navigate('/contact')} size="lg" className="bg-black text-white hover:bg-gray-800">
              Join Our Team
            </Button>
          </div>
        </div>
      </section>

      {/* Why Work Here Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Why Blumebyte?</h2>
          <p className="text-lg text-gray-600">More than just a job - a place to grow your career</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-2 border-gray-200 hover:border-black transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{benefit.title}</CardTitle>
                <CardDescription>{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">Our Values</h2>
            <p className="text-lg text-gray-600">What drives us every day</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-2 border-gray-200 bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                  <CardDescription>{value.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join Us?</h2>
          <p className="text-lg text-gray-300 mb-8">
            We're always looking for talented people. Send us your resume and let's chat about opportunities.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/contact')} className="bg-white text-black hover:bg-gray-100">
              Get in Touch
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/company-signup')} className="border-2 border-white text-white hover:bg-white/10">
              Start Your Free Trial
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
