import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Mail, Phone, MapPin, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { SharedNavigation } from '../components/SharedNavigation';

export default function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would send the form data to a backend
    toast.success('Message sent! We\'ll get back to you within 24 hours.');
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Us',
      description: 'Send us an email and we\'ll respond within 24 hours',
      action: 'support@blumebyte.com',
      href: 'mailto:support@blumebyte.com'
    },
    {
      icon: Phone,
      title: 'Call Us',
      description: 'Speak with our team Monday-Friday, 9am-6pm',
      action: '+1 (555) 123-4567',
      href: 'tel:+15551234567'
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with us in real-time for immediate assistance',
      action: 'Start Chat',
      href: '#'
    },
  ];

  const offices = [
    {
      city: 'San Francisco',
      address: '123 Tech Street, Suite 400',
      location: 'San Francisco, CA 94105',
      country: 'United States'
    },
    {
      city: 'London',
      address: '456 Business Road',
      location: 'London, EC2A 4BX',
      country: 'United Kingdom'
    },
    {
      city: 'Lagos',
      address: '789 Innovation Avenue',
      location: 'Lagos, Nigeria',
      country: 'Nigeria'
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
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {contactMethods.map((method, index) => (
            <Card key={index} className="border-2 border-gray-200 hover:border-black transition-all">
              <CardHeader className="text-center">
                <div className="mx-auto h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                  <method.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{method.title}</CardTitle>
                <CardDescription>{method.description}</CardDescription>
                <div className="pt-4">
                  {method.href.startsWith('#') ? (
                    <Button variant="outline" className="w-full">
                      {method.action}
                    </Button>
                  ) : (
                    <a href={method.href} className="block">
                      <Button variant="outline" className="w-full">
                        {method.action}
                      </Button>
                    </a>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Contact Form */}
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-black">Send us a Message</h2>
            <p className="text-gray-600 mb-8">
              Fill out the form and our team will get back to you within 24 hours.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Your Company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="sales">Sales Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="demo">Request a Demo</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Tell us how we can help..."
                />
              </div>
              <Button type="submit" size="lg" className="w-full bg-black text-white hover:bg-gray-800">
                Send Message
                <Send className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>

          {/* Office Locations */}
          <div>
            <h2 className="text-3xl font-bold mb-4 text-black">Our Offices</h2>
            <p className="text-gray-600 mb-8">
              Visit us at one of our global locations.
            </p>
            <div className="space-y-6">
              {offices.map((office, index) => (
                <Card key={index} className="border-2 border-gray-200">
                  <CardHeader>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-black mt-1 shrink-0" />
                      <div>
                        <CardTitle className="text-lg mb-2">{office.city}</CardTitle>
                        <CardDescription>
                          <div>{office.address}</div>
                          <div>{office.location}</div>
                          <div className="mt-1 font-medium">{office.country}</div>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-black">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Quick answers to common questions</p>
          </div>
          <div className="space-y-6">
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg">How quickly do you respond?</CardTitle>
                <CardDescription>
                  We typically respond to all inquiries within 24 hours during business days.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Do you offer demos?</CardTitle>
                <CardDescription>
                  Yes! We offer personalized demos to show you how Blumebyte can work for your organization.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Can I schedule a call?</CardTitle>
                <CardDescription>
                  Absolutely. Select "Request a Demo" in the contact form and we'll schedule a time that works for you.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Start your free trial today. No credit card required.
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