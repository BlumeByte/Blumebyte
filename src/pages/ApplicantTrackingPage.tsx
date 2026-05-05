import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { UserCheck, Users, Briefcase, FileText, Calendar, MessageSquare, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function ApplicantTrackingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Briefcase, title: 'Job Posting', description: 'Post jobs to multiple boards with one click and manage all applications in one place.' },
    { icon: Users, title: 'Candidate Pipeline', description: 'Track candidates through your hiring pipeline from application to offer.' },
    { icon: Calendar, title: 'Interview Scheduling', description: 'Coordinate interviews with automated scheduling and calendar integration.' },
    { icon: FileText, title: 'Resume Parsing', description: 'Automatically extract and organize candidate information from resumes.' },
    { icon: MessageSquare, title: 'Candidate Communication', description: 'Send automated emails and keep candidates informed throughout the process.' },
    { icon: UserCheck, title: 'Collaborative Hiring', description: 'Get feedback from your team with scorecards and collaborative reviews.' },
  ];

  return (
    <div className="min-h-screen public-page-bg">
      <SharedNavigation />
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6">
              <UserCheck className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Applicant Tracking System</h1>
            <p className="text-xl text-gray-200 mb-8">
              Streamline your hiring process from job posting to offer letter with our powerful ATS.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Hire Faster, Hire Better</h2>
          <p className="text-lg text-gray-600">Everything you need to find and hire the right candidates</p>
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
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to transform your hiring?</h2>
          <p className="text-lg text-gray-300 mb-8">Find and hire the best candidates faster</p>
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