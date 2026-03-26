import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Book, FileText, Briefcase, Calendar, Users, Award, Video, Download, ArrowRight } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function ResourcesPage() {
  const navigate = useNavigate();

  const resources = [
    {
      icon: Briefcase,
      title: 'HR Toolkit',
      description: 'Essential templates, guides, and tools for HR professionals',
      items: ['Employee handbook template', 'Job description templates', 'Performance review forms', 'Onboarding checklists'],
      action: 'Explore Toolkit'
    },
    {
      icon: Book,
      title: 'Content Library',
      description: 'In-depth articles and guides on HR best practices',
      items: ['HR management guides', 'Industry insights', 'Expert interviews', 'Case studies'],
      action: 'Browse Content'
    },
    {
      icon: FileText,
      title: 'HR Glossary',
      description: 'Complete glossary of HR terms and definitions',
      items: ['HR terminology', 'Compliance terms', 'Industry jargon', 'Quick reference'],
      action: 'View Glossary'
    },
    {
      icon: Video,
      title: 'Webinar Library',
      description: 'On-demand webinars from HR experts and thought leaders',
      items: ['Product demos', 'Best practices', 'Industry trends', 'Q&A sessions'],
      action: 'Watch Webinars'
    },
    {
      icon: Calendar,
      title: 'Events Hub',
      description: 'Upcoming events, conferences, and networking opportunities',
      items: ['Virtual summits', 'Local meetups', 'Workshops', 'Training sessions'],
      action: 'View Events'
    },
    {
      icon: Award,
      title: 'HR Virtual Summit',
      description: 'Our annual conference featuring top HR leaders and innovators',
      items: ['Keynote speakers', 'Breakout sessions', 'Networking', 'Product launches'],
      action: 'Learn More'
    },
  ];

  const blogPosts = [
    {
      title: '10 HR Trends Shaping 2026',
      category: 'Trends',
      readTime: '5 min read',
      excerpt: 'Discover the latest trends transforming HR and how to prepare your organization for the future.'
    },
    {
      title: 'Building a Strong Company Culture',
      category: 'Culture',
      readTime: '8 min read',
      excerpt: 'Learn proven strategies for creating and maintaining a positive workplace culture that attracts top talent.'
    },
    {
      title: 'Performance Reviews That Work',
      category: 'Management',
      readTime: '6 min read',
      excerpt: 'Transform your performance review process with these actionable tips and best practices.'
    },
    {
      title: 'Remote Work Best Practices',
      category: 'Remote Work',
      readTime: '7 min read',
      excerpt: 'Essential strategies for managing and engaging remote teams effectively.'
    },
  ];

  const guides = [
    {
      title: 'Complete Guide to Employee Onboarding',
      pages: '45 pages',
      description: 'Everything you need to create an exceptional onboarding experience'
    },
    {
      title: 'HR Compliance Handbook 2026',
      pages: '120 pages',
      description: 'Stay compliant with the latest employment laws and regulations'
    },
    {
      title: 'Performance Management Playbook',
      pages: '60 pages',
      description: 'Build a performance management system that drives results'
    },
  ];

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
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-black">
              Resources for HR Success
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Access our comprehensive library of guides, templates, webinars, and tools to elevate your HR game
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                Explore All Resources
              </Button>
              <Button size="lg" variant="outline">
                Subscribe to Newsletter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => (
            <Card key={index} className="border-2 border-gray-200 hover:border-black transition-all hover:shadow-lg">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <resource.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{resource.title}</CardTitle>
                <CardDescription>{resource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {resource.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <ArrowRight className="h-4 w-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  {resource.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated with HR Insights</h2>
          <p className="text-lg text-gray-300 mb-8">
            Get the latest HR news, tips, and resources delivered to your inbox weekly
          </p>
          <div className="flex gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-md text-black"
            />
            <Button size="lg" variant="secondary" className="bg-white text-black hover:bg-gray-100">
              Subscribe
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