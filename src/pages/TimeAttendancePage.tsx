import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Clock, MapPin, Smartphone, Calendar, TrendingUp, Shield, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function TimeAttendancePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Clock,
      title: 'Clock In/Out',
      description: 'Simple and intuitive time tracking for employees with web, mobile, and kiosk options.',
    },
    {
      icon: MapPin,
      title: 'GPS Tracking',
      description: 'Location-based clock-ins for field workers and remote teams with geofencing.',
    },
    {
      icon: Smartphone,
      title: 'Mobile App',
      description: 'Clock in from anywhere with our iOS and Android mobile apps.',
    },
    {
      icon: Calendar,
      title: 'Shift Scheduling',
      description: 'Create and manage employee schedules with drag-and-drop simplicity.',
    },
    {
      icon: TrendingUp,
      title: 'Overtime Tracking',
      description: 'Automatically track and calculate overtime based on your policies.',
    },
    {
      icon: Shield,
      title: 'Compliance Ready',
      description: 'Stay compliant with labor laws and automatically track required breaks.',
    },
  ];

  const benefits = [
    'Eliminate time theft and buddy punching',
    'Reduce payroll errors by up to 80%',
    'Save 5+ hours per week on timesheet processing',
    'Real-time attendance visibility',
    'Automated overtime and break compliance',
    'Seamless payroll integration',
  ];

  return (
    <div className="min-h-screen bg-white">
      <SharedNavigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Time & Attendance
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Streamline time tracking and attendance management with automated tools that save time and reduce errors.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Complete Time Tracking Solution</h2>
          <p className="text-lg text-gray-600">
            Everything you need to manage employee time and attendance
          </p>
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

      {/* Benefits Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">Why Use Blumebyte Time Tracking?</h2>
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
              <h3 className="text-2xl font-bold mb-6 text-black">Today's Attendance</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-black">On Time</div>
                    <div className="text-sm text-gray-600">142 employees</div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">95%</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-black">Late</div>
                    <div className="text-sm text-gray-600">5 employees</div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">3%</div>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold text-black">Absent</div>
                    <div className="text-sm text-gray-600">3 employees</div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">2%</div>
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
            Ready to modernize time tracking?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of companies using Blumebyte for time and attendance
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
