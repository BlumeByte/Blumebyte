import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Eye, Lock, Cookie, Database, UserCheck, ArrowLeft } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <img src={logoImage} alt="Blumebyte" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground">
            How we collect, use, and protect your information
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: May 18, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-blue-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Welcome to Blumebyte. We respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, disclose, and safeguard your information when 
                you use our HR management platform.
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy 
                policy, please do not access the application.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                <p className="mb-2">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Name, email address, and contact information</li>
                  <li>Company name, size, and industry</li>
                  <li>Employment details (job title, department, salary information)</li>
                  <li>Profile photos and documents you upload</li>
                  <li>Time and attendance records</li>
                  <li>Leave requests and approval history</li>
                  <li>Performance reviews and feedback</li>
                  <li>Communication and messages within the platform</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Account Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Login credentials (email and encrypted password)</li>
                  <li>Account preferences and settings</li>
                  <li>Subscription and billing information</li>
                  <li>Payment card details (processed securely by Paystack)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Automatically Collected Information</h4>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>IP address and device information</li>
                  <li>Browser type and operating system</li>
                  <li>Log data and usage patterns</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>We use the information we collect to:</p>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Provide Services:</strong> Operate and maintain the HR management platform</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Process Transactions:</strong> Handle subscription payments and license management</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Improve Platform:</strong> Analyze usage patterns to enhance features and performance</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Customer Support:</strong> Respond to inquiries and provide technical assistance</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Communications:</strong> Send important updates, security alerts, and service notifications</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Security:</strong> Detect and prevent fraud, abuse, and security incidents</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Compliance:</strong> Meet legal and regulatory obligations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Information Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>We may share your information in the following circumstances:</p>
              
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Within Your Organization</h5>
                  <p className="text-blue-800 text-xs">
                    Your information is accessible to authorized users within your company based on their role 
                    (SuperAdmin, Admin, Manager, Employee). We implement strict access controls to ensure data 
                    is only visible to those who need it.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-semibold text-purple-900 mb-2">Service Providers</h5>
                  <p className="text-purple-800 text-xs">
                    We work with trusted third-party service providers who help us operate our platform:
                  </p>
                  <ul className="list-disc list-inside text-purple-800 text-xs ml-4 mt-2 space-y-1">
                    <li><strong>Supabase:</strong> Database, authentication, and backend services</li>
                    <li><strong>Paystack:</strong> Payment processing (they have their own privacy policies)</li>
                    <li><strong>Vercel:</strong> Application hosting and content delivery</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="font-semibold text-orange-900 mb-2">Legal Requirements</h5>
                  <p className="text-orange-800 text-xs">
                    We may disclose your information if required by law, court order, or governmental request, 
                    or to protect our rights, property, or safety.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2">Business Transfers</h5>
                  <p className="text-green-800 text-xs">
                    If we are involved in a merger, acquisition, or sale of assets, your information may be 
                    transferred. We will notify you before your information is transferred and becomes subject 
                    to a different privacy policy.
                  </p>
                </div>
              </div>

              <p className="font-semibold text-foreground mt-4">We DO NOT:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Sell your personal information to third parties</li>
                <li>Share your data with advertisers</li>
                <li>Use your data for unrelated marketing purposes</li>
                <li>Share data between different companies using our platform</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-600" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We implement reasonable technical and organizational measures designed to protect your information:
              </p>

              <div className="grid md:grid-cols-2 gap-3 mt-4">
                <div className="bg-gray-50 border rounded-lg p-3">
                  <h5 className="font-semibold text-foreground text-xs mb-1">Encryption</h5>
                  <p className="text-xs">Encryption in transit and at rest where supported by our infrastructure providers</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <h5 className="font-semibold text-foreground text-xs mb-1">Authentication</h5>
                  <p className="text-xs">Authentication controls, password protection, and account recovery safeguards</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <h5 className="font-semibold text-foreground text-xs mb-1">Access Control</h5>
                  <p className="text-xs">Role-based permissions and tenant-level access restrictions</p>
                </div>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <h5 className="font-semibold text-foreground text-xs mb-1">Monitoring</h5>
                  <p className="text-xs">Logging and monitoring practices intended to detect misuse and operational issues</p>
                </div>
              </div>

              <p className="mt-4">
                However, no method of transmission over the internet or electronic storage is 100% secure. 
                While we strive to protect your information, we cannot guarantee absolute security and do not represent that our service satisfies every legal or regulatory framework in every country.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>We retain your information for as long as necessary to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide our services to you</li>
                <li>Comply with legal obligations</li>
                <li>Resolve disputes and enforce agreements</li>
                <li>Maintain business records</li>
              </ul>
              
              <p className="mt-3">
                When you delete your account or request data deletion, we will remove your personal information 
                from our active databases within 30 days, except where we are required to retain it for legal 
                or compliance purposes.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Depending on your location, you may have the following rights:</p>
              
              <div className="space-y-2 mt-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Access:</strong> Request a copy of your personal data</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Correction:</strong> Update or correct inaccurate information</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Deletion:</strong> Request deletion of your personal data</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Portability:</strong> Receive your data in a structured, machine-readable format</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Objection:</strong> Object to certain processing of your data</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                  <p><strong>Restriction:</strong> Request restriction of processing in certain circumstances</p>
                </div>
              </div>

              <p className="mt-4">
                To exercise these rights, please contact us at <strong>privacy@blumebyte.com</strong>. 
                We will respond to your request within 30 days.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-orange-600" />
                Cookies and Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>We use cookies and similar technologies to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Keep you logged in</li>
                <li>Remember your preferences</li>
                <li>Analyze platform usage</li>
                <li>Improve performance</li>
              </ul>

              <p className="mt-3">
                You can control cookies through your browser settings. However, disabling cookies may limit 
                some functionality of the platform.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Children's Privacy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Our platform is not intended for individuals under the age of 18. We do not knowingly collect 
                personal information from children. If you believe we have collected information from a child, 
                please contact us immediately.
              </p>
            </CardContent>
          </Card>

          {/* International Data Transfers */}
          <Card>
            <CardHeader>
              <CardTitle>International Data Transfers</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Your information may be transferred to and processed in countries other than your own, depending on where our providers operate.
                You are responsible for determining whether use of the service is lawful in your jurisdiction and for configuring your organization to meet local legal obligations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Responsibility Notice</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                Blumebyte provides software tools and operational controls, but does not provide legal advice and does not certify compliance with all country-specific employment, privacy, or payroll laws.
                Each customer remains responsible for obtaining legal advice and ensuring their own compliance requirements are met.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We may update this privacy policy from time to time. We will notify you of any material changes 
                by posting the new policy on this page and updating the "Last Updated" date. We encourage you 
                to review this policy periodically.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-900">Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <p className="mb-4">
                If you have questions or concerns about this privacy policy or our data practices, please contact us:
              </p>
              <div className="space-y-2">
                <p>
                  <strong>Privacy Officer:</strong> privacy@blumebyte.com
                </p>
                <p>
                  <strong>General Support:</strong> support@blumebyte.com
                </p>
                <p>
                  <strong>Website:</strong> https://blumebyte.com
                </p>
                <p>
                  <strong>Address:</strong> Blumebyte Inc., Privacy Department
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/')} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
            Return to Home
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <img src={logoImage} alt="Blumebyte" className="h-8" />
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button onClick={() => navigate('/security-policy')} className="hover:text-foreground">
                Security
              </button>
              <button onClick={() => navigate('/privacy-policy')} className="hover:text-foreground">
                Privacy
              </button>
              <button onClick={() => navigate('/terms-conditions')} className="hover:text-foreground">
                Terms
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Blumebyte. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
