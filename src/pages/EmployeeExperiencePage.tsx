import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Heart, MessageSquare, TrendingUp, Gift, Users, Bell, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function EmployeeExperiencePage() {
  const navigate = useNavigate();

  const features = [
    { icon: Heart, title: 'Engagement Surveys', description: 'Measure employee satisfaction with pulse surveys and engagement analytics.' },
    { icon: MessageSquare, title: 'Feedback Tools', description: 'Enable continuous feedback and recognition between employees and managers.' },
    { icon: Gift, title: 'Recognition & Rewards', description: 'Celebrate achievements and reward employees for their contributions.' },
    { icon: Bell, title: 'Company Announcements', description: 'Keep everyone informed with company-wide news and updates.' },
    { icon: TrendingUp, title: 'Career Development', description: 'Support growth with learning paths, training, and development plans.' },
    { icon: Users, title: 'Employee Directory', description: 'Connect employees with org charts and contact directories.' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <SharedNavigation />
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1532708059644-5590ed51ce4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwaGFwcHklMjBlbXBsb3llZXMlMjB3b3JrcGxhY2UlMjBjdWx0dXJlfGVufDF8fHx8MTc3NTA0Nzg1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6">
              <Heart className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Employee Experience</h1>
            <p className="text-xl text-gray-200 mb-8">
              Build a workplace culture that attracts and retains top talent with engagement tools and employee-first features.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Create Amazing Employee Experiences</h2>
          <p className="text-lg text-gray-600">Tools to engage, motivate, and retain your best talent</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to boost employee engagement?</h2>
          <p className="text-lg text-gray-300 mb-8">Create a workplace where everyone thrives</p>
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