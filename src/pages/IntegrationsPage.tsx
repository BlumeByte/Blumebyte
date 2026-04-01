import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Plug, Users, Calendar, MessageSquare, FileText, DollarSign, Mail, Video, Database, Cloud, Shield, CheckCircle2 } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { SharedNavigation } from '../components/SharedNavigation';

export default function IntegrationsPage() {
  const navigate = useNavigate();

  const integrationCategories = [
    {
      category: 'Communication',
      description: 'Connect with your favorite communication tools',
      integrations: [
        { name: 'Slack', description: 'Team messaging and notifications', icon: MessageSquare, available: true },
        { name: 'Microsoft Teams', description: 'Collaboration and chat', icon: MessageSquare, available: true },
        { name: 'Zoom', description: 'Video conferencing integration', icon: Video, available: true },
        { name: 'Google Meet', description: 'Virtual meetings', icon: Video, available: true },
      ]
    },
    {
      category: 'Calendar & Scheduling',
      description: 'Sync with calendar applications',
      integrations: [
        { name: 'Google Calendar', description: 'Schedule syncing and events', icon: Calendar, available: true },
        { name: 'Outlook Calendar', description: 'Microsoft calendar integration', icon: Calendar, available: true },
        { name: 'Apple Calendar', description: 'iCal integration', icon: Calendar, available: true },
        { name: 'Calendly', description: 'Scheduling automation', icon: Calendar, available: true },
      ]
    },
    {
      category: 'Email Services',
      description: 'Email integration and automation',
      integrations: [
        { name: 'Gmail', description: 'Google email integration', icon: Mail, available: true },
        { name: 'Outlook', description: 'Microsoft email service', icon: Mail, available: true },
        { name: 'SendGrid', description: 'Email delivery service', icon: Mail, available: true },
        { name: 'Mailchimp', description: 'Email marketing', icon: Mail, available: true },
      ]
    },
    {
      category: 'Payments & Finance',
      description: 'Payment processing and accounting',
      integrations: [
        { name: 'Paystack', description: 'Payment processing (Built-in)', icon: DollarSign, available: true },
        { name: 'QuickBooks', description: 'Accounting software', icon: DollarSign, available: true },
        { name: 'Xero', description: 'Cloud accounting', icon: DollarSign, available: true },
        { name: 'Stripe', description: 'Payment gateway', icon: DollarSign, available: true },
      ]
    },
    {
      category: 'Cloud Storage',
      description: 'Document storage and management',
      integrations: [
        { name: 'Google Drive', description: 'Cloud storage integration', icon: Cloud, available: true },
        { name: 'Dropbox', description: 'File sharing and storage', icon: Cloud, available: true },
        { name: 'OneDrive', description: 'Microsoft cloud storage', icon: Cloud, available: true },
        { name: 'Box', description: 'Enterprise content management', icon: Cloud, available: true },
      ]
    },
    {
      category: 'Authentication',
      description: 'Secure authentication providers',
      integrations: [
        { name: 'Google OAuth', description: 'Sign in with Google (Built-in)', icon: Shield, available: true },
        { name: 'Microsoft Azure AD', description: 'Enterprise authentication', icon: Shield, available: true },
        { name: 'Okta', description: 'Identity management', icon: Shield, available: true },
        { name: 'Auth0', description: 'Authentication platform', icon: Shield, available: true },
      ]
    },
    {
      category: 'Database & Backend',
      description: 'Database and backend services',
      integrations: [
        { name: 'Supabase', description: 'Backend platform (Built-in)', icon: Database, available: true },
        { name: 'PostgreSQL', description: 'Database integration', icon: Database, available: true },
        { name: 'MongoDB', description: 'NoSQL database', icon: Database, available: true },
        { name: 'Redis', description: 'Caching and data store', icon: Database, available: true },
      ]
    },
    {
      category: 'APIs & Webhooks',
      description: 'Custom integrations and automation',
      integrations: [
        { name: 'REST API', description: 'Full REST API access', icon: Plug, available: true },
        { name: 'Webhooks', description: 'Real-time event notifications', icon: Plug, available: true },
        { name: 'Zapier', description: 'Automation workflows', icon: Plug, available: true },
        { name: 'Make (Integromat)', description: 'Visual automation', icon: Plug, available: true },
      ]
    },
  ];

  const benefits = [
    {
      icon: Plug,
      title: 'Easy Setup',
      description: 'Connect your tools in minutes with our simple integration wizard'
    },
    {
      icon: Shield,
      title: 'Secure Connection',
      description: 'Bank-level encryption and OAuth 2.0 authentication'
    },
    {
      icon: Users,
      title: 'Real-time Sync',
      description: 'Data syncs automatically across all your connected applications'
    },
    {
      icon: FileText,
      title: 'API Access',
      description: 'Full REST API for custom integrations and workflows'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <SharedNavigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1573167659694-342d570ce45a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZnJpY2FuJTIwYnVzaW5lc3MlMjBwcm9mZXNzaW9uYWxzJTIwb2ZmaWNlJTIwdGVhbXdvcmt8ZW58MXx8fHwxNzc1MDQ3ODQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6">
              <Plug className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Integrations That Work For You
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Connect Blumebyte with your favorite tools and services. Seamlessly integrate with popular platforms to streamline your HR workflow.
            </p>
            <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
              Explore Integrations
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4 text-black">Why Choose Our Integrations</h2>
          <p className="text-lg text-gray-600">Built for developers and designed for everyone</p>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-2 border-gray-200 text-center">
              <CardHeader>
                <div className="mx-auto h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{benefit.title}</CardTitle>
                <CardDescription>{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {integrationCategories.map((category, idx) => (
              <div key={idx}>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-black mb-2">{category.category}</h2>
                  <p className="text-gray-600">{category.description}</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {category.integrations.map((integration, integrationIdx) => (
                    <Card key={integrationIdx} className="border-2 border-gray-200 hover:border-black transition-all bg-white">
                      <CardHeader>
                        <div className="flex items-start justify-between mb-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <integration.icon className="h-5 w-5 text-black" />
                          </div>
                          {integration.available && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                              <CheckCircle2 className="h-3 w-3" />
                              Available
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription className="text-sm">{integration.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-black">Need a Custom Integration?</h2>
            <p className="text-lg text-gray-600 mb-6">
              Use our comprehensive REST API to build custom integrations tailored to your specific needs. Full documentation and developer support included.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                <span>Complete REST API access</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                <span>Webhook support for real-time events</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                <span>Comprehensive API documentation</span>
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                <span>Developer support and SDKs</span>
              </li>
            </ul>
            <Button size="lg" className="bg-black text-white hover:bg-gray-800">
              View API Documentation
            </Button>
          </div>
          <Card className="border-2 border-gray-200">
            <CardHeader>
              <CardTitle>Enterprise Integrations</CardTitle>
              <CardDescription>Need help with a specific integration? Our team can help.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                  <span>Custom integration development</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                  <span>Dedicated integration engineer</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-black shrink-0" />
                  <span>SLA guarantees</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" onClick={() => window.open('https://blumebyte.com/contact/', '_blank')}>Contact Sales</Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Connect Your Tools?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Start integrating with your favorite applications today
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100">
            Get Started Free
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