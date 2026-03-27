import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Users, CheckSquare, FileText, Laptop, Heart, Calendar, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function OnboardingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: CheckSquare, title: 'Onboarding Checklists', description: 'Guide new hires through their first days with customizable checklists.' },
    { icon: FileText, title: 'Digital Paperwork', description: 'Complete all paperwork electronically before day one.' },
    { icon: Laptop, title: 'Equipment Tracking', description: 'Manage laptop, phone, and equipment assignments automatically.' },
    { icon: Calendar, title: 'Training Schedule', description: 'Schedule and track new hire training and orientation sessions.' },
    { icon: Users, title: 'Buddy System', description: 'Assign mentors and buddies to help new hires settle in.' },
    { icon: Heart, title: 'Culture Integration', description: 'Share company values, culture, and resources with new team members.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SharedNavigation />
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">Employee Onboarding</h1>
            <p className="text-xl text-gray-600 mb-8">
              Create amazing first impressions with seamless onboarding experiences that set new hires up for success.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Onboard with Confidence</h2>
          <p className="text-lg text-gray-600">Make every new hire feel welcome and prepared</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to improve your onboarding?</h2>
          <p className="text-lg text-gray-300 mb-8">Create great first impressions for every new hire</p>
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
