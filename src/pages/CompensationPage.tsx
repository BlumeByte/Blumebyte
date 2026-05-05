import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Award, DollarSign, TrendingUp, BarChart3, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function CompensationPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Award, title: 'Pay Grades & Bands', description: 'Define and manage salary structures with customizable pay grades and bands.' },
    { icon: DollarSign, title: 'Salary Management', description: 'Track and manage employee compensation with full transparency.' },
    { icon: TrendingUp, title: 'Merit Increases', description: 'Plan and execute merit increases and promotions based on performance.' },
    { icon: BarChart3, title: 'Compensation Analytics', description: 'Analyze compensation data to ensure competitive and fair pay.' },
    { icon: Shield, title: 'Pay Equity', description: 'Ensure pay equity across gender, race, and other protected categories.' },
    { icon: Zap, title: 'Bonus Management', description: 'Calculate and distribute bonuses, commissions, and incentive pay.' },
  ];

  return (
    <div className="min-h-screen public-page-bg">
      <SharedNavigation />
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6">
              <Award className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Compensation Management</h1>
            <p className="text-xl text-gray-200 mb-8">
              Manage pay grades, bonuses, and ensure competitive compensation with data-driven insights.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Strategic Compensation Planning</h2>
          <p className="text-lg text-gray-600">Tools to attract, retain, and reward top talent</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to optimize compensation?</h2>
          <p className="text-lg text-gray-300 mb-8">Ensure fair and competitive pay for your team</p>
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