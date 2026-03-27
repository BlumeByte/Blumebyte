import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Trophy, Target, TrendingUp, Star, MessageSquare, Award, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function PerformanceManagementPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Target, title: 'Goal Setting', description: 'Set and track individual and team goals aligned with company objectives.' },
    { icon: Star, title: 'Performance Reviews', description: 'Conduct 360-degree reviews with customizable templates and workflows.' },
    { icon: TrendingUp, title: 'Continuous Feedback', description: 'Enable real-time feedback and recognition between managers and employees.' },
    { icon: MessageSquare, title: '1-on-1 Meetings', description: 'Schedule and document regular check-ins with your team.' },
    { icon: Award, title: 'Recognition & Rewards', description: 'Celebrate achievements and recognize top performers.' },
    { icon: Trophy, title: 'Performance Analytics', description: 'Track performance trends and identify high performers and improvement areas.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SharedNavigation />
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
              <Trophy className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">Performance Management</h1>
            <p className="text-xl text-gray-600 mb-8">
              Drive employee growth and business success with comprehensive performance management tools.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Build a High-Performance Culture</h2>
          <p className="text-lg text-gray-600">Tools to help your team reach their full potential</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-2 border-gray-200">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-black mb-4" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to boost performance?</h2>
          <p className="text-lg text-gray-300 mb-8">Empower your team to achieve their best</p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
            Get Started Now
          </Button>
        </div>
      </section>
      <footer className="border-t bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-600">© 2026 Blumebyte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
