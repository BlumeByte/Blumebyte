import React from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Scale, AlertCircle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export default function TermsConditions() {
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
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground">
            Agreement for using the Blumebyte HR Management Platform
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last Updated: March 15, 2026
          </p>
        </div>

        <div className="space-y-6">
          {/* Acceptance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                Acceptance of Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Welcome to Blumebyte! These Terms and Conditions ("Terms", "Agreement") govern your use of 
                the Blumebyte HR management platform (the "Service") operated by Blumebyte Inc. ("us", "we", or "our").
              </p>
              <p>
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with 
                any part of these terms, you may not access the Service.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-amber-900 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  IMPORTANT: Please read these terms carefully before using our Service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Registration */}
          <Card>
            <CardHeader>
              <CardTitle>1. Account Registration and Company Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">1.1 Company Account Creation</h4>
              <p>
                To use the Service, you must create a company account. When registering, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate, complete, and current information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access or security breach</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">1.2 Account Eligibility</h4>
              <p>You must:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Be at least 18 years old</li>
                <li>Have the authority to bind your company to these Terms</li>
                <li>Not be prohibited from using the Service under applicable law</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">1.3 Account Termination</h4>
              <p>
                We reserve the right to suspend or terminate your account if you violate these Terms or 
                engage in fraudulent, abusive, or illegal activities.
              </p>
            </CardContent>
          </Card>

          {/* Subscription and Payment */}
          <Card>
            <CardHeader>
              <CardTitle>2. Subscription and Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">2.1 Subscription Plans</h4>
              <p>We offer the following subscription plans:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Monthly Plan:</strong> $6 per employee per month, billed monthly</li>
                <li><strong>Yearly Plan:</strong> $5 per employee per month, billed annually ($60/employee/year)</li>
                <li><strong>Custom Plan:</strong> Pricing determined on a case-by-case basis</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">2.2 License Requirements</h4>
              <p>
                You must purchase a license for each employee you add to the platform. Exceeding your 
                license limit will prevent you from adding additional employees until you purchase more licenses.
              </p>

              <h4 className="font-semibold text-foreground mt-4">2.3 Payment Processing</h4>
              <p>
                Payments are processed securely through Paystack. By providing payment information, you:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Authorize us to charge your payment method for all fees incurred</li>
                <li>Agree to Paystack's terms of service and privacy policy</li>
                <li>Represent that you have the right to use the payment method provided</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">2.4 Billing and Renewal</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Subscriptions automatically renew unless canceled before the renewal date</li>
                <li>You will be charged at the beginning of each billing cycle</li>
                <li>We may change pricing with 30 days' notice to existing customers</li>
                <li>Price changes do not apply to your current billing cycle</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">2.5 Refund Policy</h4>
              <p>
                Refunds are handled on a case-by-case basis. Contact support@blumebyte.com to request a refund. 
                Generally, we do not provide refunds for partial months or unused licenses.
              </p>

              <h4 className="font-semibold text-foreground mt-4">2.6 Failed Payments</h4>
              <p>
                If payment fails:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>You will receive a notification to update your payment method</li>
                <li>You have 7 days grace period to update payment information</li>
                <li>After the grace period, employee accounts may be deactivated</li>
                <li>Your data will be retained for 30 days after deactivation</li>
              </ul>
            </CardContent>
          </Card>

          {/* Service Usage */}
          <Card>
            <CardHeader>
              <CardTitle>3. Acceptable Use Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                You MAY:
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-4 text-green-900 bg-green-50 p-3 rounded">
                <li>Use the Service for lawful HR management purposes</li>
                <li>Store and process employee data in accordance with applicable laws</li>
                <li>Export your data at any time</li>
                <li>Customize the platform within provided settings</li>
              </ul>

              <h4 className="font-semibold text-foreground flex items-center gap-2 mt-4">
                <XCircle className="h-4 w-4 text-red-600" />
                You MAY NOT:
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-4 text-red-900 bg-red-50 p-3 rounded">
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Upload viruses, malware, or malicious code</li>
                <li>Attempt to gain unauthorized access to the Service or other accounts</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Use the Service to send spam or unsolicited communications</li>
                <li>Scrape, crawl, or data mine the platform</li>
                <li>Share your account with unauthorized parties</li>
                <li>Resell or redistribute the Service without permission</li>
                <li>Use the Service for any illegal or fraudulent purpose</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data and Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>4. Data Ownership and Privacy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">4.1 Your Data</h4>
              <p>
                You retain all rights to the data you input into the Service ("Customer Data"). We do not 
                claim ownership of your data.
              </p>

              <h4 className="font-semibold text-foreground mt-4">4.2 Our Rights to Use Data</h4>
              <p>
                You grant us a license to use, store, and process your data solely to provide the Service 
                and improve our platform. We will not use your data for any other purpose without your consent.
              </p>

              <h4 className="font-semibold text-foreground mt-4">4.3 Data Security</h4>
              <p>
                We implement industry-standard security measures to protect your data. However, no system 
                is completely secure, and we cannot guarantee absolute security.
              </p>

              <h4 className="font-semibold text-foreground mt-4">4.4 Data Isolation</h4>
              <p>
                We maintain strict data isolation between companies. Your data is not shared with or 
                accessible to other companies using the platform.
              </p>

              <h4 className="font-semibold text-foreground mt-4">4.5 Privacy Policy</h4>
              <p>
                Our collection and use of personal information is governed by our Privacy Policy, 
                which is incorporated into these Terms by reference.
              </p>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>5. Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">5.1 Our Intellectual Property</h4>
              <p>
                The Service, including all software, designs, text, graphics, and other content, is owned 
                by Blumebyte and protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h4 className="font-semibold text-foreground mt-4">5.2 License to Use</h4>
              <p>
                We grant you a limited, non-exclusive, non-transferable license to access and use the 
                Service for your internal business purposes, subject to these Terms.
              </p>

              <h4 className="font-semibold text-foreground mt-4">5.3 Restrictions</h4>
              <p>
                You may not copy, modify, distribute, sell, or lease any part of our Service without 
                express written permission.
              </p>
            </CardContent>
          </Card>

          {/* Warranties and Disclaimers */}
          <Card>
            <CardHeader>
              <CardTitle>6. Warranties and Disclaimers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">6.1 Service Availability</h4>
              <p>
                We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. The Service 
                is provided "as is" and "as available."
              </p>

              <h4 className="font-semibold text-foreground mt-4">6.2 Disclaimer</h4>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-900 text-xs uppercase font-semibold mb-2">
                  DISCLAIMER OF WARRANTIES
                </p>
                <p className="text-amber-900 text-xs">
                  THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                  INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
                  PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR 
                  UNINTERRUPTED.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-900 text-xs uppercase font-semibold mb-2">
                  LIMITATION OF LIABILITY
                </p>
                <p className="text-red-900 text-xs mb-2">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, BLUMEBYTE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO 
                  LOSS OF PROFITS, DATA, USE, OR GOODWILL.
                </p>
                <p className="text-red-900 text-xs">
                  OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM OR RELATING TO THE SERVICE SHALL NOT 
                  EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle>8. Indemnification</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                You agree to indemnify and hold harmless Blumebyte, its officers, directors, employees, 
                and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) 
                arising from:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your Customer Data</li>
              </ul>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>9. Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">9.1 By You</h4>
              <p>
                You may cancel your subscription at any time. Cancellation takes effect at the end of your 
                current billing period. You will retain access until then.
              </p>

              <h4 className="font-semibold text-foreground mt-4">9.2 By Us</h4>
              <p>
                We may suspend or terminate your account if you:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Violate these Terms</li>
                <li>Fail to pay fees when due</li>
                <li>Engage in fraudulent or illegal activities</li>
                <li>Pose a security risk to the Service or other users</li>
              </ul>

              <h4 className="font-semibold text-foreground mt-4">9.3 Effect of Termination</h4>
              <p>
                Upon termination:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Your access to the Service will cease</li>
                <li>You have 30 days to export your data</li>
                <li>After 30 days, we may delete your data</li>
                <li>You remain liable for any outstanding fees</li>
              </ul>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>10. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of material 
                changes by email or through the Service at least 30 days before they take effect.
              </p>
              <p className="mt-3">
                Your continued use of the Service after changes become effective constitutes acceptance 
                of the new Terms.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>11. Governing Law and Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <h4 className="font-semibold text-foreground">11.1 Governing Law</h4>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
                in which Blumebyte is registered, without regard to conflict of law principles.
              </p>

              <h4 className="font-semibold text-foreground mt-4">11.2 Dispute Resolution</h4>
              <p>
                Any disputes arising from these Terms shall first be attempted to be resolved through 
                good-faith negotiations. If negotiations fail, disputes shall be resolved through binding 
                arbitration or in the courts of our registered jurisdiction.
              </p>
            </CardContent>
          </Card>

          {/* Miscellaneous */}
          <Card>
            <CardHeader>
              <CardTitle>12. Miscellaneous</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you 
                and Blumebyte regarding the Service.
              </p>
              <p>
                <strong>Severability:</strong> If any provision is found unenforceable, the remaining 
                provisions will remain in effect.
              </p>
              <p>
                <strong>Waiver:</strong> Our failure to enforce any right or provision does not constitute 
                a waiver of that right or provision.
              </p>
              <p>
                <strong>Assignment:</strong> You may not assign these Terms without our written consent. 
                We may assign these Terms at any time.
              </p>
              <p>
                <strong>No Agency:</strong> These Terms do not create any partnership, joint venture, 
                employment, or agency relationship.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-2 border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="text-blue-900">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-800">
              <p className="mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="space-y-2">
                <p>
                  <strong>Legal Department:</strong> legal@blumebyte.com
                </p>
                <p>
                  <strong>Customer Support:</strong> support@blumebyte.com
                </p>
                <p>
                  <strong>Website:</strong> https://blumebyte.com
                </p>
                <p>
                  <strong>Company:</strong> Blumebyte Inc.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acceptance */}
          <Card className="border-2 border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Acknowledgment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-800">
              <p>
                BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS AND CONDITIONS, 
                UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEM. IF YOU DO NOT AGREE TO THESE TERMS, 
                DO NOT USE THE SERVICE.
              </p>
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