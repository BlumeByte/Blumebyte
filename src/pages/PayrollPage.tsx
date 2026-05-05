import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { DollarSign, Calculator, FileText, Clock, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { SharedNavigation } from '../components/SharedNavigation';

export default function PayrollPage() {
  const navigate = useNavigate();

  const features = [
    { icon: DollarSign, title: 'Automated Payroll', description: 'Process payroll in minutes with automated calculations and tax withholdings.' },
    { icon: Calculator, title: 'Tax Compliance', description: 'Stay compliant with automatic tax calculations and filings.' },
    { icon: FileText, title: 'Pay Stubs & Reports', description: 'Generate and distribute digital pay stubs instantly.' },
    { icon: Clock, title: 'Time Integration', description: 'Seamlessly integrate with time tracking for accurate payroll.' },
    { icon: Shield, title: 'Secure & Compliant', description: 'Bank-level encryption and compliance with all regulations.' },
    { icon: Zap, title: 'Direct Deposit', description: 'Fast and secure direct deposit to employee accounts.' },
  ];

  return (
    <div className="min-h-screen public-page-bg">
      <SharedNavigation />
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1739285452644-3a2c009112fe?w=1920&q=80"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6">
              <DollarSign className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">Payroll Management</h1>
            <p className="text-xl text-gray-200 mb-8">
              Streamline payroll processing with automated calculations, tax compliance, and direct deposit.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Complete Payroll Solution</h2>
          <p className="text-lg text-gray-600">Everything you need to process payroll accurately and on time</p>
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
          <h2 className="text-3xl font-bold mb-4">Ready to simplify payroll?</h2>
          <p className="text-lg text-gray-300 mb-8">Process payroll in minutes, not hours</p>
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