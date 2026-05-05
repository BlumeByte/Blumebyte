import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { api, apiUpload } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import {
  User, Pencil, RefreshCw, Loader2, FileText, Download, Eye, CalendarDays,
  DollarSign, Phone, Mail, MapPin, Building2, Briefcase, Shield,
  Camera, Upload, Trash2, Image, File, AlertCircle, Printer, ArrowUpDown, ArrowUp, ArrowDown, Clock, Star
} from 'lucide-react';
import { useBranding } from '../lib/branding-context';
import { useCurrency } from '../lib/currency-context';

interface PDFBranding {
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  description: string;
}

function exportToPDFDoc(title: string, content: string, b: PDFBranding) {
  const w = window.open('', '_blank');
  if (!w) { toast.error('Popup blocked. Please allow popups for this site.'); return; }

  const color = b.primaryColor || '#10b981';
  const footerParts = [b.companyAddress, b.companyPhone, b.companyEmail, b.companyWebsite].filter(Boolean);
  const footerText = footerParts.join(' &nbsp;|&nbsp; ') || b.companyName;
  const logoHtml = b.logoUrl
    ? `<img src="${b.logoUrl}" alt="${b.companyName}" style="max-height:64px;max-width:160px;object-fit:contain;display:block;"/>`
    : `<div style="width:64px;height:64px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff;">${b.companyName.charAt(0).toUpperCase()}</div>`;

  w.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${title} — ${b.companyName}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Arial', sans-serif; font-size: 13px; color: #222; background: #fff; }
    /* ── Letterhead ── */
    .letterhead { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 3px solid ${color}; margin-bottom: 18px; }
    .letterhead-text { flex: 1; }
    .letterhead-company { font-size: 20px; font-weight: 700; color: ${color}; }
    .letterhead-desc { font-size: 11px; color: #666; margin-top: 2px; }
    /* ── Document title bar ── */
    .doc-title { background: ${color}; color: #fff; padding: 10px 16px; border-radius: 6px; font-size: 16px; font-weight: 700; margin-bottom: 18px; }
    /* ── Sections ── */
    .section { margin-bottom: 16px; padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 6px; page-break-inside: avoid; }
    .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: ${color}; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; }
    /* ── Field grid ── */
    .row { display: flex; gap: 20px; margin-bottom: 8px; }
    .field { flex: 1; }
    .field-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.04em; display: block; margin-bottom: 2px; }
    .field-value { font-size: 13px; color: #111; font-weight: 500; }
    /* ── Signature block ── */
    .sig-block { display: flex; gap: 40px; margin-top: 30px; }
    .sig-line { flex: 1; border-top: 1.5px solid #333; padding-top: 6px; font-size: 12px; color: #555; }
    /* ── Prose paragraphs ── */
    .prose { line-height: 1.65; color: #333; }
    .prose p { margin-bottom: 8px; }
    /* ── Footer ── */
    .doc-footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #888; text-align: center; }
    /* ── Print overrides ── */
    @media print { button { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <!-- Letterhead -->
  <div class="letterhead">
    ${logoHtml}
    <div class="letterhead-text">
      <div class="letterhead-company">${b.companyName}</div>
      ${b.description ? `<div class="letterhead-desc">${b.description}</div>` : ''}
    </div>
    <div style="text-align:right;font-size:11px;color:#888;">
      <div>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
      ${b.companyWebsite ? `<div>${b.companyWebsite}</div>` : ''}
    </div>
  </div>
  <!-- Document Title -->
  <div class="doc-title">${title}</div>
  <!-- Main Content -->
  ${content}
  <!-- Footer -->
  <div class="doc-footer">
    ${footerText}
    <br/>Generated by ${b.companyName} HR System &nbsp;&middot;&nbsp; Blumebyte HR &nbsp;&middot;&nbsp; Confidential
  </div>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 600); };</script>
</body>
</html>`);
  w.document.close();
}

export function SharedMyProfile() {
  const { user, accessToken, refreshProfile } = useAuth();
  const { branding } = useBranding();
  const { currencySymbol } = useCurrency();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'payslips' | 'leave-history' | 'documents'>('profile');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payslipSort, setPayslipSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'period', dir: 'desc' });
  const [leaveSort, setLeaveSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'startDate', dir: 'desc' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [myFiles, setMyFiles] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const docUploadRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const MAX_PROFILE_IMAGE_KB = 150;
  const MAX_FILE_MB = 1;
  const MAX_FILES = 5;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await api('/profile', { token: accessToken });
      setProfile(p);
      const [pay, lv, files] = await Promise.all([
        api('/my-payslips', { token: accessToken }).catch(() => []),
        api('/leave-requests', { token: accessToken }).catch(() => []),
        api('/files', { token: accessToken }).catch(() => []),
      ]);
      setPayslips(Array.isArray(pay) ? pay : []);
      setLeaves(Array.isArray(lv) ? lv.filter((l: any) => l.userId === p.id) : []);
      setMyFiles(Array.isArray(files) ? files : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const requestedTab = localStorage.getItem('employee_my_profile_tab');
    if (requestedTab === 'payslips' || requestedTab === 'leave-history' || requestedTab === 'documents' || requestedTab === 'profile') {
      setActiveTab(requestedTab);
    }
    localStorage.removeItem('employee_my_profile_tab');
  }, []);
  // Refresh profile every 60 seconds
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);
  // Immediately reload profile when HR approves profile changes
  useEffect(() => {
    const handler = () => load();
    window.addEventListener('blumebyte:profile-updated', handler);
    return () => window.removeEventListener('blumebyte:profile-updated', handler);
  }, [load]);

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const result = await api('/employee/profile', { method: 'PUT', body: editData, token: accessToken });
      if (result.pendingApproval) {
        toast.success('Profile changes submitted for HR approval');
      } else {
        toast.success('Profile updated');
      }
      setEditOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const isPrivilegedRole = profile?.role && ['superadmin', 'admin', 'manager'].includes(profile.role);

  const openEditDialog = () => {
    const data: any = {
      phone: profile?.phone || '',
      personalEmail: profile?.personalEmail || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      maritalStatus: profile?.maritalStatus || '',
      nationality: profile?.nationality || '',
      emergencyContact: profile?.emergencyContact || '',
      emergencyPhone: profile?.emergencyPhone || '',
    };
    // Admin/SuperAdmin/Manager can also edit their own employment details
    if (isPrivilegedRole) {
      data.name = profile?.name || '';
      data.position = profile?.position || '';
      data.department = profile?.department || '';
      data.company = profile?.company || '';
      data.salary = profile?.salary || '';
    }
    setEditData(data);
    setEditOpen(true);
  };

  const generateDocument = (docType: string) => {
    if (!profile) return;
    const currentYear = new Date().getFullYear();
    const currentQ = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${currentYear}`;
    const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const empId = profile.userId?.slice(0, 8).toUpperCase() || 'N/A';
    const empName = profile.name || '—';
    const empEmail = profile.email || '—';
    const empPhone = profile.phone || '—';
    const empAddress = [profile.address, profile.city, profile.state, profile.country].filter(Boolean).join(', ') || '—';
    const dept = profile.department || '—';
    const position = profile.position || '—';
    const salary = profile.salary || '—';
    const company = profile.company || branding.companyName;
    const companyAddr = branding.companyAddress || '—';
    const managerName = profile.managerName || 'HR Manager';

    const brandObj: PDFBranding = {
      companyName: branding.companyName,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      companyAddress: branding.companyAddress,
      companyPhone: branding.companyPhone,
      companyEmail: branding.companyEmail,
      companyWebsite: branding.companyWebsite,
      description: branding.description,
    };

    // ── Helper for a field row ──
    const fieldRow = (...pairs: [string, string][]) =>
      `<div class="row">${pairs.map(([label, val]) =>
        `<div class="field"><span class="field-label">${label}</span><span class="field-value">${val}</span></div>`
      ).join('')}</div>`;

    const sigBlock = (left: string, right: string) =>
      `<div class="sig-block"><div class="sig-line">${left}<br/>Date: _______________</div><div class="sig-line">${right}<br/>Date: _______________</div></div>`;

    let content = '';

    if (docType === 'Employment Contract') {
      content = `
        <div class="section">
          <div class="section-title">1. Parties</div>
          <div class="prose"><p>This Employment Contract is entered into between:</p></div>
          ${fieldRow(['Employer (Company)', company], ['Company Address', companyAddr])}
          ${fieldRow(['Employee Full Name', empName], ['Employee Address', empAddress])}
          ${fieldRow(['Employee ID', empId], ['Employee Email', empEmail])}
        </div>
        <div class="section">
          <div class="section-title">2. Job Title &amp; Role</div>
          ${fieldRow(['Job Title / Position', position], ['Department', dept])}
          ${fieldRow(['Employment Type', 'Full Time'], ['Reports To', managerName])}
        </div>
        <div class="section">
          <div class="section-title">3. Employment Start Date</div>
          ${fieldRow(['Start Date', joinDate], ['Contract Date', today])}
        </div>
        <div class="section">
          <div class="section-title">4. Compensation</div>
          ${fieldRow(['Annual / Monthly Salary', salary], ['Pay Period', 'Monthly'])}
          ${fieldRow(['Payment Method', 'Bank Transfer'], ['Currency', 'As per payroll configuration'])}
        </div>
        <div class="section">
          <div class="section-title">5. Working Hours</div>
          ${fieldRow(['Standard Hours', '40 hours per week'], ['Working Days', 'Monday – Friday'])}
        </div>
        <div class="section">
          <div class="section-title">6. Duties &amp; Responsibilities</div>
          <div class="prose"><p>The Employee shall perform all duties assigned to the role of <strong>${position}</strong> in the <strong>${dept}</strong> department, as directed by the Employer from time to time.</p></div>
        </div>
        <div class="section">
          <div class="section-title">7. Benefits</div>
          <div class="prose"><p>The Employee is entitled to benefits as outlined in the company's Benefits Policy, including health insurance, leave entitlements, and any other approved benefit plans.</p></div>
        </div>
        <div class="section">
          <div class="section-title">8. Leave Policy</div>
          <div class="prose"><p>The Employee is entitled to annual leave, sick leave, and other leave types as per the company's Leave Policy. Details can be accessed from the HR portal.</p></div>
        </div>
        <div class="section">
          <div class="section-title">9. Confidentiality</div>
          <div class="prose"><p>The Employee agrees to keep confidential all proprietary information, trade secrets, and business data of the Employer and shall not disclose such information to any third party during or after employment.</p></div>
        </div>
        <div class="section">
          <div class="section-title">10. Termination</div>
          <div class="prose"><p>Either party may terminate this agreement with a notice period as stipulated by applicable labour law. The Employer reserves the right to terminate for cause without notice in cases of gross misconduct.</p></div>
        </div>
        <div class="section">
          <div class="section-title">11. Governing Law</div>
          <div class="prose"><p>This contract is governed by the laws of <strong>${profile.country || 'the applicable jurisdiction'}</strong>.</p></div>
        </div>
        <div class="section">
          <div class="section-title">Signatures</div>
          <div class="prose" style="margin-bottom:16px;"><p>By signing below, both parties confirm they have read, understood, and agree to the terms of this Employment Contract.</p></div>
          ${sigBlock(`Employer / HR Manager: ${managerName}`, `Employee: ${empName}`)}
        </div>`;

    } else if (docType === 'Appointment Letter') {
      content = `
        <div class="section">
          <div class="section-title">Appointment Details</div>
          ${fieldRow(['Date', today], ['Reference', `APT-${empId}`])}
          ${fieldRow(['To', empName], ['Email', empEmail])}
          ${fieldRow(['Address', empAddress], ['Phone', empPhone])}
        </div>
        <div class="section">
          <div class="section-title">Dear ${empName},</div>
          <div class="prose">
            <p>We are pleased to offer you the position of <strong>${position}</strong> at <strong>${company}</strong>. After careful consideration, we are confident that your skills and experience will be a valuable addition to our team.</p>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Appointment Details</div>
          ${fieldRow(['Position / Job Title', position], ['Department', dept])}
          ${fieldRow(['Start Date', joinDate], ['Work Location', companyAddr || company])}
          ${fieldRow(['Reporting To', managerName], ['Salary', salary])}
          ${fieldRow(['Employee ID', empId], ['Employment Type', 'Full Time'])}
        </div>
        <div class="section">
          <div class="section-title">Role Summary</div>
          <div class="prose"><p>In this role, you will be responsible for all duties associated with the <strong>${position}</strong> position within the <strong>${dept}</strong> department. You are expected to maintain professional conduct, meet performance targets, and uphold the company's values at all times.</p></div>
        </div>
        <div class="section">
          <div class="section-title">Expectations</div>
          <div class="prose">
            <p>• Adhere to all company policies and procedures.</p>
            <p>• Maintain confidentiality of all business and client information.</p>
            <p>• Actively participate in performance reviews and team activities.</p>
            <p>• Report directly to your line manager for task assignments and performance feedback.</p>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Acceptance</div>
          <div class="prose"><p>Please sign and return a copy of this letter to confirm your acceptance of this appointment no later than <strong>5 working days</strong> from the date of this letter.</p></div>
          ${sigBlock(`HR Manager: ${managerName}<br/>${company}`, `Employee: ${empName}<br/>Employee Signature`)}
        </div>`;

    } else if (docType === 'Tax Forms') {
      content = `
        <div class="section">
          <div class="section-title">Employee Tax Information — ${currentYear}</div>
          ${fieldRow(['Employee Full Name', empName], ['Employee ID', empId])}
          ${fieldRow(['Department', dept], ['Company', company])}
          ${fieldRow(['Email', empEmail], ['Tax Year', String(currentYear)])}
        </div>
        <div class="section">
          <div class="section-title">Financial Details</div>
          ${fieldRow(['Gross Salary / Income', salary], ['Pay Period', 'Monthly'])}
          ${fieldRow(['Allowances', 'As per payroll configuration'], ['Deductions', 'As per payroll configuration'])}
          ${fieldRow(['Total Taxable Income', salary], ['Tax Payable', 'As calculated by payroll system'])}
        </div>
        <div class="section">
          <div class="section-title">Tax Summary</div>
          <div class="prose">
            <p>This form summarises the tax information for the employee as recorded in the HR system for the tax year <strong>${currentYear}</strong>. Actual tax calculations are governed by the applicable tax laws and regulations.</p>
            <p>For full payroll breakdowns, refer to the employee's payslip history in the HR portal.</p>
          </div>
        </div>
        <div class="section">
          <div class="section-title">Declaration</div>
          <div class="prose"><p>I, <strong>${empName}</strong>, hereby confirm that the information provided in this form is accurate and complete to the best of my knowledge.</p></div>
          ${sigBlock(`Employee: ${empName}`, `HR Manager: ${managerName}<br/>${company}`)}
        </div>`;

    } else if (docType === 'Benefits Enrollment') {
      content = `
        <div class="section">
          <div class="section-title">Employee Information</div>
          ${fieldRow(['Full Name', empName], ['Employee ID', empId])}
          ${fieldRow(['Department', dept], ['Position', position])}
          ${fieldRow(['Enrollment Date', joinDate], ['Status', 'Active'])}
        </div>
        <div class="section">
          <div class="section-title">1. Selected Benefits</div>
          <div class="prose"><p>Benefits are provided as per the company's approved benefit plans. Contact HR for a full list of available plans and entitlements.</p></div>
          ${fieldRow(['Health Insurance', 'Company Health Plan (Active)'], ['Retirement Plan', 'As per company policy'])}
          ${fieldRow(['Annual Leave', 'As per Leave Policy'], ['Sick Leave', 'As per Leave Policy'])}
        </div>
        <div class="section">
          <div class="section-title">2. Health Insurance Plan</div>
          ${fieldRow(['Health Plan', 'Standard Company Health Insurance'], ['Effective From', joinDate])}
          ${fieldRow(['Coverage', 'Employee + Dependents (as applicable)'], ['Provider', 'As per company arrangement'])}
        </div>
        <div class="section">
          <div class="section-title">3. Retirement Plan</div>
          ${fieldRow(['Plan Name', 'Company Pension / Provident Fund'], ['Contribution', 'As per statutory requirement'])}
          ${fieldRow(['Effective From', joinDate], ['Employee Contribution', 'As per payroll'])}
        </div>
        <div class="section">
          <div class="section-title">4. Dependents</div>
          <div class="prose"><p>Dependents covered under this benefits enrollment should be registered with HR separately. Please submit the relevant documentation to the HR department.</p></div>
        </div>
        <div class="section">
          <div class="section-title">Agreement &amp; Signature</div>
          <div class="prose"><p>I, <strong>${empName}</strong>, agree to the terms and conditions of the selected benefits as outlined in this enrollment form and the company's Benefits Policy.</p></div>
          ${sigBlock(`Employee: ${empName}`, `HR Manager: ${managerName}<br/>${company}`)}
        </div>`;

    } else if (docType.startsWith('Payslip - ')) {
      const period = docType.replace('Payslip - ', '');
      const p = payslips.find((ps: any) => ps.period === period) || payslips[0];
      if (p) {
        const net = (parseFloat(p.basicSalary || 0) + parseFloat(p.allowances || 0) - parseFloat(p.deductions || 0)).toFixed(2);
        content = `
          <div class="section">
            <div class="section-title">Employee Information</div>
            ${fieldRow(['Employee Name', empName], ['Employee ID', empId])}
            ${fieldRow(['Department', dept], ['Position', position])}
            ${fieldRow(['Company', company], ['Email', empEmail])}
          </div>
          <div class="section">
            <div class="section-title">Payslip Details — ${p.period || '—'}</div>
            ${fieldRow(['Pay Period', p.period || '—'], ['Pay Date', p.payDate || '—'])}
            ${fieldRow(['Status', p.status || 'pending'], ['Reference', p.id ? p.id.slice(0, 8).toUpperCase() : '—'])}
          </div>
          <div class="section">
            <div class="section-title">Earnings &amp; Deductions</div>
            <table border="0" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;">
              <tbody>
                <tr style="background:#f9fafb;"><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Basic Salary</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;">${currencySymbol} ${parseFloat(p.basicSalary || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                <tr><td style="padding:8px;border:1px solid #e5e7eb;">Allowances</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;color:#16a34a;">+ ${currencySymbol} ${parseFloat(p.allowances || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                <tr><td style="padding:8px;border:1px solid #e5e7eb;">Deductions</td><td style="padding:8px;border:1px solid #e5e7eb;text-align:right;color:#dc2626;">- ${currencySymbol} ${parseFloat(p.deductions || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
                <tr style="background:#f0fdf4;font-weight:700;"><td style="padding:10px;border:1px solid #e5e7eb;">Net Pay</td><td style="padding:10px;border:1px solid #e5e7eb;text-align:right;font-size:14px;">${currencySymbol} ${parseFloat(net).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td></tr>
              </tbody>
            </table>
            ${p.notes ? `<p style="margin-top:12px;font-size:11px;color:#6b7280;"><em>Notes: ${p.notes}</em></p>` : ''}
          </div>
          <div class="section">
            <div class="section-title">Acknowledgement</div>
            ${sigBlock(`Employee: ${empName}`, `HR Manager / ${company}`)}
          </div>`;
      } else {
        content = `<div class="section"><p>No payslip data found for the selected period.</p></div>`;
      }

    } else if (docType.includes('Performance Review')) {
      const period = docType.includes('Q') ? docType.replace('Performance Review ', '') : currentQ;
      content = `
        <div class="section">
          <div class="section-title">Review Information</div>
          ${fieldRow(['Employee', empName], ['Employee ID', empId])}
          ${fieldRow(['Department', dept], ['Position', position])}
          ${fieldRow(['Review Period', period], ['Review Date', today])}
          ${fieldRow(['Reviewer / Manager', managerName], ['Company', company])}
        </div>
        <div class="section">
          <div class="section-title">1. Key Objectives</div>
          <div class="prose"><p>Objectives set for the review period should be aligned with department goals and the employee's individual development plan. Refer to Goals &amp; OKRs in the HR portal for the specific targets for this period.</p></div>
        </div>
        <div class="section">
          <div class="section-title">2. Performance Rating</div>
          ${fieldRow(['Overall Rating', '_____ / 5'], ['Rating Scale', '1 = Needs Improvement, 5 = Exceptional'])}
        </div>
        <div class="section">
          <div class="section-title">3. Achievements</div>
          <div class="prose"><p>Notable achievements during the review period:</p>
            <p>1. _______________________________________________</p>
            <p>2. _______________________________________________</p>
            <p>3. _______________________________________________</p>
          </div>
        </div>
        <div class="section">
          <div class="section-title">4. Areas for Improvement</div>
          <div class="prose">
            <p>1. _______________________________________________</p>
            <p>2. _______________________________________________</p>
          </div>
        </div>
        <div class="section">
          <div class="section-title">5. Manager Feedback</div>
          <div class="prose"><p>_______________________________________________<br/>_______________________________________________<br/>_______________________________________________</p></div>
        </div>
        <div class="section">
          <div class="section-title">6. Employee Comments</div>
          <div class="prose"><p>_______________________________________________<br/>_______________________________________________<br/>_______________________________________________</p></div>
        </div>
        <div class="section">
          <div class="section-title">7. Final Evaluation &amp; Signatures</div>
          ${fieldRow(['Final Rating', '_____ / 5'], ['Outcome', '☐ Meets Expectations  ☐ Exceeds  ☐ Below Expectations'])}
          ${sigBlock(`Manager: ${managerName}`, `Employee: ${empName}`)}
        </div>`;
    }

    exportToPDFDoc(docType, content, brandObj);
  };

  // Profile image upload handler
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only image files (JPG, PNG, GIF, WEBP) are allowed');
      return;
    }
    // Read file and open crop dialog
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropPosition({ x: 0, y: 0 });
      setCropZoom(1);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    if (profileImageRef.current) profileImageRef.current.value = '';
  };

  // Perform the crop and upload
  const handleCropAndUpload = async () => {
    if (!cropImageSrc) return;
    setUploadingImage(true);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = cropImageSrc;
      });

      const CROP_SIZE = 200;
      const canvas = document.createElement('canvas');
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext('2d')!;

      // Calculate source dimensions — match CSS positioning logic
      // CSS: image width/height = 100% * cropZoom of container, positioned at (50 + cropPosition.x)%, (50 + cropPosition.y)% with translate(-50%, -50%)
      // Container is 224px (w-56), image is displayed at 224 * cropZoom px
      const containerSize = 224; // matches w-56 = 14rem = 224px
      const imgDisplaySize = containerSize * cropZoom;
      // Image center in container coordinates:
      const imgCenterX = (containerSize * (50 + cropPosition.x)) / 100;
      const imgCenterY = (containerSize * (50 + cropPosition.y)) / 100;
      // Visible window in image display coordinates:
      // Container shows from (0,0) to (containerSize, containerSize)
      // Image goes from (imgCenterX - imgDisplaySize/2) to (imgCenterX + imgDisplaySize/2)
      const visibleLeft = -imgCenterX + imgDisplaySize / 2;
      const visibleTop = -imgCenterY + imgDisplaySize / 2;
      // Convert to source image coordinates
      const scaleX = img.width / imgDisplaySize;
      const scaleY = img.height / imgDisplaySize;
      const srcX = visibleLeft * scaleX;
      const srcY = visibleTop * scaleY;
      const srcW = containerSize * scaleX;
      const srcH = containerSize * scaleY;

      // Draw circular clip
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);

      // Try progressively lower quality to stay under the size limit
      let blob: Blob | null = null;
      for (let quality = 0.8; quality >= 0.1; quality -= 0.1) {
        blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= MAX_PROFILE_IMAGE_KB * 1024) break;
      }
      if (!blob) {
        toast.error('Could not compress image enough. Try a smaller image.');
        setUploadingImage(false);
        return;
      }
      if (blob.size > MAX_PROFILE_IMAGE_KB * 1024) {
        toast.error(`Cropped image is ${Math.round(blob.size / 1024)}KB. Max is ${MAX_PROFILE_IMAGE_KB}KB. Try zooming out or using a smaller image.`);
        setUploadingImage(false);
        return;
      }

      const fd = new FormData();
      fd.append('file', blob, 'profile.jpg');
      const result = await apiUpload('/upload/profile-image', fd, accessToken);
      if (!result) throw new Error('Profile image upload failed');
      toast.success('Profile image updated');
      setCropDialogOpen(false);
      setCropImageSrc(null);
      setTimeout(() => { load(); refreshProfile(); }, 500);
    } catch (err: any) {
      console.error('Profile image upload error:', err);
      toast.error(err.message || 'Profile image upload failed');
    }
    setUploadingImage(false);
  };

  // Crop drag handlers — position is in percentage units for the CSS
  const handleCropMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    dragStart.current = {
      x: e.clientX - (cropPosition.x / 100) * containerSize,
      y: e.clientY - (cropPosition.y / 100) * containerSize
    };
  };
  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    setCropPosition({
      x: ((e.clientX - dragStart.current.x) / containerSize) * 100,
      y: ((e.clientY - dragStart.current.y) / containerSize) * 100,
    });
  };
  const handleCropMouseUp = () => { isDragging.current = false; };
  const handleCropTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    const t = e.touches[0];
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    dragStart.current = {
      x: t.clientX - (cropPosition.x / 100) * containerSize,
      y: t.clientY - (cropPosition.y / 100) * containerSize
    };
  };
  const handleCropTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const t = e.touches[0];
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    setCropPosition({
      x: ((t.clientX - dragStart.current.x) / containerSize) * 100,
      y: ((t.clientY - dragStart.current.y) / containerSize) * 100,
    });
  };
  const handleCropTouchEnd = () => { isDragging.current = false; };

  // Document upload handler
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File must be less than ${MAX_FILE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    const docFiles = myFiles.filter(f => f.type !== 'profile-image');
    if (docFiles.length >= MAX_FILES) {
      toast.error(`Upload limit reached (${MAX_FILES} files). Delete some files before uploading more.`);
      return;
    }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', 'general');
      await apiUpload('/upload/document', fd, accessToken);
      toast.success('Document uploaded');
      load();
    } catch (err: any) { toast.error(err.message); }
    setUploadingDoc(false);
    if (docUploadRef.current) docUploadRef.current.value = '';
  };

  // Delete file handler
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file? This action cannot be undone.')) return;
    try {
      await api(`/files/${user?.id}/${fileId}`, { method: 'DELETE', token: accessToken });
      toast.success('File deleted');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  // Remove profile image
  const handleRemoveProfileImage = async () => {
    if (!confirm('Remove your profile image?')) return;
    try {
      await api(`/files/${user?.id}/profile-image`, { method: 'DELETE', token: accessToken });
      toast.success('Profile image removed');
      load();
      refreshProfile();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  const tabs = [
    { id: 'profile', label: 'Full Profile' },
    { id: 'payslips', label: 'My Payslips' },
    { id: 'leave-history', label: `Leave History`, count: leaves.length },
    { id: 'documents', label: 'Documents & Reports' },
  ];

  const roleLabel = profile?.role === 'superadmin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : profile?.role === 'manager' ? 'Manager' : 'Employee';
  const rolePosition = profile?.role === 'superadmin' ? 'Super Administrator' : profile?.role === 'admin' ? 'Administrator' : profile?.role === 'manager' ? 'Manager' : 'Employee';

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
        <div>
          <h1 className="text-xl font-bold">My Profile</h1>
          <p className="text-sm text-gray-500">View your employment details, payslips, documents & reports</p>
        </div>
      </div>

      <div className="flex gap-1 mt-4 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label} {t.count !== undefined && t.count > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700 text-[10px]">{t.count}</Badge>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-base">My Full Profile</CardTitle><p className="text-sm text-muted-foreground mt-0.5">All HR-entered details about your employment</p></div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openEditDialog}><Pencil className="w-4 h-4 mr-1" />{isPrivilegedRole ? 'Edit Profile' : 'Edit Contact Info'}</Button>
                  <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Profile Header */}
              <div className="bg-accent rounded-xl p-5 mb-6 flex items-center gap-4">
                <div className="relative group">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-card shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">{profile?.name?.[0] || 'U'}</div>
                  )}
                  <button
                    onClick={() => profileImageRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploadingImage ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                  </button>
                  <input ref={profileImageRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleProfileImageUpload} />
                  {profile?.profileImageUrl && (
                    <button onClick={handleRemoveProfileImage} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600" title="Remove photo">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{profile?.name}</h2>
                  <p className="text-sm text-gray-600">{rolePosition} {profile?.department ? `\u00b7 ${profile.department}` : ''}</p>
                  <div className="flex gap-2 mt-1.5">
                    <Badge className="bg-green-100 text-green-700">{profile?.status || 'active'}</Badge>
                    <Badge variant="outline">ID: {profile?.userId?.slice(0, 13).toUpperCase() || 'N/A'}</Badge>
                    <Badge className="bg-blue-100 text-blue-700">{roleLabel}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Hover avatar to change photo (max {MAX_PROFILE_IMAGE_KB}KB)</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><User className="w-4 h-4 text-blue-500" /><h3 className="font-semibold text-sm">Personal Information</h3></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Full Name', value: profile?.name },
                    { label: 'Work Email', value: profile?.email },
                    { label: 'Date of Birth', value: profile?.dateOfBirth },
                    { label: 'Gender', value: profile?.gender },
                    { label: 'Marital Status', value: profile?.maritalStatus },
                    { label: 'Nationality', value: profile?.nationality },
                  ].map((f, i) => (
                    <div key={i} className="bg-accent rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium mt-0.5">{f.value || '\u2014'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact & Address */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Phone className="w-4 h-4 text-green-500" /><h3 className="font-semibold text-sm">Contact & Address</h3></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Mobile Phone', value: profile?.phone },
                    { label: 'Personal Email', value: profile?.personalEmail },
                    { label: 'Street Address', value: profile?.address },
                    { label: 'City / Town', value: profile?.city },
                    { label: 'Region / State', value: profile?.state },
                    { label: 'Country', value: profile?.country },
                  ].map((f, i) => (
                    <div key={i} className="bg-accent rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium mt-0.5">{f.value || '\u2014'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Details */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Briefcase className="w-4 h-4 text-purple-500" /><h3 className="font-semibold text-sm">Employment Details</h3></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Position', value: profile?.position },
                    { label: 'Department', value: profile?.department },
                    { label: 'Company', value: profile?.company },
                    { label: 'Role', value: roleLabel },
                    { label: 'Salary', value: profile?.salary },
                    { label: 'Joined', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : null },
                  ].map((f, i) => (
                    <div key={i} className="bg-accent rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium mt-0.5">{f.value || '\u2014'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-red-500" /><h3 className="font-semibold text-sm">Emergency Contact</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-accent rounded-lg p-3"><p className="text-[11px] text-muted-foreground">Emergency Contact Name</p><p className="text-sm font-medium mt-0.5">{profile?.emergencyContact || '\u2014'}</p></div>
                  <div className="bg-accent rounded-lg p-3"><p className="text-[11px] text-muted-foreground">Emergency Phone</p><p className="text-sm font-medium mt-0.5">{profile?.emergencyPhone || '\u2014'}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'payslips' && (() => {
          const sorted = [...payslips].sort((a, b) => { const av = a[payslipSort.key]||'', bv = b[payslipSort.key]||''; return payslipSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
          const toggleSort = (k: string) => setPayslipSort(p => p.key === k ? { key: k, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'desc' });
          const SI = ({ c }: { c: string }) => payslipSort.key === c ? (payslipSort.dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />) : <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
          const printAll = () => {
            if (!profile) return;
            const rows = sorted.map(p => { const net = (parseFloat(p.basicSalary||0)+parseFloat(p.allowances||0)-parseFloat(p.deductions||0)).toFixed(2); return `<tr><td>${p.period||'—'}</td><td>${p.payDate||'—'}</td><td>${currencySymbol} ${parseFloat(p.basicSalary||0).toLocaleString()}</td><td>${currencySymbol} ${parseFloat(p.allowances||0).toLocaleString()}</td><td>${currencySymbol} ${parseFloat(p.deductions||0).toLocaleString()}</td><td><strong>${currencySymbol} ${parseFloat(net).toLocaleString()}</strong></td><td>${p.status||'pending'}</td></tr>`; }).join('');
            const b: PDFBranding = { companyName: branding.companyName, logoUrl: branding.logoUrl, primaryColor: branding.primaryColor, companyAddress: branding.companyAddress, companyPhone: branding.companyPhone, companyEmail: branding.companyEmail, companyWebsite: branding.companyWebsite, description: branding.description };
            exportToPDFDoc('Payslip Report', `<div class="section"><div class="section-title">Employee: ${profile.name}</div><p style="font-size:11px;color:#888;margin-bottom:12px;">Generated: ${new Date().toLocaleString()}</p><table border="0" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;"><thead><tr style="background:#f3f4f6;"><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Period</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Pay Date</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Basic</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Allowances</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Deductions</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Net Pay</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Status</th></tr></thead><tbody>${rows}</tbody></table></div>`, b);
          };
          return (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">My Payslips</CardTitle>{payslips.length > 0 && <div className="flex gap-2"><Button variant="outline" size="sm" onClick={printAll}><Printer className="w-3.5 h-3.5 mr-1" />Print All</Button><Button variant="outline" size="sm" onClick={() => { const csv = ['Period,Pay Date,Basic,Allowances,Deductions,Net,Status',...sorted.map(p => { const net=(parseFloat(p.basicSalary||0)+parseFloat(p.allowances||0)-parseFloat(p.deductions||0)).toFixed(2); return `${p.period||''},${p.payDate||''},${p.basicSalary||0},${p.allowances||0},${p.deductions||0},${net},${p.status||'pending'}`; })].join('\n'); const b=new Blob([csv],{type:'text/csv'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='payslips.csv'; a.click(); URL.revokeObjectURL(u); toast.success('Exported'); }}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button></div>}</div></CardHeader>
            <CardContent>
              {payslips.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No payslip records found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('period')}>Period<SI c="period" /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('payDate')}>Pay Date<SI c="payDate" /></TableHead>
                      <TableHead>Basic Salary</TableHead><TableHead>Allowances</TableHead><TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>Status<SI c="status" /></TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((p, idx) => {
                      const net = (parseFloat(p.basicSalary || 0) + parseFloat(p.allowances || 0) - parseFloat(p.deductions || 0)).toFixed(2);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{p.period || '\u2014'}</TableCell>
                          <TableCell>{p.payDate || '\u2014'}</TableCell>
                          <TableCell>{currencySymbol} {parseFloat(p.basicSalary || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">+{parseFloat(p.allowances || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-red-600">-{parseFloat(p.deductions || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold">{currencySymbol} {parseFloat(net).toLocaleString()}</TableCell>
                          <TableCell><Badge className={p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{p.status || 'pending'}</Badge></TableCell>
                          <TableCell><Button variant="outline" size="sm" onClick={() => generateDocument(`Payslip - ${p.period || 'N/A'}`)}><Download className="w-3 h-3 mr-1" />PDF</Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>); })()}

        {activeTab === 'leave-history' && (() => {
          const sorted = [...leaves].sort((a, b) => { const av = a[leaveSort.key]||'', bv = b[leaveSort.key]||''; return leaveSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
          const toggleSort = (k: string) => setLeaveSort(p => p.key === k ? { key: k, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'desc' });
          const SI = ({ c }: { c: string }) => leaveSort.key === c ? (leaveSort.dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />) : <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
          const printLeave = () => {
            if (!profile) return;
            const rows = sorted.map(l => `<tr><td style="padding:8px;border:1px solid #e5e7eb;">${l.leaveType||l.type||'—'}</td><td style="padding:8px;border:1px solid #e5e7eb;">${l.startDate||'—'}</td><td style="padding:8px;border:1px solid #e5e7eb;">${l.endDate||'—'}</td><td style="padding:8px;border:1px solid #e5e7eb;">${l.reason||'—'}</td><td style="padding:8px;border:1px solid #e5e7eb;">${l.status}</td></tr>`).join('');
            const b: PDFBranding = { companyName: branding.companyName, logoUrl: branding.logoUrl, primaryColor: branding.primaryColor, companyAddress: branding.companyAddress, companyPhone: branding.companyPhone, companyEmail: branding.companyEmail, companyWebsite: branding.companyWebsite, description: branding.description };
            exportToPDFDoc('Leave History', `<div class="section"><div class="section-title">Employee: ${profile.name}</div><p style="font-size:11px;color:#888;margin-bottom:12px;">Generated: ${new Date().toLocaleString()}</p><table border="0" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e7eb;"><thead><tr style="background:#f3f4f6;"><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Type</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Start</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">End</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Reason</th><th style="text-align:left;padding:8px;border:1px solid #e5e7eb;">Status</th></tr></thead><tbody>${rows}</tbody></table></div>`, b);
          };
          return (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Leave History</CardTitle>{leaves.length > 0 && <Button variant="outline" size="sm" onClick={printLeave}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>}</div></CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No leave records found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('leaveType')}>Type<SI c="leaveType" /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('startDate')}>Start Date<SI c="startDate" /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('endDate')}>End Date<SI c="endDate" /></TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>Status<SI c="status" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((l, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{l.leaveType || l.type || '\u2014'}</TableCell>
                        <TableCell>{l.startDate || '\u2014'}</TableCell>
                        <TableCell>{l.endDate || '\u2014'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{l.reason || '\u2014'}</TableCell>
                        <TableCell><Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{l.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>); })()}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">My Uploaded Files</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">Upload contracts, documents, and files (max {MAX_FILE_MB}MB each, {MAX_FILES} files total)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{myFiles.filter(f => f.type !== 'profile-image').length} / {MAX_FILES} files</Badge>
                    <Button size="sm" onClick={() => docUploadRef.current?.click()} disabled={uploadingDoc || myFiles.filter(f => f.type !== 'profile-image').length >= MAX_FILES}>
                      {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                      Upload File
                    </Button>
                    <input ref={docUploadRef} type="file" className="hidden" onChange={handleDocUpload} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {myFiles.filter(f => f.type !== 'profile-image').length >= MAX_FILES && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">Upload limit reached ({MAX_FILES} files). Delete existing files to upload more.</p>
                  </div>
                )}
                {myFiles.filter(f => f.type !== 'profile-image').length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No files uploaded yet</p>
                    <p className="text-xs mt-1">Upload contracts, documents, or other files (max {MAX_FILE_MB}MB)</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myFiles.filter(f => f.type !== 'profile-image').map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center border text-blue-500">
                            {f.mimeType?.startsWith('image/') ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{f.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(f.fileSize / 1024).toFixed(1)}KB &middot; {f.type || 'general'} &middot; {new Date(f.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {f.signedUrl && (
                            <Button variant="outline" size="sm" className="h-7" onClick={() => window.open(f.signedUrl, '_blank')}>
                              <Download className="w-3 h-3 mr-1" />View
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteFile(f.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><div><CardTitle className="text-base">Employment Documents & Certificates</CardTitle><p className="text-sm text-muted-foreground mt-0.5">Official documents generated from your employee record</p></div></div>
                  <Button variant="outline" size="sm" onClick={() => { 
                    const csv = `Document,Date,Type\nEmployment Contract,${new Date().toLocaleDateString()},PDF\nAppointment Letter,${new Date().toLocaleDateString()},PDF\nTax Forms,${new Date().toLocaleDateString()},PDF\nBenefits Enrollment,${new Date().toLocaleDateString()},PDF`;
                    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'documents-list.csv'; a.click(); URL.revokeObjectURL(url);
                    toast.success('Exported document list');
                  }}><FileText className="w-4 h-4 mr-1 text-green-600" />Export List (Excel)</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  const docList = [
                    { name: 'Employment Contract', date: joinDate, color: 'text-red-500' },
                    { name: 'Appointment Letter', date: joinDate, color: 'text-red-500' },
                    { name: 'Tax Forms', date: `Jan 01, ${currentYear}`, color: 'text-blue-500' },
                    { name: 'Benefits Enrollment', date: joinDate, color: 'text-green-500' },
                    { name: `Performance Review Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${currentYear}`, date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), color: 'text-purple-500' },
                  ];
                  return docList.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-card flex items-center justify-center border ${doc.color}`}><FileText className="w-5 h-5" /></div>
                      <div><p className="text-sm font-medium">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.date} &middot; PDF</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => generateDocument(doc.name)}><Eye className="w-3.5 h-3.5 mr-1" />Preview</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => generateDocument(doc.name)}><Download className="w-3.5 h-3.5 mr-1" />Download PDF</Button>
                    </div>
                  </div>
                  ));
                })()}
                </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Profile Details</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {/* Employment Details — only for admin/superadmin/manager */}
            {isPrivilegedRole && (
              <>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Employment Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Full Name</Label><Input value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} /></div>
                  <div><Label>Position</Label><Input value={editData.position || ''} onChange={e => setEditData({ ...editData, position: e.target.value })} placeholder="e.g., HR Manager" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Department</Label><Input value={editData.department || ''} onChange={e => setEditData({ ...editData, department: e.target.value })} placeholder="e.g., Human Resources" /></div>
                  <div><Label>Company</Label><Input value={editData.company || ''} onChange={e => setEditData({ ...editData, company: e.target.value })} placeholder="e.g., Blumebyte" /></div>
                  <div><Label>Salary</Label><Input value={editData.salary || ''} onChange={e => setEditData({ ...editData, salary: e.target.value })} placeholder={`e.g., ${currencySymbol} 5,000`} /></div>
                </div>
                <Separator />
              </>
            )}

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mobile Phone</Label><Input value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} /></div>
              <div><Label>Personal Email</Label><Input type="email" value={editData.personalEmail || ''} onChange={e => setEditData({ ...editData, personalEmail: e.target.value })} /></div>
            </div>
            <div><Label>Street Address</Label><Input value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>City</Label><Input value={editData.city || ''} onChange={e => setEditData({ ...editData, city: e.target.value })} /></div>
              <div><Label>Region/State</Label><Input value={editData.state || ''} onChange={e => setEditData({ ...editData, state: e.target.value })} /></div>
              <div><Label>Country</Label><Input value={editData.country || ''} onChange={e => setEditData({ ...editData, country: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date of Birth</Label><Input type="date" value={editData.dateOfBirth || ''} onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })} /></div>
              <div><Label>Gender</Label>
                <Select value={['male','female','other'].includes(editData.gender) ? editData.gender : (editData.gender ? 'other' : '')} onValueChange={v => {
                  if (v === 'other') {
                    setEditData({ ...editData, gender: 'other' });
                  } else {
                    setEditData({ ...editData, gender: v });
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
                {(editData.gender === 'other' || (editData.gender && !['male','female'].includes(editData.gender))) && (
                  <Input className="mt-2" placeholder="Specify gender..." value={editData.gender !== 'other' ? editData.gender : ''} onChange={e => setEditData({ ...editData, gender: e.target.value || 'other' })} autoFocus />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marital Status</Label>
                <Select value={['single','married','divorced','widowed','other'].includes(editData.maritalStatus) ? editData.maritalStatus : (editData.maritalStatus ? 'other' : '')} onValueChange={v => {
                  if (v === 'other') {
                    setEditData({ ...editData, maritalStatus: 'other' });
                  } else {
                    setEditData({ ...editData, maritalStatus: v });
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select marital status" /></SelectTrigger>
                  <SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem><SelectItem value="divorced">Divorced</SelectItem><SelectItem value="widowed">Widowed</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
                {(editData.maritalStatus === 'other' || (editData.maritalStatus && !['single','married','divorced','widowed'].includes(editData.maritalStatus))) && (
                  <Input className="mt-2" placeholder="Specify marital status..." value={editData.maritalStatus !== 'other' ? editData.maritalStatus : ''} onChange={e => setEditData({ ...editData, maritalStatus: e.target.value || 'other' })} autoFocus />
                )}
              </div>
              <div><Label>Nationality</Label><Input value={editData.nationality || ''} onChange={e => setEditData({ ...editData, nationality: e.target.value })} placeholder="e.g., Ghanaian" /></div>
            </div>
            <Separator />
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Emergency Contact</Label><Input value={editData.emergencyContact || ''} onChange={e => setEditData({ ...editData, emergencyContact: e.target.value })} /></div>
              <div><Label>Emergency Phone</Label><Input value={editData.emergencyPhone || ''} onChange={e => setEditData({ ...editData, emergencyPhone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            {!isPrivilegedRole && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 mr-auto">Changes require HR approval</Badge>}
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{!isPrivilegedRole ? 'Submit for Approval' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!open && !uploadingImage) { setCropDialogOpen(false); setCropImageSrc(null); } }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Crop Profile Image</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Drag the image to reposition. Use the slider to zoom in/out.</p>
          <div className="flex flex-col items-center gap-4 py-2">
            {/* Circular crop preview */}
            <div
              ref={cropContainerRef}
              className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-blue-200 cursor-move select-none bg-gray-100"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
              onTouchStart={handleCropTouchStart}
              onTouchMove={handleCropTouchMove}
              onTouchEnd={handleCropTouchEnd}
            >
              {cropImageSrc && (
                <img
                  src={cropImageSrc}
                  alt="Crop preview"
                  className="absolute pointer-events-none"
                  draggable={false}
                  style={{
                    width: `${100 * cropZoom}%`,
                    height: `${100 * cropZoom}%`,
                    objectFit: 'cover',
                    left: `${50 + cropPosition.x}%`,
                    top: `${50 + cropPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>
            {/* Zoom slider */}
            <div className="flex items-center gap-3 w-full max-w-xs">
              <span className="text-xs text-gray-500">-</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={e => setCropZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-gray-500">+</span>
            </div>
            <p className="text-[11px] text-gray-400">Image will be auto-compressed to fit under {MAX_PROFILE_IMAGE_KB}KB</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCropDialogOpen(false); setCropImageSrc(null); }}>Cancel</Button>
            <Button onClick={handleCropAndUpload} disabled={uploadingImage}>
              {uploadingImage && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Crop & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
