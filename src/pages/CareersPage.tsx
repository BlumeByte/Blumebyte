import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Briefcase, Heart, Zap, Users, Trophy, Globe, Coffee, BookOpen, ArrowRight } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

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
      icon: BookOpen,
      title: 'Learning & Growth',
      description: 'Continuous learning budget, conferences, and professional development'
    },
    {
      icon: Trophy,
      title: 'Competitive Pay',
      description: 'Market-leading salaries, equity, and performance bonuses'
    },
    {
      icon: Coffee,
      title: 'Unlimited PTO',
      description: 'Take the time you need to recharge and stay productive'
    },
    {
      icon: Users,
      title: 'Great Team',
      description: 'Work with talented, passionate people who care about making an impact'
    },
  ];

  const openings = [
    {
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build scalable features for our HR platform using React, TypeScript, and Supabase'
    },
    {
      title: 'Product Designer',
      department: 'Design',
      location: 'Remote',
      type: 'Full-time',
      description: 'Create beautiful, intuitive experiences for HR professionals and employees'
    },
    {
      title: 'Customer Success Manager',
      department: 'Customer Success',
      location: 'Remote',
      type: 'Full-time',
      description: 'Help customers succeed with Blumebyte and drive product adoption'
    },
    {
      title: 'Sales Executive',
      department: 'Sales',
      location: 'Remote',
      type: 'Full-time',
      description: 'Drive revenue growth by helping companies discover Blumebyte'
    },
    {
      title: 'Marketing Manager',
      department: 'Marketing',
      location: 'Remote',
      type: 'Full-time',
      description: 'Lead marketing initiatives to grow brand awareness and customer acquisition'
    },
    {
      title: 'DevOps Engineer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      description: 'Build and maintain infrastructure for high availability and scalability'
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
      <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logoImage} alt="Blumebyte" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
              <Button onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

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
            <Button size="lg" className="bg-black text-white hover:bg-gray-800">
              View Open Positions
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

      {/* Open Positions Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Open Positions</h2>
          <p className="text-lg text-gray-600">Find your next opportunity</p>
        </div>
        <div className="space-y-4">
          {openings.map((job, index) => (
            <Card key={index} className="border-2 border-gray-200 hover:border-black transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="px-3 py-1 bg-gray-100 rounded-full">{job.department}</span>
                      <span>{job.location}</span>
                      <span>{job.type}</span>
                    </div>
                    <CardDescription className="text-base">{job.description}</CardDescription>
                  </div>
                  <Button variant="outline" className="ml-4">
                    Apply Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">What Our Team Says</h2>
            <p className="text-lg text-gray-600">Hear from people who work here</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardDescription className="text-base italic">
                  "Best place I've ever worked. The team is incredibly talented and supportive, and I'm learning something new every day."
                </CardDescription>
                <div className="mt-4">
                  <CardTitle className="text-base">Sarah Johnson</CardTitle>
                  <p className="text-sm text-gray-600">Senior Engineer</p>
                </div>
              </CardHeader>
            </Card>
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardDescription className="text-base italic">
                  "The culture here is amazing. Everyone truly cares about building great products and helping our customers succeed."
                </CardDescription>
                <div className="mt-4">
                  <CardTitle className="text-base">Michael Chen</CardTitle>
                  <p className="text-sm text-gray-600">Product Manager</p>
                </div>
              </CardHeader>
            </Card>
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardDescription className="text-base italic">
                  "I love the flexibility and trust. I can work from anywhere and the company provides everything I need to be successful."
                </CardDescription>
                <div className="mt-4">
                  <CardTitle className="text-base">Emily Rodriguez</CardTitle>
                  <p className="text-sm text-gray-600">Customer Success</p>
                </div>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Don't See a Perfect Fit?</h2>
          <p className="text-lg text-gray-300 mb-8">
            We're always looking for talented people. Send us your resume and let's chat about opportunities.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/contact')} className="bg-white text-black hover:bg-gray-100">
              Get in Touch
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
