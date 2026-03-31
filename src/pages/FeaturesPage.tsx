import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Clock, FileText, DollarSign, Trophy, UserCheck, Award, BarChart3, Shield, Zap, Bell, BookOpen, Calendar, Gift, MessageSquare, Settings, Globe, Briefcase, Target, CheckCircle2 } from 'lucide-react';
import logoImage from '@/assets/logo';
import { SharedNavigation } from '../components/SharedNavigation';

export default function FeaturesPage() {
  const navigate = useNavigate();

  const featureCategories = [
    {
      category: 'People Management',
      description: 'Complete employee lifecycle management',
      icon: Users,
      features: [
        { name: 'Employee Profiles', description: 'Comprehensive employee information and documents', icon: Users },
        { name: 'Organization Charts', description: 'Visual hierarchy and reporting structures', icon: Target },
        { name: 'Department Management', description: 'Organize teams and departments efficiently', icon: Briefcase },
        { name: 'Role-Based Access', description: '4-tier permission system (SuperAdmin, Admin, Manager, Employee)', icon: Shield },
      ]
    },
    {
      category: 'Time & Attendance',
      description: 'Track work hours with precision',
      icon: Clock,
      features: [
        { name: 'Clock In/Out', description: 'Simple time tracking for employees', icon: Clock },
        { name: 'Shift Management', description: 'Create and manage work schedules', icon: Calendar },
        { name: 'Overtime Tracking', description: 'Automatic overtime calculation', icon: BarChart3 },
        { name: 'Real-time Monitoring', description: 'Live attendance dashboard', icon: Globe },
      ]
    },
    {
      category: 'Leave Management',
      description: 'Streamline leave requests and approvals',
      icon: FileText,
      features: [
        { name: 'Leave Requests', description: 'Easy submission and tracking', icon: FileText },
        { name: 'Approval Workflows', description: 'Multi-level approval process', icon: CheckCircle2 },
        { name: 'Leave Balance', description: 'Real-time balance tracking', icon: BarChart3 },
        { name: 'Calendar Integration', description: 'Visual leave calendar', icon: Calendar },
      ]
    },
    {
      category: 'Compensation & Payroll',
      description: 'Accurate payroll processing',
      icon: DollarSign,
      features: [
        { name: 'Payroll Processing', description: 'Automated payroll calculations', icon: DollarSign },
        { name: 'Pay Slips', description: 'Digital payslip generation', icon: FileText },
        { name: 'Salary Grades', description: 'Manage pay grades and scales', icon: Award },
        { name: 'Bonus Management', description: 'Track and process bonuses', icon: Gift },
      ]
    },
    {
      category: 'Performance Management',
      description: 'Drive employee performance',
      icon: Trophy,
      features: [
        { name: 'Performance Reviews', description: 'Structured review process', icon: Trophy },
        { name: 'Goal Setting', description: 'Set and track employee goals', icon: Target },
        { name: '360° Feedback', description: 'Comprehensive feedback system', icon: MessageSquare },
        { name: 'Performance Analytics', description: 'Track performance trends', icon: BarChart3 },
      ]
    },
    {
      category: 'Recruitment & Onboarding',
      description: 'Hire and onboard efficiently',
      icon: UserCheck,
      features: [
        { name: 'Applicant Tracking', description: 'Manage job applications', icon: UserCheck },
        { name: 'Interview Scheduling', description: 'Coordinate interviews seamlessly', icon: Calendar },
        { name: 'Onboarding Workflows', description: 'Automated onboarding process', icon: CheckCircle2 },
        { name: 'Document Collection', description: 'Digital document submission', icon: FileText },
      ]
    },
    {
      category: 'Learning & Development',
      description: 'Invest in employee growth',
      icon: BookOpen,
      features: [
        { name: 'Training Programs', description: 'Manage training initiatives', icon: BookOpen },
        { name: 'Certification Tracking', description: 'Track employee certifications', icon: Award },
        { name: 'Course Management', description: 'Create and assign courses', icon: BookOpen },
        { name: 'Skill Development', description: 'Track skill development', icon: Target },
      ]
    },
    {
      category: 'Communication',
      description: 'Keep your team connected',
      icon: MessageSquare,
      features: [
        { name: 'Announcements', description: 'Company-wide announcements', icon: Bell },
        { name: 'Team Messaging', description: 'Internal communication', icon: MessageSquare },
        { name: 'Notifications', description: 'Real-time alerts and updates', icon: Bell },
        { name: 'Employee Directory', description: 'Searchable employee directory', icon: Users },
      ]
    },
    {
      category: 'Analytics & Reporting',
      description: 'Data-driven insights',
      icon: BarChart3,
      features: [
        { name: 'HR Dashboards', description: 'Visual analytics dashboards', icon: BarChart3 },
        { name: 'Custom Reports', description: 'Build custom reports', icon: FileText },
        { name: 'Workforce Analytics', description: 'Comprehensive workforce insights', icon: Users },
        { name: 'Export Capabilities', description: 'Export data in multiple formats', icon: FileText },
      ]
    },
    {
      category: 'Security & Compliance',
      description: 'Enterprise-grade protection',
      icon: Shield,
      features: [
        { name: '2FA Authentication', description: 'Two-factor authentication', icon: Shield },
        { name: 'Audit Logs', description: 'Complete activity tracking', icon: FileText },
        { name: 'Data Encryption', description: 'Bank-level encryption', icon: Shield },
        { name: 'Row Level Security', description: 'Multi-tenant data isolation', icon: Shield },
      ]
    },
    {
      category: 'System Administration',
      description: 'Configure and customize',
      icon: Settings,
      features: [
        { name: 'Custom Branding', description: 'White-label customization', icon: Settings },
        { name: 'User Management', description: 'Manage users and permissions', icon: Users },
        { name: 'Integration Settings', description: 'Configure integrations', icon: Globe },
        { name: 'Backup & Restore', description: 'Data backup and recovery', icon: Shield },
      ]
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
              Powerful Features for Modern HR
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Everything you need to manage your workforce efficiently. From employee management to advanced analytics, all in one platform.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-20">
          {featureCategories.map((category, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center">
                  <category.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black">{category.category}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.features.map((feature, featureIdx) => (
                  <Card key={featureIdx} className="border-2 border-gray-200 hover:border-black transition-all">
                    <CardHeader>
                      <feature.icon className="h-8 w-8 text-black mb-3" />
                      <CardTitle className="text-lg">{feature.name}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">See All Features in Action</h2>
          <p className="text-lg text-gray-300 mb-8">
            Get started with Blumebyte today and transform your HR operations
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="border-white text-white hover:bg-white hover:text-black">
              View Pricing
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