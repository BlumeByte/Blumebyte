import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, Mail, Lock, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function SecurityPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen public-page-bg legal-public-page">
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
          <h1 className="text-4xl font-bold mb-2">Security Policy</h1>
          <p className="text-muted-foreground">
            Reporting security vulnerabilities and our commitment to protecting your data
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: March 15, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Security Commitment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Our Security Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                At Blumebyte, we take the security of our platform and the protection of your data very seriously. 
                We appreciate the efforts of security researchers and users who help us maintain the highest 
                security standards.
              </p>
              <p>
                This policy outlines how you can report security vulnerabilities to us and what you can expect 
                in return. We are committed to working with the security community to verify and respond to 
                legitimate vulnerabilities.
              </p>
            </CardContent>
          </Card>

          {/* Reporting Vulnerabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                How to Report a Security Vulnerability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  If you believe you have found a security vulnerability in Blumebyte, please report it to us 
                  as described below.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Security Contact
                  </h4>
                  <p className="text-blue-800 mb-2">
                    <strong>Email:</strong> security@blumebyte.com
                  </p>
                  <p className="text-blue-800 text-xs">
                    Please include "SECURITY" in the subject line
                  </p>
                </div>

                <h4 className="font-semibold text-foreground mt-4">Please include the following details:</h4>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Type of vulnerability (e.g., SQL injection, XSS, CSRF)</li>
                  <li>Full paths of affected source file(s)</li>
                  <li>Location of the affected code (tag/branch/commit or URL)</li>
                  <li>Step-by-step instructions to reproduce the issue</li>
                  <li>Proof-of-concept or exploit code (if possible)</li>
                  <li>Impact of the vulnerability, including how an attacker might exploit it</li>
                  <li>Your name/handle for acknowledgment (optional)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Response Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Our Response Process
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>When you report a security vulnerability, here's what you can expect:</p>
                
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      1
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Initial Response</h4>
                      <p>We will acknowledge receipt of your report within 48 hours.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      2
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Validation</h4>
                      <p>We will validate the vulnerability and assess its impact within 7 days.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      3
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Resolution</h4>
                      <p>We will work on a fix and keep you updated on our progress.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      4
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">Disclosure</h4>
                      <p>Once the issue is resolved, we will publicly acknowledge your contribution (if desired).</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsible Disclosure */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" />
                Responsible Disclosure Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                To help protect our users, we ask that you follow responsible disclosure practices:
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Please DO:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-green-800 ml-4">
                  <li>Give us reasonable time to investigate and fix the issue before public disclosure</li>
                  <li>Make a good faith effort to avoid privacy violations and data destruction</li>
                  <li>Only interact with accounts you own or with explicit permission</li>
                  <li>Avoid social engineering, phishing, or physical attacks against our employees</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Please DO NOT:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-red-800 ml-4">
                  <li>Access, modify, or delete user data without explicit permission</li>
                  <li>Perform actions that could harm the reliability or integrity of our services</li>
                  <li>Use exploits for purposes other than verification and demonstration</li>
                  <li>Publicly disclose vulnerabilities before we have resolved them</li>
                  <li>Demand payment or compensation for vulnerability reports</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Security Measures */}
          <Card>
            <CardHeader>
              <CardTitle>Our Security Measures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>We implement multiple layers of security to protect your data:</p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-foreground">Encryption</h5>
                    <p className="text-xs">All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-foreground">Authentication</h5>
                    <p className="text-xs">Secure authentication via Supabase Auth with bcrypt password hashing</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-foreground">Access Control</h5>
                    <p className="text-xs">Role-based access control (RBAC) with Row Level Security (RLS)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-foreground">Data Isolation</h5>
                    <p className="text-xs">Multi-tenant architecture with complete company data separation</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-foreground">Monitoring</h5>
                    <p className="text-xs">24/7 security monitoring and automated threat detection</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-foreground">Regular Audits</h5>
                    <p className="text-xs">Periodic security assessments and code reviews</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scope */}
          <Card>
            <CardHeader>
              <CardTitle>In Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>The following are within the scope of our security program:</p>
              
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Main application (app.blumebyte.com)</li>
                <li>API endpoints (*.supabase.co/functions/v1/make-server-a35148f0/*)</li>
                <li>Employee portal</li>
                <li>Company signup and authentication flows</li>
                <li>Payment processing integration</li>
                <li>Data storage and transmission</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">Out of Scope:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Third-party services (Supabase, Paystack infrastructure)</li>
                <li>Social engineering attacks</li>
                <li>Physical security</li>
                <li>Denial of Service (DoS) attacks</li>
                <li>Spam or social media attacks</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-900">Questions or Concerns?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <p className="mb-4">
                If you have any questions about our security policy or practices, please contact us:
              </p>
              <div className="space-y-2">
                <p>
                  <strong>Security Team:</strong> security@blumebyte.com
                </p>
                <p>
                  <strong>General Support:</strong> support@blumebyte.com
                </p>
                <p>
                  <strong>Website:</strong> https://blumebyte.com
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
