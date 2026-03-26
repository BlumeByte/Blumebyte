import React from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, Heart, DollarSign, GraduationCap, Briefcase, Zap, CheckCircle2, Users, Shield, BarChart3 } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function IndustryPage() {
  const navigate = useNavigate();
  const { industry } = useParams();

  const industries: any = {
    construction: {
      name: 'Construction',
      icon: Building2,
      tagline: 'Build stronger teams for stronger projects',
      description: 'Manage your construction workforce with tools designed for the field and office.',
      challenges: [
        'Managing remote and on-site workers',
        'Tracking certifications and safety training',
        'Complex payroll with overtime and per diems',
        'Equipment and asset management'
      ],
      solutions: [
        'Mobile time tracking for field workers',
        'Certification and license tracking',
        'Project-based time allocation',
        'Equipment assignment management',
        'Safety compliance tracking'
      ],
      stats: [
        { label: 'Time Saved', value: '40%', description: 'On payroll processing' },
        { label: 'Compliance', value: '99%', description: 'Certification tracking accuracy' },
        { label: 'Productivity', value: '35%', description: 'Increase in workforce efficiency' }
      ]
    },
    education: {
      name: 'Education',
      icon: GraduationCap,
      tagline: 'Empowering educators with better HR tools',
      description: 'Simplify HR management for schools, colleges, and educational institutions.',
      challenges: [
        'Managing faculty and staff across departments',
        'Handling seasonal hiring patterns',
        'Tracking credentials and certifications',
        'Managing substitute teachers'
      ],
      solutions: [
        'Academic calendar integration',
        'Substitute teacher management',
        'Credential and certification tracking',
        'Department-based organization',
        'Leave management for academic year'
      ],
      stats: [
        { label: 'Admin Time', value: '50%', description: 'Reduction in HR admin work' },
        { label: 'Accuracy', value: '98%', description: 'In credential tracking' },
        { label: 'Satisfaction', value: '92%', description: 'Faculty satisfaction rate' }
      ]
    },
    finance: {
      name: 'Finance',
      icon: DollarSign,
      tagline: 'Secure HR solutions for financial institutions',
      description: 'Meet compliance requirements while managing your finance team efficiently.',
      challenges: [
        'Strict regulatory compliance',
        'Confidential employee data',
        'Complex compensation structures',
        'High security requirements'
      ],
      solutions: [
        'Bank-level security and encryption',
        'Compliance audit trails',
        'Complex compensation management',
        'Role-based access controls',
        'Regulatory reporting'
      ],
      stats: [
        { label: 'Security', value: '100%', description: 'Compliance with financial regulations' },
        { label: 'Audit Ready', value: '24/7', description: 'Complete audit trails' },
        { label: 'Data Security', value: 'Bank-Level', description: 'Encryption standards' }
      ]
    },
    healthcare: {
      name: 'Healthcare',
      icon: Heart,
      tagline: 'Healthcare HR for better patient care',
      description: 'Manage healthcare professionals with specialized HR tools.',
      challenges: [
        'Shift scheduling for 24/7 operations',
        'Tracking medical licenses and certifications',
        'Managing multiple locations',
        'Handling emergency staffing'
      ],
      solutions: [
        'Advanced shift scheduling',
        'License and certification tracking',
        'Multi-location management',
        'On-call staff management',
        'HIPAA-compliant data handling'
      ],
      stats: [
        { label: 'Scheduling', value: '60%', description: 'Faster shift scheduling' },
        { label: 'Compliance', value: '100%', description: 'HIPAA compliance' },
        { label: 'Staffing', value: '45%', description: 'Improvement in coverage' }
      ]
    },
    manufacturing: {
      name: 'Manufacturing',
      icon: Briefcase,
      tagline: 'Streamline operations on the factory floor',
      description: 'Optimize workforce management for manufacturing operations.',
      challenges: [
        'Shift work and complex schedules',
        'Safety compliance and training',
        'Production-based performance tracking',
        'Managing union contracts'
      ],
      solutions: [
        'Shift management and rotation',
        'Safety training tracking',
        'Production metrics integration',
        'Union contract compliance',
        'Equipment certification tracking'
      ],
      stats: [
        { label: 'Efficiency', value: '40%', description: 'Increase in workforce efficiency' },
        { label: 'Safety', value: '95%', description: 'Training completion rate' },
        { label: 'Downtime', value: '30%', description: 'Reduction in scheduling conflicts' }
      ]
    },
    technology: {
      name: 'Technology',
      icon: Zap,
      tagline: 'Modern HR for modern tech companies',
      description: 'Scale your tech team with agile HR management.',
      challenges: [
        'Rapid hiring and scaling',
        'Remote and distributed teams',
        'Competitive compensation packages',
        'Fast-paced organizational changes'
      ],
      solutions: [
        'Applicant tracking and hiring',
        'Remote team management',
        'Equity and stock option management',
        'Flexible organization structures',
        'Performance reviews and OKRs'
      ],
      stats: [
        { label: 'Hiring Speed', value: '50%', description: 'Faster time-to-hire' },
        { label: 'Remote Ready', value: '100%', description: 'Distributed team support' },
        { label: 'Engagement', value: '88%', description: 'Employee satisfaction' }
      ]
    }
  };

  const currentIndustry = industries[industry || 'technology'] || industries.technology;
  const Icon = currentIndustry.icon;

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
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              {currentIndustry.tagline}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {currentIndustry.description}
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
              Get Started Today
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {currentIndustry.stats.map((stat: any, index: number) => (
            <Card key={index} className="border-2 border-gray-200 text-center">
              <CardHeader>
                <div className="text-4xl font-bold text-black mb-2">{stat.value}</div>
                <CardTitle className="text-lg">{stat.label}</CardTitle>
                <CardDescription>{stat.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Challenges Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">Industry Challenges</h2>
              <ul className="space-y-4">
                {currentIndustry.challenges.map((challenge: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <Shield className="h-6 w-6 text-gray-400 shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{challenge}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6 text-black">Our Solutions</h2>
              <ul className="space-y-4">
                {currentIndustry.solutions.map((solution: string, index: number) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-black shrink-0 mt-1" />
                    <span className="text-lg text-gray-700">{solution}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Built for {currentIndustry.name}</h2>
          <p className="text-lg text-gray-600">
            Essential features designed specifically for your industry
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <Users className="h-10 w-10 text-black mb-4" />
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>
                Comprehensive tools to manage your workforce efficiently
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-black mb-4" />
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Industry-specific insights and reporting capabilities
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <Shield className="h-10 w-10 text-black mb-4" />
              <CardTitle>Compliance Ready</CardTitle>
              <CardDescription>
                Stay compliant with industry regulations automatically
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to transform your {currentIndustry.name} HR?
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Join other {currentIndustry.name.toLowerCase()} companies using Blumebyte
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
            Start Free Trial
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
