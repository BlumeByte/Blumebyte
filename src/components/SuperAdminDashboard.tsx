import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { scrollToTop } from '../lib/navigation-utils';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { NativeSelect } from './ui/native-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import {
  LayoutDashboard, Building2, GitBranch, FolderTree, Users, UserPlus,
  Settings, Loader2, Plus, Pencil, Trash2, Search, ShieldCheck,
  ChevronLeft, ChevronRight, KeyRound, Copy, Megaphone, X,
  Building, Briefcase, DollarSign, CalendarDays, PanelLeftClose, PanelLeftOpen,
  RefreshCw, CheckCircle, AlertCircle, ChevronDown, Package, FileText,
  Clock, TrendingUp, BarChart3, FileCheck, ClipboardList, Calendar,
  Award, Target, MessageSquare, GitMerge, UserCheck, BookOpen, Archive,
  MessageCircle, Send, Mail, User, Download, Upload, ArrowUpRight,
  Eye, Star, MapPin, GraduationCap, Gavel, Shield, Heart, Zap,
  ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet, Printer, Filter, LogOut, Play, CreditCard, Activity
} from 'lucide-react';
import { MessagesPanel } from './MessagesPanel';
import { NotificationsBell } from './NotificationsBell';
import { LicenseStatusBanner } from './LicenseStatusBanner';
import { SubscriptionBadge } from './SubscriptionBadge';
import { SharedMyProfile } from './SharedMyProfile';
import { SharedSelfServiceHub } from './SharedSelfServiceHub';
import { BackupRestore } from './BackupRestore';
import { HiringApprovalPanel } from './HiringApprovalPanel';
import { ClockInOut } from './ClockInOut';
import { ReportsPanel } from './ReportsPanel';
import { MeetingsPanel } from './MeetingsPanel';
import { ProfileChangeRequests } from './ProfileChangeRequests';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useBranding, brandGradientStyle } from '../lib/branding-context';
import { useCurrency } from '../lib/currency-context';
import { AuditLogsModule } from './AuditLogsModule';
import { AdvancedReportsModule } from './AdvancedReportsModule';
import { LicenseManagement } from './LicenseManagement';
import { WorkingHoursConfig } from './WorkingHoursConfig';
import { ClientOnlyChart } from './ClientOnlyChart';
import { CompensationModule } from './CompensationModule';
import { PayGradesModule } from './PayGradesModule';
import { FinancialYearsModule } from './FinancialYearsModule';
import { TaxConfigurationModule } from './TaxConfigurationModule';
import { BenefitsModule } from './BenefitsModule';
import { MultiDepartmentSelect } from './MultiDepartmentSelect';
import { AutomationModule } from './AutomationModule';
import { OvertimeExpenseApproval } from './OvertimeExpenseApproval';
import { SurveyBuilder } from './SurveyBuilder';
import { EmployeeEngagementAnalytics } from './EmployeeEngagementAnalytics';
import { CompanySwitcher } from './CompanySwitcher';
import { CompanyUsageAnalytics } from './CompanyUsageAnalytics';
import { GlobalCurrencySettings } from './GlobalCurrencySettings';
import { CompanyBrandingSettings } from './CompanyBrandingSettings';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { id: 'companies', label: 'Companies', icon: Building2, group: 'organization' },
  { id: 'branches', label: 'Branches', icon: GitBranch, group: 'organization' },
  { id: 'departments', label: 'Departments', icon: FolderTree, group: 'organization' },
  { id: 'assets', label: 'Assets', icon: Briefcase, group: 'assets' },
  { id: 'asset-categories', label: 'Asset Categories', icon: Package, group: 'assets' },
  { id: 'compensation', label: 'Compensation', icon: TrendingUp, group: 'compensation' },
  { id: 'paygrades', label: 'Pay Grades', icon: DollarSign, group: 'compensation' },
  { id: 'financial-years', label: 'Financial Years', icon: Calendar, group: 'compensation' },
  { id: 'leave-management', label: 'Leave Management', icon: CalendarDays, group: 'time' },
  { id: 'time-off-calendar', label: 'Time Off Calendar', icon: Clock, group: 'time' },
  { id: 'attendance', label: 'Attendance', icon: UserCheck, group: 'time' },
  { id: 'payroll', label: 'Payroll', icon: DollarSign, group: 'compensation' },
  { id: 'tax-configuration', label: 'Tax Configuration', icon: FileText, group: 'compensation' },
  { id: 'benefits', label: 'Benefits', icon: Award, group: 'compensation' },
  { id: 'performance-reviews', label: 'Performance Reviews', icon: Target, group: 'performance' },
  { id: 'goals-okrs', label: 'Goals & OKRs', icon: Target, group: 'performance' },
  { id: 'feedback-360', label: '360\u00b0 Feedback', icon: MessageSquare, group: 'performance' },
  { id: 'meetings-1on1', label: '1:1 Meetings', icon: Users, group: 'performance' },
  { id: 'workflows-approvals', label: 'Workflows & Approvals', icon: GitMerge, group: 'operations' },
  { id: 'automation', label: 'Automation & Workflows', icon: Zap, group: 'operations' },
  { id: 'recruitment', label: 'Recruitment', icon: UserPlus, group: 'operations' },
  { id: 'disciplinary', label: 'Disciplinary', icon: AlertCircle, group: 'operations' },
  { id: 'hr-reports', label: 'HR Reports & Analytics', icon: BarChart3, group: 'operations' },
  { id: 'advanced-reports', label: 'Advanced Reports', icon: TrendingUp, group: 'operations' },
  { id: 'usage-analytics', label: 'Company Usage Analytics', icon: Activity, group: 'operations' },
  { id: 'labour-compliance', label: 'Labour Act Compliance', icon: FileCheck, group: 'operations' },
  { id: 'onboarding-training', label: 'Onboarding & Training', icon: BookOpen, group: 'development' },
  { id: 'overtime-expenses', label: 'OT & Expenses', icon: Clock, group: 'time' },
  { id: 'surveys', label: 'Surveys & Feedback', icon: ClipboardList, group: 'engagement' },
  { id: 'engagement-analytics', label: 'Engagement Analytics', icon: TrendingUp, group: 'engagement' },
  { id: 'tasks', label: 'Task Assignments', icon: ClipboardList, group: 'operations' },
  { id: 'announcements', label: 'Announcements', icon: Megaphone, group: 'engagement' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, group: 'engagement' },
  { id: 'employees', label: 'Employees', icon: Users, group: 'people' },
  { id: 'usermanagement', label: 'User Management', icon: ShieldCheck, group: 'people' },
  { id: 'profile-requests', label: 'Profile Requests', icon: UserPlus, group: 'people' },
  { id: 'self-service', label: 'Self-Service Hub', icon: Settings, group: 'people' },
  { id: 'my-profile', label: 'My Profile', icon: User, group: 'people' },
  { id: 'audit-logs', label: 'Audit Logs', icon: Shield, group: 'system' },
  { id: 'backup-restore', label: 'Backup & Restore', icon: Archive, group: 'system' },
  { id: 'billings-subscriptions', label: 'Billings & Subscriptions', icon: CreditCard, group: 'system' },
  { id: 'global-hiring-applications', label: 'Global Hiring Apps', icon: Briefcase, group: 'operations' },
  { id: 'settings', label: 'Settings', icon: Settings, group: 'system' },
];

const GROUPS = [
  { id: 'main', label: '' },
  { id: 'organization', label: 'Organization' },
  { id: 'assets', label: 'Assets' },
  { id: 'time', label: 'Time & Attendance' },
  { id: 'compensation', label: 'Compensation' },
  { id: 'performance', label: 'Performance' },
  { id: 'operations', label: 'Operations' },
  { id: 'development', label: 'Development' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'people', label: 'People' },
  { id: 'system', label: 'System' },
];

type EntityConfig = {
  title: string;
  apiPrefix: string;
  fields: { key: string; label: string; type?: string; options?: string[]; relatedEntity?: string; defaultQuestions?: string[] }[];
};

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  companies: {
    title: 'Companies',
    apiPrefix: '/superadmin/company',
    fields: [
      { key: 'name', label: 'Company Name' },
      { key: 'address', label: 'Address' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'industry', label: 'Industry' },
      { key: 'website', label: 'Website' },
      { key: 'registrationNumber', label: 'Registration No.' },
      { key: 'taxId', label: 'Tax ID' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
  },
  branches: {
    title: 'Branches',
    apiPrefix: '/superadmin/branch',
    fields: [
      { key: 'name', label: 'Branch Name' },
      { key: 'companyId', label: 'Company', type: 'related-select', relatedEntity: 'companies' },
      { key: 'location', label: 'Location' },
      { key: 'manager', label: 'Manager' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
  },
  departments: {
    title: 'Departments',
    apiPrefix: '/superadmin/department',
    fields: [
      { key: 'name', label: 'Department Name' },
      { key: 'companyId', label: 'Company', type: 'related-select', relatedEntity: 'companies' },
      { key: 'description', label: 'Description' },
      { key: 'headOfDepartment', label: 'Head of Department' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
  },
  assets: {
    title: 'Assets',
    apiPrefix: '/superadmin/asset',
    fields: [
      { key: 'name', label: 'Asset Name' },
      { key: 'categoryId', label: 'Category', type: 'related-select', relatedEntity: 'asset-categories' },
      { key: 'serialNumber', label: 'Serial Number' },
      { key: 'assignedToUserId', label: 'Assigned To', type: 'user-select' },
      { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
      { key: 'purchasePrice', label: 'Purchase Price' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['new', 'good', 'fair', 'poor'] },
      { key: 'status', label: 'Status', type: 'select', options: ['available', 'assigned', 'maintenance', 'retired'] },
    ],
  },
  'asset-categories': {
    title: 'Asset Categories',
    apiPrefix: '/superadmin/asset-category',
    fields: [
      { key: 'name', label: 'Category Name' },
      { key: 'description', label: 'Description' },
      { key: 'depreciationRate', label: 'Depreciation Rate (%)' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
  },
  paygrades: {
    title: 'Pay Grades',
    apiPrefix: '/superadmin/paygrade',
    fields: [
      { key: 'name', label: 'Grade Name' },
      { key: 'level', label: 'Level' },
      { key: 'minSalary', label: 'Min Salary' },
      { key: 'maxSalary', label: 'Max Salary' },
      { key: 'currency', label: 'Currency', type: 'select', options: ['GHS', 'USD', 'EUR', 'GBP'] },
      { key: 'benefits', label: 'Benefits Description' },
    ],
  },
  'financial-years': {
    title: 'Financial Years',
    apiPrefix: '/superadmin/financial-year',
    fields: [
      { key: 'name', label: 'Year Name' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'closed', 'upcoming'] },
    ],
  },
  'leave-management': {
    title: 'Leave Types',
    apiPrefix: '/superadmin/leave-type',
    fields: [
      { key: 'name', label: 'Leave Type' },
      { key: 'daysAllowed', label: 'Days Allowed' },
      { key: 'requiresApproval', label: 'Requires Approval', type: 'select', options: ['true', 'false'] },
      { key: 'carryOver', label: 'Carry Over', type: 'select', options: ['true', 'false'] },
      { key: 'description', label: 'Description' },
    ],
  },
  'tax-configuration': {
    title: 'Tax Brackets',
    apiPrefix: '/superadmin/tax-bracket',
    fields: [
      { key: 'name', label: 'Bracket Name' },
      { key: 'minIncome', label: 'Min Income (GHS)' },
      { key: 'maxIncome', label: 'Max Income (GHS)' },
      { key: 'rate', label: 'Tax Rate (%)' },
      { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
  },
  benefits: {
    title: 'Benefit Plans',
    apiPrefix: '/superadmin/benefit-plan',
    fields: [
      { key: 'name', label: 'Plan Name' },
      { key: 'type', label: 'Type', type: 'select', options: ['health', 'dental', 'vision', 'retirement', 'life', 'disability', 'wellness', 'other'] },
      { key: 'provider', label: 'Provider' },
      { key: 'coverage', label: 'Coverage Details' },
      { key: 'employerContribution', label: 'Employer Contribution (%)' },
      { key: 'employeeContribution', label: 'Employee Contribution (%)' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
  },
  'performance-reviews': {
    title: 'Performance Reviews',
    apiPrefix: '/superadmin/performance-review',
    fields: [
      { key: 'employeeId', label: 'Employee Name', type: 'user-select' },
      { key: 'reviewerId', label: 'Reviewer', type: 'user-select' },
      { key: 'period', label: 'Review Period' },
      { key: 'rating', label: 'Rating', type: 'select', options: ['1', '2', '3', '4', '5'] },
      { key: 'strengths', label: 'Strengths' },
      { key: 'improvements', label: 'Areas for Improvement' },
      { key: 'goals', label: 'Next Period Goals' },
      { key: 'goalDeadline', label: 'Goal Target Date', type: 'date-future' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'in-progress', 'completed', 'acknowledged'] },
    ],
  },
  'goals-okrs': {
    title: 'Goals & OKRs',
    apiPrefix: '/superadmin/goal',
    fields: [
      { key: 'title', label: 'Goal Title' },
      { key: 'description', label: 'Description' },
      { key: 'ownerIds', label: 'Owner(s)', type: 'user-multi-select' },
      { key: 'type', label: 'Type', type: 'select', options: ['goal', 'objective', 'key-result'] },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'dueDate', label: 'Due Date', type: 'date-future' },
      { key: 'status', label: 'Status', type: 'select', options: ['not-started', 'in-progress', 'at-risk', 'completed'] },
    ],
  },
  'feedback-360': {
    title: '360\u00b0 Feedback',
    apiPrefix: '/superadmin/feedback',
    fields: [
      { key: 'employeeId', label: 'Employee', type: 'user-select' },
      { key: 'reviewerId', label: 'Reviewer', type: 'user-select' },
      { key: 'type', label: 'Feedback Type', type: 'select', options: ['peer', 'manager', 'self', 'direct-report', 'external'] },
      { key: 'period', label: 'Period' },
      { key: 'communication', label: 'Communication (1-5)' },
      { key: 'teamwork', label: 'Teamwork (1-5)' },
      { key: 'leadership', label: 'Leadership (1-5)' },
      { key: 'technical', label: 'Technical Skills (1-5)' },
      { key: 'comments', label: 'Comments' },
      { key: 'customQuestions', label: 'Custom Questions', type: 'questions', defaultQuestions: [
        'What are this person\'s greatest strengths?',
        'What areas could this person improve?',
        'How effectively does this person collaborate with the team?',
        'Rate this person\'s communication skills and provide examples.',
        'Any additional feedback or suggestions?',
      ] },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'submitted', 'reviewed'] },
    ],
  },
  'meetings-1on1': {
    title: '1:1 Meetings',
    apiPrefix: '/superadmin/meeting',
    fields: [
      { key: 'title', label: 'Meeting Title' },
      { key: 'organizerId', label: 'Organizer', type: 'user-select' },
      { key: 'participantIds', label: 'Participants', type: 'user-multi-select' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'startTime', label: 'Start Time', type: 'time' },
      { key: 'endTime', label: 'End Time', type: 'time' },
      { key: 'duration', label: 'Duration (min)' },
      { key: 'agenda', label: 'Agenda' },
      { key: 'notes', label: 'Meeting Notes' },
      { key: 'actionItems', label: 'Action Items' },
      { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'completed', 'cancelled', 'rescheduled'] },
    ],
  },
  'workflows-approvals': {
    title: 'Workflows & Approvals',
    apiPrefix: '/superadmin/workflow',
    fields: [
      { key: 'name', label: 'Workflow Name' },
      { key: 'type', label: 'Type', type: 'select', options: ['leave', 'expense', 'purchase', 'hiring', 'promotion', 'termination', 'custom'] },
      { key: 'description', label: 'Description' },
      { key: 'approver1Id', label: 'First Approver', type: 'user-select' },
      { key: 'approver2Id', label: 'Second Approver', type: 'user-select' },
      { key: 'escalationDays', label: 'Escalation Days' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'draft'] },
    ],
  },
  recruitment: {
    title: 'Job Postings',
    apiPrefix: '/superadmin/job-posting',
    fields: [
      // roleTitle is used on the public hiring page; title is the internal reference
      { key: 'roleTitle', label: 'Role Title (shown publicly)' },
      { key: 'department', label: 'Department' },
      { key: 'location', label: 'Location' },
      { key: 'employmentType', label: 'Employment Type', type: 'select', options: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Remote', 'Hybrid'] },
      { key: 'description', label: 'Job Description' },
      { key: 'requirements', label: 'Requirements' },
      { key: 'qualifications', label: 'Qualifications' },
      { key: 'salaryRange', label: 'Salary Range' },
      { key: 'deadline', label: 'Application Deadline', type: 'date' },
      { key: 'visibilityType', label: 'Visibility', type: 'select', options: ['internal_only', 'public_global'] },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'open', 'interviewing', 'offered', 'filled', 'closed'] },
    ],
  },
  disciplinary: {
    title: 'Disciplinary Cases',
    apiPrefix: '/superadmin/disciplinary-case',
    fields: [
      { key: 'employeeId', label: 'Employee', type: 'user-select' },
      { key: 'type', label: 'Offense Type', type: 'select', options: ['misconduct', 'poor-performance', 'attendance', 'policy-violation', 'harassment', 'insubordination', 'other'] },
      { key: 'description', label: 'Description' },
      { key: 'incidentDate', label: 'Incident Date', type: 'date' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['minor', 'moderate', 'major', 'critical'] },
      { key: 'action', label: 'Disciplinary Action', type: 'select', options: ['verbal-warning', 'written-warning', 'suspension', 'probation', 'termination', 'none'] },
      { key: 'investigatorId', label: 'Investigator', type: 'user-select' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'resolved', 'appealed', 'closed'] },
    ],
  },
  'labour-compliance': {
    title: 'Compliance Items',
    apiPrefix: '/superadmin/compliance-item',
    fields: [
      { key: 'title', label: 'Title' },
      { key: 'regulation', label: 'Regulation/Act' },
      { key: 'category', label: 'Category', type: 'select', options: ['employment', 'safety', 'wages', 'discrimination', 'benefits', 'record-keeping', 'other'] },
      { key: 'description', label: 'Description' },
      { key: 'dueDate', label: 'Compliance Due Date', type: 'date' },
      { key: 'responsibleId', label: 'Responsible Person', type: 'user-select' },
      { key: 'status', label: 'Status', type: 'select', options: ['compliant', 'non-compliant', 'in-progress', 'pending-review', 'overdue'] },
    ],
  },
  tasks: {
    title: 'Task Assignments',
    apiPrefix: '/superadmin/task',
    fields: [
      { key: 'title', label: 'Task Title' },
      { key: 'description', label: 'Description' },
      { key: 'assignedTo', label: 'Assigned To', type: 'user-select' },
      { key: 'assignedBy', label: 'Assigned By', type: 'user-select' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
      { key: 'dueDate', label: 'Due Date', type: 'date-future' },
      { key: 'progress', label: 'Progress (%)' },
      { key: 'category', label: 'Category', type: 'select', options: ['project', 'maintenance', 'review', 'documentation', 'training', 'other'] },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'in-progress', 'completed', 'overdue', 'cancelled'] },
    ],
  },
  'onboarding-training': {
    title: 'Training Programs',
    apiPrefix: '/superadmin/training-program',
    fields: [
      { key: 'name', label: 'Program Name' },
      { key: 'type', label: 'Type', type: 'select', options: ['onboarding', 'technical', 'soft-skills', 'compliance', 'leadership', 'safety', 'custom'] },
      { key: 'description', label: 'Description' },
      { key: 'instructorId', label: 'Instructor', type: 'user-select' },
      { key: 'duration', label: 'Duration (hours)' },
      { key: 'participantIds', label: 'Participants', type: 'user-multi-select' },
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'endDate', label: 'End Date', type: 'date' },
      { key: 'assessmentQuestions', label: 'Assessment Questions', type: 'questions', defaultQuestions: [
        'What did you learn from this training program?',
        'How will you apply these skills in your daily work?',
        'Rate the effectiveness of the training materials (1-5).',
        'What improvements would you suggest for this program?',
        'Would you recommend this training to colleagues? Why?',
      ] },
      { key: 'status', label: 'Status', type: 'select', options: ['planned', 'active', 'completed', 'cancelled'] },
    ],
  },
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function copyToClipboard(text: string) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); toast.success('Copied to clipboard'); } catch { toast.error('Failed to copy'); } finally { document.body.removeChild(ta); }
}

export function SuperAdminDashboard() {
  const { user, accessToken, logout } = useAuth();
  const { branding } = useBranding();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('All Companies');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardView onNavigate={setActiveSection} />;
      case 'messages': return <div className="p-8"><MessagesPanel /></div>;
      case 'announcements': return <AnnouncementsView />;
      case 'employees': return <EmployeesView />;
      case 'usermanagement': return <UserManagementView />;
      case 'my-profile': return <SharedMyProfile />;
      case 'time-off-calendar': return <TimeOffCalendarView />;
      case 'attendance': return <AttendanceView />;
      case 'leave-management': return <LeaveManagementView />;
      case 'payroll': return <PayrollView />;
      case 'compensation': return <div className="p-8"><CompensationModule /></div>;
      case 'paygrades': return <div className="p-8"><PayGradesModule /></div>;
      case 'financial-years': return <div className="p-8"><FinancialYearsModule /></div>;
      case 'tax-configuration': return <div className="p-8"><TaxConfigurationModule /></div>;
      case 'benefits': return <div className="p-8"><BenefitsModule /></div>;
      case 'hr-reports': return <div className="p-8"><ReportsPanel /></div>;
      case 'advanced-reports': return <div className="p-8"><AdvancedReportsModule /></div>;
      case 'audit-logs': return <div className="p-8"><AuditLogsModule /></div>;
      case 'onboarding-training': return <OnboardingView />;
      case 'overtime-expenses': return <div className="p-8"><OvertimeExpenseApproval /></div>;
      case 'surveys': return <div className="p-8"><SurveyBuilder /></div>;
      case 'engagement-analytics': return <div className="p-8"><EmployeeEngagementAnalytics /></div>;
      case 'usage-analytics': return <CompanyUsageAnalytics accessToken={accessToken} />;
      case 'meetings-1on1': return <div className="p-8"><MeetingsPanel mode="admin" /></div>;
      case 'self-service': return <SharedSelfServiceHub onNavigate={setActiveSection} />;
      case 'backup-restore': return <BackupRestore />;
      case 'recruitment': return <RecruitmentView />;
      case 'automation': return <div className="p-8"><AutomationModule companyId={user?.companyId || ''} /></div>;
      case 'profile-requests': return <ProfileChangeRequests />;
      case 'settings': return (
        <div className="p-8 space-y-8">
          <LicenseManagement />
          
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">🎨 Company Branding</h2>
            <CompanyBrandingSettings />
          </div>
          
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">💱 Global Currency Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Select Default Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <GlobalCurrencySettings />
              </CardContent>
            </Card>
          </div>
          
          <div className="border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">⏰ Working Hours Configuration</h2>
            <WorkingHoursConfig />
          </div>
        </div>
      );
      case 'global-hiring-applications': return <GlobalHiringApplicationsPanel accessToken={accessToken} />;
      default:
        if (ENTITY_CONFIGS[activeSection]) {
          return <EntityCrud entityKey={activeSection} config={ENTITY_CONFIGS[activeSection]} />;
        }
        return <PlaceholderView title={SIDEBAR_ITEMS.find(i => i.id === activeSection)?.label || 'Coming Soon'} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`${collapsed ? 'w-[72px]' : 'w-60'} bg-card border-r border-border flex flex-col fixed h-screen z-30 transition-all duration-200 overflow-hidden`}>
        <div className={`p-3 flex items-center ${collapsed ? 'justify-center' : 'justify-between'} flex-shrink-0`}>
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 transition-transform overflow-hidden" style={brandGradientStyle(branding.primaryColor)} title="Expand sidebar">
              {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="w-full h-full object-contain p-1" /> : <span className="text-white text-lg font-bold">{branding.companyName?.[0] || 'B'}</span>}
            </button>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={brandGradientStyle(branding.primaryColor)}>
                  {branding.logoUrl ? <img src={branding.logoUrl} alt="" className="w-full h-full object-contain p-0.5" /> : <span className="text-white text-lg font-bold">{branding.companyName?.[0] || 'B'}</span>}
                </div>
                <div><p className="text-sm font-semibold text-foreground">{branding.companyName}</p><p className="text-[10px] text-muted-foreground uppercase">Super Admin</p></div>
              </div>
              <button onClick={() => setCollapsed(true)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600"><PanelLeftClose className="w-4 h-4" /></button>
            </>
          )}
        </div>
        <Separator className="flex-shrink-0" />
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2" style={{ scrollbarWidth: 'thin' }}>
          <nav className="px-2 space-y-0.5">
            {GROUPS.map(g => {
              const items = SIDEBAR_ITEMS.filter(i => i.group === g.id);
              return (
                <div key={g.id} className={g.label ? 'pt-3 pb-1' : ''}>
                  {g.label && !collapsed && <p className="px-3 pb-1 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">{g.label}</p>}
                  {g.label && collapsed && <Separator className="my-1.5 mx-1 opacity-40" />}
                  {items.map(item => {
                    const Icon = item.icon;
                    const active = activeSection === item.id;
                    return (
                      <button key={item.id} onClick={() => { setActiveSection(item.id); scrollToTop(); }}
                        title={collapsed ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 rounded-lg transition-colors ${collapsed ? 'justify-center p-2.5' : 'px-3 py-2'} ${active ? '' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                        style={active ? { backgroundColor: branding.primaryColor + '15', color: branding.primaryColor } : undefined}>
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" style={active ? { color: branding.primaryColor } : undefined} />
                        <span className={`text-[13px] ${active ? 'font-medium' : ''} ${collapsed ? 'hidden' : 'block truncate'}`}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>
        <div className="border-t p-2 flex-shrink-0">
          {collapsed ? (
            <button onClick={() => setCollapsed(false)} className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" title="Expand sidebar">
              <PanelLeftOpen className="w-5 h-5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 p-1">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold flex-shrink-0">{user?.name?.[0] || 'S'}</div>
              )}
              <div className="flex-1 min-w-0"><p className="text-xs font-medium text-foreground truncate">{user?.name}</p><p className="text-[10px] text-muted-foreground truncate">{user?.email}</p></div>
              <button onClick={logout} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 transition-colors" title="Log Out"><LogOut className="w-4 h-4" /></button>
            </div>
          )}
          {collapsed && (
            <button onClick={logout} className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Log Out"><LogOut className="w-5 h-5" /></button>
          )}
        </div>
      </aside>

      <div className={`flex-1 ${collapsed ? 'ml-[72px]' : 'ml-60'} transition-all duration-200 min-w-0`}>
        <div className="sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border px-6 py-2.5 flex items-center justify-between gap-3">
          <CompanySwitcher 
            accessToken={accessToken}
            currentCompanyId={selectedCompanyId}
            onCompanySwitch={(companyId, companyName) => {
              setSelectedCompanyId(companyId);
              setSelectedCompanyName(companyName);
            }}
          />
          <div className="flex items-center gap-3">
            <SubscriptionBadge />
            <NotificationsBell />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Super Admin</Badge>
          </div>
        </div>
        <div className="h-[calc(100vh-45px)] overflow-y-auto overflow-x-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

function RecruitmentView() {
  const { accessToken } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'postings' | 'applications'>('postings');
  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-4">
        <UserPlus className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Recruitment</h1>
          <p className="text-sm text-gray-500">Manage job postings and review applications</p>
        </div>
      </div>
      <div className="flex gap-1 mb-6 border-b">
        <button onClick={() => setActiveSubTab('postings')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'postings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Job Postings</button>
        <button onClick={() => setActiveSubTab('applications')} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeSubTab === 'applications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>Applications & Hiring</button>
      </div>
      {activeSubTab === 'postings' && <EntityCrud entityKey="recruitment" config={ENTITY_CONFIGS.recruitment} />}
      {activeSubTab === 'applications' && <HiringApprovalPanel />}
    </div>
  );
}

function PlaceholderView({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <Card className="mt-6"><CardContent className="py-16 text-center"><FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-500">This module is under development</p></CardContent></Card>
    </div>
  );
}

// ========== GLOBAL HIRING APPLICATIONS PANEL (SuperAdmin) ==========
function GlobalHiringApplicationsPanel({ accessToken }: { accessToken: string | null }) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/care/global-applications', { token: accessToken });
      setApplications(Array.isArray(data) ? data : []);
    } catch {
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api(`/superadmin/public-job-application/${id}`, { method: 'PUT', body: { status }, token: accessToken });
      toast.success('Status updated');
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    return !q || (a.fullName || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q) || (a.roleTitle || '').toLowerCase().includes(q) || (a.companyName || '').toLowerCase().includes(q);
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Global Hiring Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Applications submitted via the public Blumebyte hiring portal</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input className="pl-9 w-72" placeholder="Search applicants, roles…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-gray-300" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-gray-400">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.fullName}</TableCell>
                      <TableCell className="text-sm text-gray-500">{a.companyName}</TableCell>
                      <TableCell className="text-sm">{a.roleTitle}</TableCell>
                      <TableCell className="text-sm">{a.email}</TableCell>
                      <TableCell className="text-sm">{a.phone}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'reviewed' ? 'default' : a.status === 'archived' ? 'secondary' : 'outline'}>
                          {a.status || 'pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setSelected(a); setDetailOpen(true); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'reviewed')} title="Mark Reviewed">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'archived')} title="Archive">
                            <Archive className="h-3.5 w-3.5 text-gray-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs text-gray-400">Applicant</Label><p className="font-medium">{selected.fullName}</p></div>
                <div><Label className="text-xs text-gray-400">Email</Label><p>{selected.email}</p></div>
                <div><Label className="text-xs text-gray-400">Phone</Label><p>{selected.phone}</p></div>
                <div><Label className="text-xs text-gray-400">Submitted</Label><p>{selected.submittedAt ? new Date(selected.submittedAt).toLocaleString() : '—'}</p></div>
                <div><Label className="text-xs text-gray-400">Company</Label><p>{selected.companyName}</p></div>
                <div><Label className="text-xs text-gray-400">Role</Label><p>{selected.roleTitle}</p></div>
              </div>
              <div><Label className="text-xs text-gray-400">Qualifications</Label><p className="mt-1">{selected.qualification}</p></div>
              <div><Label className="text-xs text-gray-400">CV / Cover Letter</Label><p className="mt-1 whitespace-pre-wrap bg-gray-50 rounded p-3">{selected.cvMessage}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== DASHBOARD ==========
function DashboardView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allLeaves, setAllLeaves] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [scopeFixed, setScopeFixed] = useState(false);

  // Auto-fix missing assignedCompanies on component mount
  useEffect(() => {
    const fixCompanyScope = async () => {
      try {
        console.log('🔧 Attempting to fix company scope...');
        const result = await api('/superadmin/fix-company-scope', { 
          method: 'POST', 
          token: accessToken 
        });
        console.log('✅ Company scope check result:', result);
        setScopeFixed(true);
      } catch (e) {
        console.error('Company scope fix failed:', e);
        setScopeFixed(true); // Continue anyway
      }
    };
    
    if (!scopeFixed) {
      fixCompanyScope();
    }
  }, [accessToken, scopeFixed]);

  const loadDashboardData = useCallback(() => {
    const safeFetch = (path: string) => api(path, { token: accessToken }).catch(e => { console.log(`Dashboard fetch ${path} failed:`, e); return null; });
    Promise.all([
      safeFetch('/users'),
      safeFetch('/reference-data'),
      safeFetch('/leave-requests'),
      safeFetch('/announcements'),
      safeFetch('/attendance/all'),
      safeFetch('/automation/workflows'),
      safeFetch('/automation/scheduled-tasks'),
      safeFetch('/automation/business-rules'),
      safeFetch('/automation/notification-templates'),
    ]).then(([users, ref, leaves, announcements, attendance, workflows, tasks, rules, templates]) => {
      const usersArr = Array.isArray(users) ? users : [];
      const leavesArr = Array.isArray(leaves) ? leaves : [];
      const attendanceArr = Array.isArray(attendance) ? attendance : [];
      const workflowsData = workflows?.data || [];
      const tasksData = tasks?.data || [];
      const rulesData = rules?.data || [];
      const templatesData = templates?.data || [];
      
      setAllUsers(usersArr);
      setAllLeaves(leavesArr);
      setAllAttendance(attendanceArr);
      setStats({
        users: usersArr.length,
        companies: ref?.companies?.length || 0,
        departments: ref?.departments?.length || 0,
        branches: ref?.branches?.length || 0,
        assets: ref?.assets?.length || 0,
        pendingLeaves: leavesArr.filter((l: any) => l.status === 'pending').length,
        announcements: Array.isArray(announcements) ? announcements.length : 0,
        activeEmployees: usersArr.filter((u: any) => u.status === 'active').length,
        workflows: Array.isArray(workflowsData) ? workflowsData.filter((w: any) => w.status === 'active').length : 0,
        scheduledTasks: Array.isArray(tasksData) ? tasksData.filter((t: any) => t.status === 'active').length : 0,
        businessRules: Array.isArray(rulesData) ? rulesData.filter((r: any) => r.status === 'active').length : 0,
        notificationTemplates: Array.isArray(templatesData) ? templatesData.length : 0,
        roleDistribution: {
          superadmin: usersArr.filter((u: any) => u.role === 'superadmin').length,
          admin: usersArr.filter((u: any) => u.role === 'admin').length,
          manager: usersArr.filter((u: any) => u.role === 'manager').length,
          employee: usersArr.filter((u: any) => u.role === 'employee').length,
        },
      });
      setRecentLeaves(leavesArr.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5));
    }).catch(console.log).finally(() => setLoading(false));
  }, [accessToken]);

  useEffect(() => {
    if (!scopeFixed) return; // Wait for scope fix before loading data
    loadDashboardData();
  }, [scopeFixed, loadDashboardData]);

  // Auto-refresh dashboard every 30 seconds for real-time updates
  useEffect(() => {
    if (!scopeFixed) return;
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [scopeFixed, loadDashboardData]);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: Users, color: 'blue', bg: 'bg-blue-100', text: 'text-blue-600' },
    { label: 'Companies', value: stats.companies, icon: Building2, color: 'green', bg: 'bg-green-100', text: 'text-green-600' },
    { label: 'Departments', value: stats.departments, icon: FolderTree, color: 'purple', bg: 'bg-purple-100', text: 'text-purple-600' },
    { label: 'Branches', value: stats.branches, icon: GitBranch, color: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { label: 'Assets', value: stats.assets, icon: Briefcase, color: 'orange', bg: 'bg-orange-100', text: 'text-orange-600' },
    { label: 'Pending Leaves', value: stats.pendingLeaves, icon: CalendarDays, color: 'amber', bg: 'bg-amber-100', text: 'text-amber-600' },
    { label: 'Active Workflows', value: stats.workflows, icon: Zap, color: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-600', action: 'automation' },
    { label: 'Business Rules', value: stats.businessRules, icon: Settings, color: 'violet', bg: 'bg-violet-100', text: 'text-violet-600', action: 'automation' },
  ];

  const quickActions = [
    { label: 'Create User', icon: UserPlus, action: 'usermanagement', color: 'bg-blue-500' },
    { label: 'Add Company', icon: Building2, action: 'companies', color: 'bg-green-500' },
    { label: 'View Reports', icon: BarChart3, action: 'hr-reports', color: 'bg-purple-500' },
    { label: 'Manage Leave', icon: CalendarDays, action: 'leave-management', color: 'bg-amber-500' },
    { label: 'Automation', icon: Zap, action: 'automation', color: 'bg-cyan-500' },
    { label: 'Announcements', icon: Megaphone, action: 'announcements', color: 'bg-teal-500' },
  ];

  const roleData = stats.roleDistribution ? [
    { id: 'role-superadmin', name: 'Super Admin', value: stats.roleDistribution.superadmin, color: '#ef4444' },
    { id: 'role-admin', name: 'Admin', value: stats.roleDistribution.admin, color: '#f59e0b' },
    { id: 'role-manager', name: 'Manager', value: stats.roleDistribution.manager, color: '#3b82f6' },
    { id: 'role-employee', name: 'Employee', value: stats.roleDistribution.employee, color: '#10b981' },
  ].filter(d => d.value > 0) : [];

  // Build real monthly data from user createdAt + leave requests
  const monthlyData = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const dataMap = new Map();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const uniqueKey = `${y}-${String(m).padStart(2, '0')}`;
      
      const hires = allUsers.filter(u => {
        if (!u.createdAt) return false;
        const cd = new Date(u.createdAt);
        return cd.getMonth() === m && cd.getFullYear() === y;
      }).length;
      const leaveReqs = allLeaves.filter(l => {
        if (!l.createdAt) return false;
        const cd = new Date(l.createdAt);
        return cd.getMonth() === m && cd.getFullYear() === y;
      }).length;
      // Always include year in short form for uniqueness
      const monthLabel = `${months[m]} '${String(y).slice(2)}`;
      dataMap.set(uniqueKey, { id: uniqueKey, month: monthLabel, hires, leaves: leaveReqs });
    }
    return Array.from(dataMap.values());
  })();

  const hasChartData = monthlyData.some(d => d.hires > 0 || d.leaves > 0);

  // Build attendance rate data for chart
  const attendanceData = (() => {
    if (allAttendance.length === 0) return [];
    const days: Record<string, { present: number; total: number }> = {};
    const totalEmployees = Math.max(allUsers.length, 1);
    allAttendance.forEach(r => {
      if (!r.date) return;
      if (!days[r.date]) days[r.date] = { present: 0, total: totalEmployees };
      if (r.status === 'present' || r.clockIn) days[r.date].present++;
    });
    return Object.entries(days)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, d]) => {
        // Use the raw date string as the unique key to avoid locale formatting duplicates
        return {
          id: date,
          date: date,
          rate: Math.round((d.present / d.total) * 100),
          present: d.present,
          total: d.total,
        };
      });
  })();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's your organization overview.</p>
      </div>

      {/* License Status Banner */}
      <LicenseStatusBanner />

      <div className="mb-6">
        <ClockInOut />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          const CardWrapper = card.action 
            ? ({ children }: any) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onNavigate(card.action!)}>
                  {children}
                </Card>
              )
            : ({ children }: any) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  {children}
                </Card>
              );
          return (
            <CardWrapper key={idx}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{card.label}</p>
                    <p className={`text-2xl font-bold ${card.text} mt-1`}>{loading ? '\u2014' : card.value}</p>
                  </div>
                  <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${card.text}`} />
                  </div>
                </div>
              </CardContent>
            </CardWrapper>
          );
        })}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {quickActions.map((link, idx) => {
            const Icon = link.icon;
            return (
              <Card key={idx} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => onNavigate(link.action)}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-9 h-9 ${link.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-sm font-medium">{link.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Hiring & Leave Trends</CardTitle></CardHeader>
          <CardContent>
            {hasChartData ? (
              <ClientOnlyChart fallback={<div className="h-[240px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={monthlyData} id="dashboard-hiring-bar">
                    <CartesianGrid key="grid" strokeDasharray="3 3" />
                    <XAxis key="xaxis" dataKey="id" tickFormatter={(val) => { const d = monthlyData.find(m => m.id === val); return d?.month || val; }} />
                    <YAxis key="yaxis" />
                    <Tooltip key="tooltip" labelFormatter={(val) => { const d = monthlyData.find(m => m.id === val); return d?.month || val; }} />
                    <Legend key="legend" />
                    <Bar key="bar-hires" dataKey="hires" fill="#3b82f6" name="New Users" radius={[4,4,0,0]} />
                    <Bar key="bar-leaves" dataKey="leaves" fill="#ef4444" name="Leave Requests" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gray-400 text-sm">No hiring or leave data yet. Create users and leave requests to see trends.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Role Distribution</CardTitle></CardHeader>
          <CardContent>
            {roleData.length > 0 ? (
              <ClientOnlyChart fallback={<div className="h-[240px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart id="dashboard-role-pie">
                    <Pie key="pie" data={roleData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {roleData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                    </Pie>
                    <Tooltip key="tooltip" />
                  </PieChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-gray-400">No user data</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Rate</CardTitle></CardHeader>
          <CardContent>
            {attendanceData.length > 0 ? (
              <ClientOnlyChart fallback={<div className="h-[200px] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={attendanceData} id="dashboard-attendance-area">
                    <CartesianGrid key="grid" strokeDasharray="3 3" />
                    <XAxis key="xaxis" dataKey="id" tick={{ fontSize: 11 }} />
                    <YAxis key="yaxis" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip key="tooltip"
                      formatter={(value: any, name: string) => [name === 'rate' ? `${value}%` : value, name === 'rate' ? 'Attendance Rate' : name === 'present' ? 'Present' : 'Total']} 
                    />
                    <Area key="area-rate" type="monotone" dataKey="rate" stroke="#10b981" fill="#d1fae5" strokeWidth={2} name="rate" />
                  </AreaChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-400 text-sm">No attendance data yet. Use the Clock In button to start tracking.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Leave Requests</CardTitle></CardHeader>
          <CardContent>
            {recentLeaves.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No recent leave requests</div>
            ) : (
              <div className="space-y-2">
                {recentLeaves.map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{l.employeeName || 'Employee'}</p>
                      <p className="text-xs text-gray-500">{l.leaveType || l.type || 'Leave'} \u2022 {l.startDate || '\u2014'}</p>
                    </div>
                    <Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{l.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ========== MY PROFILE ==========
function MyProfileView() {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    api('/profile', { token: accessToken }).then(data => { setProfile(data); setFormData(data); }).catch(console.log).finally(() => setLoading(false));
  }, [accessToken]);

  const handleSave = async () => {
    try {
      await api('/employee/profile', { method: 'PUT', body: formData, token: accessToken });
      toast.success('Profile updated');
      setEditing(false);
      setProfile(formData);
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button onClick={() => editing ? handleSave() : setEditing(true)}>{editing ? 'Save Changes' : 'Edit Profile'}</Button>
      </div>
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : (
        <div className="max-w-3xl space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{profile?.name?.[0] || 'U'}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{profile?.name}</h3>
                  <p className="text-sm text-gray-500">{profile?.email}</p>
                  <Badge className="mt-1">{profile?.role}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'phone', label: 'Phone', editable: true },
                  { key: 'position', label: 'Position', editable: true },
                  { key: 'department', label: 'Department', editable: false },
                  { key: 'company', label: 'Company', editable: false },
                  { key: 'address', label: 'Address', editable: true },
                  { key: 'city', label: 'City', editable: true },
                  { key: 'dateOfBirth', label: 'Date of Birth', editable: true },
                  { key: 'nationality', label: 'Nationality', editable: true },
                  { key: 'emergencyContact', label: 'Emergency Contact', editable: true },
                  { key: 'emergencyPhone', label: 'Emergency Phone', editable: true },
                ].map(f => (
                  <div key={f.key}>
                    <Label>{f.label}</Label>
                    <Input value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} disabled={!editing || !f.editable} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ========== TIME OFF CALENDAR ==========
function TimeOffCalendarView() {
  const { accessToken } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    Promise.all([
      api('/leave-requests', { token: accessToken }),
      api('/users', { token: accessToken }),
      api('/superadmin/meeting', { token: accessToken }).catch(() => []),
    ]).then(([leavesData, usersData, meetingsData]) => {
      const leavesArr = Array.isArray(leavesData) ? leavesData : [];
      const usersArr = Array.isArray(usersData) ? usersData : [];
      const meetingsArr = Array.isArray(meetingsData) ? meetingsData : [];
      
      // Enrich leaves with employee names
      const enrichedLeaves = leavesArr.map(leave => {
        const user = usersArr.find(u => (u.userId || u.id) === leave.userId);
        return {
          ...leave,
          employeeName: user?.name || leave.employeeName || 'Unknown',
        };
      });
      
      // Enrich meetings with user names
      const enrichedMeetings = meetingsArr
        .filter(m => m.status === 'scheduled') // Only show scheduled meetings
        .map(meeting => {
          const organizer = usersArr.find(u => (u.userId || u.id) === meeting.organizerId);
          const participant = usersArr.find(u => (u.userId || u.id) === meeting.participantId);
          return {
            ...meeting,
            organizerName: organizer?.name || 'Unknown',
            participantName: participant?.name || 'Unknown',
          };
        });
      
      setLeaves(enrichedLeaves);
      setMeetings(enrichedMeetings);
      setUsers(usersArr);
    }).catch(console.log).finally(() => setLoading(false));
  }, [accessToken]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getLeaveForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return leaves.filter(l => {
      if (l.startDate && l.endDate) return dateStr >= l.startDate && dateStr <= l.endDate;
      if (l.startDate) return dateStr === l.startDate;
      return false;
    });
  };

  const getMeetingsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return meetings.filter(m => m.date === dateStr);
  };

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const statusColors: Record<string, string> = { approved: 'bg-green-200', pending: 'bg-amber-200', rejected: 'bg-red-200' };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Time Off & Events Calendar</h1>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{leaves.length} leave requests</Badge>
          <Badge variant="outline" className="bg-blue-50">{meetings.length} meetings</Badge>
          <Badge className="bg-amber-100 text-amber-800">{leaves.filter(l => l.status === 'pending').length} pending leaves</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
            <h2 className="text-lg font-semibold">{monthName}</h2>
            <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="bg-gray-50 p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayLeaves = getLeaveForDate(day);
                const dayMeetings = getMeetingsForDate(day);
                const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
                const allEvents = [
                  ...dayLeaves.map(l => ({ type: 'leave', ...l })),
                  ...dayMeetings.map(m => ({ type: 'meeting', ...m })),
                ];
                return (
                  <div key={day} className={`bg-card p-2 min-h-[80px] ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}>
                    <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-foreground'}`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {allEvents.slice(0, 3).map((event, idx) => (
                        event.type === 'leave' ? (
                          <div key={`leave-${idx}`} className={`text-[10px] px-1 py-0.5 rounded truncate ${statusColors[event.status] || 'bg-gray-200'}`} title={`${event.employeeName} - ${event.leaveType}`}>
                            {event.employeeName?.split(' ')[0] || 'Leave'}
                          </div>
                        ) : (
                          <div key={`meeting-${idx}`} className="text-[10px] px-1 py-0.5 rounded truncate bg-blue-200" title={`Meeting: ${event.title || ''} - ${event.organizerName} & ${event.participantName}`}>
                            📅 {event.startTime || 'Meeting'}
                          </div>
                        )
                      ))}
                      {allEvents.length > 3 && <div className="text-[10px] text-gray-400">+{allEvents.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 mt-4">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-200" /><span className="text-xs text-gray-500">Approved Leave</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-200" /><span className="text-xs text-gray-500">Pending Leave</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-200" /><span className="text-xs text-gray-500">Rejected Leave</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-200" /><span className="text-xs text-gray-500">Scheduled Meeting</span></div>
      </div>
    </div>
  );
}

// ========== ATTENDANCE (Full CRUD) ==========
function AttendanceView() {
  const { accessToken } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editRecord, setEditRecord] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [autoSettings, setAutoSettings] = useState<any>({ enabled: false, clockInTime: '08:00', clockOutTime: '17:00', mode: 'all', specificUsers: [], inactivityTimeout: 30 });
  const [savingAuto, setSavingAuto] = useState(false);
  const [showAutoSettings, setShowAutoSettings] = useState(false);
  const [manualSettings, setManualSettings] = useState<any>({ enabled: true, mode: 'all', specificUsers: [] });
  const [savingManual, setSavingManual] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [att, users, autoS, manualS] = await Promise.all([
        api('/attendance/all', { token: accessToken }),
        api('/users', { token: accessToken }),
        api('/auto-clock-settings', { token: accessToken }).catch(() => null),
        api('/manual-clock-settings', { token: accessToken }).catch(() => null),
      ]);
      setRecords(Array.isArray(att) ? att.sort((a: any, b: any) => (b.date || '').localeCompare(a.date || '')) : []);
      setAllUsers(Array.isArray(users) ? users : []);
      if (autoS) setAutoSettings(autoS);
      if (manualS) setManualSettings(manualS);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  
  // Real-time subscription for instant attendance updates
  useEffect(() => {
    const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
    const channel = supabase.channel('attendance-changes');
    
    channel.on('broadcast', { event: 'data-changed' }, () => {
      console.log('📅 Attendance: Real-time update received, reloading data...');
      load();
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const handleSaveAutoSettings = async () => {
    setSavingAuto(true);
    try {
      const res = await api('/auto-clock-settings', { method: 'PUT', body: autoSettings, token: accessToken });
      setAutoSettings(res);
      toast.success('Auto-clock settings saved');
    } catch (e: any) { toast.error(e.message); }
    setSavingAuto(false);
  };

  const toggleUserForAutoClock = (userId: string) => {
    const current = autoSettings.specificUsers || [];
    if (current.includes(userId)) {
      setAutoSettings({ ...autoSettings, specificUsers: current.filter((id: string) => id !== userId) });
    } else {
      setAutoSettings({ ...autoSettings, specificUsers: [...current, userId] });
    }
  };

  const handleSaveManualSettings = async () => {
    setSavingManual(true);
    try {
      const res = await api('/manual-clock-settings', { method: 'PUT', body: manualSettings, token: accessToken });
      setManualSettings(res);
      toast.success('Manual clock visibility settings saved');
    } catch (e: any) { toast.error(e.message); }
    setSavingManual(false);
  };

  const toggleUserForManualClock = (userId: string) => {
    const current = manualSettings.specificUsers || [];
    if (current.includes(userId)) {
      setManualSettings({ ...manualSettings, specificUsers: current.filter((id: string) => id !== userId) });
    } else {
      setManualSettings({ ...manualSettings, specificUsers: [...current, userId] });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editRecord) {
        await api('/attendance/admin-update', { method: 'PUT', body: formData, token: accessToken });
        toast.success('Attendance updated');
      } else {
        if (!formData.userId || !formData.date) { toast.error('Employee and date required'); setSaving(false); return; }
        await api('/attendance/admin-create', { method: 'POST', body: formData, token: accessToken });
        toast.success('Attendance created');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (record: any) => {
    if (!confirm('Delete this attendance record?')) return;
    try {
      await api('/attendance/admin-delete', { method: 'DELETE', body: { userId: record.userId, date: record.date }, token: accessToken });
      toast.success('Deleted');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = records.filter(r => !search || r.employeeName?.toLowerCase().includes(search.toLowerCase()));
  const present = records.filter(r => r.status === 'present' && !r.isPaused).length;
  const late = records.filter(r => r.status === 'late').length;
  const overtime = records.filter(r => r.status === 'overtime').length;
  const paused = records.filter(r => r.isPaused).length;
  const autoTracked = records.filter(r => r.autoClocked).length;

  const pieData = [
    { id: 'attendance-present', name: 'Present', value: present || 1, color: '#10b981' },
    { id: 'attendance-late', name: 'Late', value: late, color: '#f59e0b' },
    { id: 'attendance-overtime', name: 'Overtime', value: overtime, color: '#3b82f6' },
    { id: 'attendance-paused', name: 'Paused', value: paused, color: '#f97316' },
  ].filter(d => d.value > 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button variant={showAutoSettings ? 'default' : 'outline'} size="sm" onClick={() => setShowAutoSettings(!showAutoSettings)} className={showAutoSettings ? 'bg-purple-600 hover:bg-purple-700' : ''}>
            <Settings className="w-4 h-4 mr-1" />Clock Settings
            {autoSettings?.enabled && <Badge className="ml-1 bg-purple-100 text-purple-700 text-[9px]">AUTO</Badge>}
            {manualSettings?.enabled === false && <Badge className="ml-1 bg-red-100 text-red-700 text-[9px]">MANUAL OFF</Badge>}
          </Button>
          <Button onClick={() => { setEditRecord(null); setFormData({ status: 'present', date: new Date().toISOString().split('T')[0] }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Record</Button>
        </div>
      </div>

      {/* Auto-Clock Settings Panel */}
      {showAutoSettings && (<>
        <Card className="mb-4 border-green-200 bg-green-50/30">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Manual Clock-In / Clock-Out Visibility</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Show Manual Clock</span>
                <button
                  onClick={() => setManualSettings({ ...manualSettings, enabled: !manualSettings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${manualSettings.enabled ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${manualSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {manualSettings.enabled ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-green-700">Show To</Label>
                    <NativeSelect value={manualSettings.mode || 'all'} onChange={e => setManualSettings({ ...manualSettings, mode: e.target.value })} className="border-green-200">
                      <option value="all">All Users</option>
                      <option value="specific">Specific Users</option>
                    </NativeSelect>
                  </div>
                </div>

                {manualSettings.mode === 'specific' && (
                  <div>
                    <Label className="text-xs text-green-700 mb-2 block">Select Users Who Can See Manual Clock</Label>
                    <div className="max-h-40 overflow-y-auto border border-green-200 rounded-lg p-2 bg-white space-y-1">
                      {allUsers.map(u => {
                        const uid = u.userId || u.id;
                        const isSelected = (manualSettings.specificUsers || []).includes(uid);
                        return (
                          <label key={uid} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-green-50 ${isSelected ? 'bg-green-100' : ''}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleUserForManualClock(uid)} className="rounded border-green-300 text-green-600 focus:ring-green-500" />
                            <span className="text-sm">{u.name}</span>
                            <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                            <span className="text-xs text-gray-400">{u.email}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-green-500 mt-1">{(manualSettings.specificUsers || []).length} user{(manualSettings.specificUsers || []).length !== 1 ? 's' : ''} selected</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-green-200">
                  <p className="text-xs text-green-600">When disabled, users won't see Clock In/Out buttons on their dashboard. Auto-clock continues independently.</p>
                  <Button onClick={handleSaveManualSettings} disabled={savingManual} className="bg-green-600 hover:bg-green-700">
                    {savingManual && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Manual clock-in/out buttons are hidden for all users. Enable to allow manual time tracking.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mb-6 border-purple-200 bg-purple-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Auto Clock-In / Clock-Out Settings</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Enable Auto-Clock</span>
                <button
                  onClick={() => setAutoSettings({ ...autoSettings, enabled: !autoSettings.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSettings.enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {autoSettings.enabled && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs text-purple-700">Clock-In Time</Label>
                    <Input type="time" value={autoSettings.clockInTime || '08:00'} onChange={e => setAutoSettings({ ...autoSettings, clockInTime: e.target.value })} className="border-purple-200" />
                  </div>
                  <div>
                    <Label className="text-xs text-purple-700">Clock-Out Time</Label>
                    <Input type="time" value={autoSettings.clockOutTime || '17:00'} onChange={e => setAutoSettings({ ...autoSettings, clockOutTime: e.target.value })} className="border-purple-200" />
                  </div>
                  <div>
                    <Label className="text-xs text-purple-700">Inactivity Timeout (min)</Label>
                    <Input type="number" min="5" max="120" value={autoSettings.inactivityTimeout || 30} onChange={e => setAutoSettings({ ...autoSettings, inactivityTimeout: parseInt(e.target.value) || 30 })} className="border-purple-200" />
                  </div>
                  <div>
                    <Label className="text-xs text-purple-700">Apply To</Label>
                    <NativeSelect value={autoSettings.mode || 'all'} onChange={e => setAutoSettings({ ...autoSettings, mode: e.target.value })} className="border-purple-200">
                      <option value="all">All Users</option>
                      <option value="specific">Specific Users</option>
                    </NativeSelect>
                  </div>
                </div>

                {autoSettings.mode === 'specific' && (
                  <div>
                    <Label className="text-xs text-purple-700 mb-2 block">Select Users for Auto-Clock</Label>
                    <div className="max-h-48 overflow-y-auto border border-purple-200 rounded-lg p-2 bg-white space-y-1">
                      {allUsers.map(u => {
                        const uid = u.userId || u.id;
                        const isSelected = (autoSettings.specificUsers || []).includes(uid);
                        return (
                          <label key={uid} className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-purple-50 ${isSelected ? 'bg-purple-100' : ''}`}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleUserForAutoClock(uid)} className="rounded border-purple-300 text-purple-600 focus:ring-purple-500" />
                            <span className="text-sm">{u.name}</span>
                            <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                            <span className="text-xs text-gray-400">{u.email}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-xs text-purple-500 mt-1">{(autoSettings.specificUsers || []).length} user{(autoSettings.specificUsers || []).length !== 1 ? 's' : ''} selected</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-purple-200">
                  <div className="text-xs text-purple-600 space-y-0.5">
                    <p>Users will be automatically clocked in when they open the platform.</p>
                    <p>If inactive for {autoSettings.inactivityTimeout || 30} minutes, clock will auto-pause. Resumes on return.</p>
                    <p>Auto clock-out at {autoSettings.clockOutTime || '17:00'} if still clocked in.</p>
                  </div>
                  <Button onClick={handleSaveAutoSettings} disabled={savingAuto} className="bg-purple-600 hover:bg-purple-700">
                    {savingAuto && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Save Settings
                  </Button>
                </div>
              </div>
            )}

            {!autoSettings.enabled && (
              <p className="text-sm text-gray-500">Enable auto-clock to automatically track attendance when users are on the platform. Includes inactivity pause and scheduled clock-out.</p>
            )}
          </CardContent>
        </Card>
      </>)}

      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Total Records</p><p className="text-2xl font-bold mt-1">{records.length}</p>{autoTracked > 0 && <p className="text-xs text-purple-500 mt-0.5"><Zap className="w-3 h-3 inline" /> {autoTracked} auto-tracked</p>}</CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Present</p><p className="text-2xl font-bold text-green-600 mt-1">{present}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Currently Paused</p><p className="text-2xl font-bold text-amber-600 mt-1">{paused}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Late Arrivals</p><p className="text-2xl font-bold text-amber-600 mt-1">{late}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Overtime</p><p className="text-2xl font-bold text-blue-600 mt-1">{overtime}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Attendance Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart id="attendance-pie">
                <Pie key="pie" data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                </Pie>
                <Tooltip key="tooltip" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Weekly Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart id="attendance-weekly-line" data={[
                { day: 'Mon', present: 42, late: 3 }, 
                { day: 'Tue', present: 45, late: 2 },
                { day: 'Wed', present: 43, late: 4 }, 
                { day: 'Thu', present: 44, late: 1 },
                { day: 'Fri', present: 40, late: 5 },
              ]}>
                <CartesianGrid key="grid" strokeDasharray="3 3" />
                <XAxis key="xaxis" dataKey="day" />
                <YAxis key="yaxis" />
                <Tooltip key="tooltip" />
                <Legend key="legend" />
                <Line key="line-present" type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} />
                <Line key="line-late" type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead><TableHead>Date</TableHead><TableHead>Clock In</TableHead><TableHead>Clock Out</TableHead><TableHead>Hours</TableHead><TableHead>Paused</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">No attendance records found</TableCell></TableRow>
                ) : filtered.slice(0, 30).map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium"><div className="flex items-center gap-1.5">{r.employeeName || '\u2014'}{r.autoClocked && <Zap className="w-3 h-3 text-purple-400" />}</div></TableCell>
                    <TableCell>{r.date}</TableCell>
                    <TableCell className="text-sm">{r.clockIn ? new Date(r.clockIn).toLocaleTimeString() : '\u2014'}</TableCell>
                    <TableCell className="text-sm">{r.clockOut ? new Date(r.clockOut).toLocaleTimeString() : '\u2014'}</TableCell>
                    <TableCell className="text-sm">{r.regularMinutes ? `${Math.floor(r.regularMinutes / 60)}h ${r.regularMinutes % 60}m` : '\u2014'}</TableCell>
                    <TableCell className="text-sm">{r.totalPausedMinutes > 0 ? <span className="text-amber-600">{r.totalPausedMinutes}m ({r.pauses?.length || 0}x)</span> : r.isPaused ? <Badge className="bg-amber-100 text-amber-700 text-[10px] animate-pulse">PAUSED</Badge> : '\u2014'}</TableCell>
                    <TableCell>
                      <Badge className={r.isPaused ? 'bg-amber-100 text-amber-800' : r.status === 'present' ? 'bg-green-100 text-green-800' : r.status === 'late' ? 'bg-amber-100 text-amber-800' : r.status === 'overtime' ? 'bg-blue-100 text-blue-800' : ''}>{r.isPaused ? 'paused' : r.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditRecord(r); setFormData({ ...r }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(r)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editRecord ? 'Edit Attendance' : 'Add Attendance Record'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Employee</Label>
              <NativeSelect value={formData.userId || ''} onChange={e => { const v = e.target.value; const u = allUsers.find(u => u.userId === v); setFormData({ ...formData, userId: v, employeeName: u?.name || '' }); }} disabled={!!editRecord}>
                <option value="">Select employee</option>
                {allUsers.map(u => <option key={u.userId} value={u.userId}>{u.name} ({u.email})</option>)}
              </NativeSelect>
            </div>
            <div><Label>Date</Label><Input type="date" value={formData.date || ''} onChange={e => setFormData({ ...formData, date: e.target.value })} disabled={!!editRecord} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Clock In</Label><Input type="datetime-local" value={formData.clockIn?.slice(0, 16) || ''} onChange={e => setFormData({ ...formData, clockIn: new Date(e.target.value).toISOString() })} /></div>
              <div><Label>Clock Out</Label><Input type="datetime-local" value={formData.clockOut?.slice(0, 16) || ''} onChange={e => setFormData({ ...formData, clockOut: new Date(e.target.value).toISOString() })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <NativeSelect value={formData.status || 'present'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="overtime">Overtime</option>
                <option value="half-day">Half Day</option>
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editRecord ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== PAYROLL ==========
function PayrollView() {
  const { accessToken } = useAuth();
  const { currencySymbol } = useCurrency();
  const [items, setItems] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [payroll, usrs] = await Promise.all([
        api('/superadmin/payroll-run', { token: accessToken }),
        api('/users', { token: accessToken }),
      ]);
      setItems(Array.isArray(payroll) ? payroll : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await api(`/superadmin/payroll-run/${editItem.id}`, { method: 'PUT', body: formData, token: accessToken });
        toast.success('Payroll record updated');
      } else {
        const net = parseFloat(formData.basicSalary || 0) + parseFloat(formData.allowances || 0) - parseFloat(formData.deductions || 0);
        await api('/superadmin/payroll-run', { method: 'POST', body: { ...formData, netPay: net.toFixed(2) }, token: accessToken });
        toast.success('Payroll record created');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this payroll record?')) return;
    try { await api(`/superadmin/payroll-run/${id}`, { method: 'DELETE', token: accessToken }); toast.success('Deleted'); setItems(prev => prev.filter(i => i.id !== id)); } catch (e: any) { toast.error(e.message); }
  };

  const totalPayroll = items.reduce((sum, i) => sum + parseFloat(i.netPay || 0), 0);
  const paidCount = items.filter(i => i.status === 'paid').length;
  const pendingCount = items.filter(i => i.status === 'pending').length;

  const monthlyPayroll = [
    { id: 'payroll-jan', month: 'Jan', amount: 125000 }, 
    { id: 'payroll-feb', month: 'Feb', amount: 128000 }, 
    { id: 'payroll-mar', month: 'Mar', amount: 132000 },
    { id: 'payroll-apr', month: 'Apr', amount: 130000 }, 
    { id: 'payroll-may', month: 'May', amount: 135000 }, 
    { id: 'payroll-jun', month: 'Jun', amount: totalPayroll || 138000 },
  ];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payroll</h1>
        <Button onClick={() => { setEditItem(null); setFormData({ status: 'pending', period: new Date().toISOString().slice(0, 7) }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Run Payroll</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Total Payroll</p><p className="text-2xl font-bold mt-1">{currencySymbol} {totalPayroll.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Records</p><p className="text-2xl font-bold mt-1">{items.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Paid</p><p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p></CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Monthly Payroll Trend</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyPayroll} id="payroll-trend-area">
              <CartesianGrid key="grid" strokeDasharray="3 3" />
              <XAxis key="xaxis" dataKey="month" />
              <YAxis key="yaxis" />
              <Tooltip key="tooltip" />
              <Area key="area-amount" type="monotone" dataKey="amount" stroke="#3b82f6" fill="#dbeafe" name={`Payroll (${currencySymbol})`} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-gray-400"><DollarSign className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No payroll records yet</p></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Employee</TableHead><TableHead>Period</TableHead><TableHead>Basic Salary</TableHead><TableHead>Allowances</TableHead><TableHead>Deductions</TableHead><TableHead>Net Pay</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.employeeName || '\u2014'}</TableCell>
                    <TableCell>{item.period || '\u2014'}</TableCell>
                    <TableCell>{currencySymbol} {parseFloat(item.basicSalary || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">+{parseFloat(item.allowances || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">-{parseFloat(item.deductions || 0).toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">{currencySymbol} {parseFloat(item.netPay || 0).toLocaleString()}</TableCell>
                    <TableCell><Badge className={item.status === 'paid' ? 'bg-green-100 text-green-800' : item.status === 'processing' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}>{item.status}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(item); setFormData({ ...item }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Payroll Record' : 'Run Payroll'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Employee</Label>
              <NativeSelect value={formData.userId || ''} onChange={e => { const v = e.target.value; const u = users.find(u => u.userId === v); setFormData({ ...formData, userId: v, employeeName: u?.name || '' }); }}>
                <option value="">Select employee</option>
                {users.map(u => <option key={u.userId} value={u.userId}>{u.name} ({u.role})</option>)}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Period</Label><Input type="month" value={formData.period || ''} onChange={e => setFormData({ ...formData, period: e.target.value })} /></div>
              <div><Label>Pay Date</Label><Input type="date" value={formData.payDate || ''} onChange={e => setFormData({ ...formData, payDate: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Basic Salary</Label><Input type="number" value={formData.basicSalary || ''} onChange={e => setFormData({ ...formData, basicSalary: e.target.value })} /></div>
              <div><Label>Allowances</Label><Input type="number" value={formData.allowances || ''} onChange={e => setFormData({ ...formData, allowances: e.target.value })} /></div>
              <div><Label>Deductions</Label><Input type="number" value={formData.deductions || ''} onChange={e => setFormData({ ...formData, deductions: e.target.value })} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <NativeSelect value={formData.status || 'pending'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== HR REPORTS ==========
function HRReportsView() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [stats, setStats] = useState<any>({});
  const [rawUsers, setRawUsers] = useState<any[]>([]);
  const [rawLeaves, setRawLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('overview');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [deptFilter, setDeptFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      api('/users', { token: accessToken }),
      api('/reference-data', { token: accessToken }),
      api('/leave-requests', { token: accessToken }),
    ]).then(([users, ref, leaves]) => {
      const usersArr = Array.isArray(users) ? users : [];
      const leavesArr = Array.isArray(leaves) ? leaves : [];
      setRawUsers(usersArr);
      setRawLeaves(leavesArr);
      const deptCounts: Record<string, number> = {};
      usersArr.forEach((u: any) => { if (u.department) deptCounts[u.department] = (deptCounts[u.department] || 0) + 1; });
      setStats({
        totalEmployees: usersArr.length,
        departments: ref.departments?.length || 0,
        pendingLeaves: leavesArr.filter((l: any) => l.status === 'pending').length,
        approvedLeaves: leavesArr.filter((l: any) => l.status === 'approved').length,
        deptData: Object.entries(deptCounts).map(([dept, count]) => ({ dept, count })),
        roleData: [
          { role: 'Super Admin', count: usersArr.filter((u: any) => u.role === 'superadmin').length },
          { role: 'Admin', count: usersArr.filter((u: any) => u.role === 'admin').length },
          { role: 'Manager', count: usersArr.filter((u: any) => u.role === 'manager').length },
          { role: 'Employee', count: usersArr.filter((u: any) => u.role === 'employee').length },
        ].filter(r => r.count > 0),
        companies: ref.companies || [],
      });
    }).catch(console.log).finally(() => setLoading(false));
  }, [accessToken]);

  const uniqueDepts = [...new Set(rawUsers.map(u => u.department).filter(Boolean))];
  const uniqueCompanies = [...new Set(rawUsers.map(u => u.company).filter(Boolean))];

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: string }) => (
    <button onClick={() => toggleSort(field)} className="ml-1 inline-flex text-gray-400 hover:text-gray-600">
      {sortField === field ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
    </button>
  );

  const filteredUsers = rawUsers
    .filter(u => deptFilter === 'all' || u.department === deptFilter)
    .filter(u => companyFilter === 'all' || u.company === companyFilter)
    .filter(u => roleFilter === 'all' || u.role === roleFilter)
    .filter(u => !searchTerm || u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.department?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const aVal = String(a[sortField] || '').toLowerCase();
      const bVal = String(b[sortField] || '').toLowerCase();
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const handleExportCSV = () => {
    if (reportType === 'employees') {
      exportToCSV(filteredUsers.map(u => ({ Name: u.name, Email: u.email, Role: u.role, Department: u.department || '', Company: u.company || '', Status: u.status || 'active', Position: u.position || '' })), 'employee-report');
    } else if (reportType === 'leaves') {
      exportToCSV(rawLeaves.map(l => ({ Employee: l.employeeName, Type: l.leaveType || l.type, Start: l.startDate, End: l.endDate, Status: l.status, Reason: l.reason || '' })), 'leave-report');
    } else {
      exportToCSV(rawUsers.map(u => ({ Name: u.name, Email: u.email, Role: u.role, Department: u.department || '', Company: u.company || '' })), 'hr-overview-report');
    }
  };

  const handleExportPDF = () => {
    if (reportType === 'employees') {
      exportToPDF('Employee Report', filteredUsers, ['name', 'email', 'role', 'department', 'company', 'status'], branding.companyName);
    } else if (reportType === 'leaves') {
      exportToPDF('Leave Report', rawLeaves, ['employeeName', 'leaveType', 'startDate', 'endDate', 'status', 'reason'], branding.companyName);
    } else {
      exportToPDF('HR Overview', rawUsers, ['name', 'email', 'role', 'department', 'company'], branding.companyName);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">HR Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <NativeSelect value={reportType} onChange={e => setReportType(e.target.value)} className="w-44">
            <option value="overview">Overview</option>
            <option value="employees">Employee Report</option>
            <option value="leaves">Leave Report</option>
          </NativeSelect>
          <Button variant="outline" onClick={handleExportCSV}><FileSpreadsheet className="w-4 h-4 mr-2" />Export CSV</Button>
          <Button variant="outline" onClick={handleExportPDF}><Printer className="w-4 h-4 mr-2" />Export PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Total Employees</p><p className="text-2xl font-bold mt-1">{loading ? '\u2014' : stats.totalEmployees}</p><p className="text-xs text-green-600 mt-1">{'\u2191'} Active workforce</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Avg. Attendance</p><p className="text-2xl font-bold mt-1">94.5%</p><p className="text-xs text-green-600 mt-1">{'\u2191'} 2.3% vs last month</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Turnover Rate</p><p className="text-2xl font-bold mt-1">3.2%</p><p className="text-xs text-red-600 mt-1">{'\u2191'} 0.5% vs last month</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Pending Leaves</p><p className="text-2xl font-bold mt-1">{loading ? '\u2014' : stats.pendingLeaves}</p><p className="text-xs text-gray-500 mt-1">Requires action</p></CardContent></Card>
      </div>

      {reportType === 'overview' && (
        <>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Employee Growth</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart id="reports-growth-line" data={[
                    { month: 'Jan', employees: 120 }, 
                    { month: 'Feb', employees: 125 }, 
                    { month: 'Mar', employees: 130 },
                    { month: 'Apr', employees: 135 }, 
                    { month: 'May', employees: 138 }, 
                    { month: 'Jun', employees: stats.totalEmployees || 142 },
                  ]}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" />
                    <XAxis key="xaxis" dataKey="month" />
                    <YAxis key="yaxis" />
                    <Tooltip key="tooltip" />
                    <Legend key="legend" />
                    <Line key="line-employees" type="monotone" dataKey="employees" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Department Headcount</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart id="reports-dept-bar" data={stats.deptData?.length ? stats.deptData : [
                    { dept: 'Engineering', count: 45 }, 
                    { dept: 'Sales', count: 32 }, 
                    { dept: 'Marketing', count: 18 },
                    { dept: 'Operations', count: 25 }, 
                    { dept: 'HR', count: 12 }, 
                    { dept: 'Finance', count: 10 },
                  ]}>
                    <CartesianGrid key="grid" strokeDasharray="3 3" />
                    <XAxis key="xaxis" dataKey="dept" />
                    <YAxis key="yaxis" />
                    <Tooltip key="tooltip" />
                    <Bar key="bar-count" dataKey="count" fill="#8b5cf6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Attendance Overview</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart id="reports-attendance-pie">
                    <Pie key="pie" data={[
                      { name: 'Present', value: 134, color: '#10b981' },
                      { name: 'Late', value: 5, color: '#f59e0b' },
                      { name: 'Absent', value: 3, color: '#ef4444' },
                    ]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {[
                        { name: 'Present', color: '#10b981' },
                        { name: 'Late', color: '#f59e0b' },
                        { name: 'Absent', color: '#ef4444' }
                      ].map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip key="tooltip" />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Leave Utilization</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart id="reports-leave-bar" data={[
                    { type: 'Annual', used: 65, available: 35 },
                    { type: 'Sick', used: 45, available: 55 },
                    { type: 'Personal', used: 30, available: 70 },
                    { type: 'Maternity', used: 80, available: 20 },
                  ]} layout="vertical">
                    <CartesianGrid key="grid" strokeDasharray="3 3" />
                    <XAxis key="xaxis" type="number" />
                    <YAxis key="yaxis" dataKey="type" type="category" />
                    <Tooltip key="tooltip" />
                    <Legend key="legend" />
                    <Bar key="bar-used" dataKey="used" stackId="a" fill="#3b82f6" />
                    <Bar key="bar-available" dataKey="available" stackId="a" fill="#e5e7eb" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {reportType === 'employees' && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <CardTitle>Employee Report ({filteredUsers.length})</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search name, email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9" />
                </div>
                <NativeSelect value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="w-36 h-9">
                  <option value="all">All Departments</option>
                  {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
                </NativeSelect>
                <NativeSelect value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} className="w-36 h-9">
                  <option value="all">All Companies</option>
                  {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                </NativeSelect>
                <NativeSelect value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-32 h-9">
                  <option value="all">All Roles</option>
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="employee">Employee</option>
                </NativeSelect>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name <SortIcon field="name" /></TableHead>
                    <TableHead>Email <SortIcon field="email" /></TableHead>
                    <TableHead>Role <SortIcon field="role" /></TableHead>
                    <TableHead>Department <SortIcon field="department" /></TableHead>
                    <TableHead>Company <SortIcon field="company" /></TableHead>
                    <TableHead>Status <SortIcon field="status" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No matching employees</TableCell></TableRow>
                  ) : filteredUsers.map(u => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell className="text-sm">{u.department || '\u2014'}</TableCell>
                      <TableCell className="text-sm">{u.company || '\u2014'}</TableCell>
                      <TableCell><Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{u.status || 'active'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === 'leaves' && (
        <Card>
          <CardHeader><CardTitle>Leave Report ({rawLeaves.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Status</TableHead><TableHead>Reason</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {rawLeaves.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No leave records</TableCell></TableRow>
                  ) : rawLeaves.map((l, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{l.employeeName || '\u2014'}</TableCell>
                      <TableCell>{l.leaveType || l.type || '\u2014'}</TableCell>
                      <TableCell>{l.startDate || '\u2014'}</TableCell>
                      <TableCell>{l.endDate || '\u2014'}</TableCell>
                      <TableCell><Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{l.status}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{l.reason || '\u2014'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ========== LEAVE MANAGEMENT (Full CRUD) ==========
function LeaveManagementView() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'requests' | 'types'>('requests');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lv, lt, usrs] = await Promise.all([
        api('/leave-requests', { token: accessToken }),
        api('/superadmin/leave-type', { token: accessToken }),
        api('/users', { token: accessToken }),
      ]);
      setLeaves(Array.isArray(lv) ? lv.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
      setLeaveTypes(Array.isArray(lt) ? lt : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  
  // Real-time subscription for instant leave updates
  useEffect(() => {
    const supabase = createClient(`https://${projectId}.supabase.co`, publicAnonKey);
    const channel = supabase.channel('leave-changes');
    
    channel.on('broadcast', { event: 'data-changed' }, () => {
      console.log('🏖️ Leave Management: Real-time update received, reloading data...');
      load();
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const handleSaveRequest = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await api(`/leave-requests/${editItem.id}`, { method: 'PUT', body: formData, token: accessToken });
        toast.success('Leave request updated');
      } else {
        await api('/leave-requests', { method: 'POST', body: formData, token: accessToken });
        toast.success('Leave request created');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api(`/leave-requests/${id}`, { method: 'PUT', body: { status }, token: accessToken });
      toast.success(`Leave ${status}`);
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm('Delete this leave request?')) return;
    try {
      await api(`/leave-requests/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted');
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const pending = leaves.filter(l => l.status === 'pending').length;
  const approved = leaves.filter(l => l.status === 'approved').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;
  const filtered = leaves.filter(l => !search || l.employeeName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Leave Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => { setEditItem(null); setFormData({ status: 'pending' }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />New Leave Request</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Total Requests</p><p className="text-2xl font-bold mt-1">{leaves.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Pending</p><p className="text-2xl font-bold text-amber-600 mt-1">{pending}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Approved</p><p className="text-2xl font-bold text-green-600 mt-1">{approved}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Rejected</p><p className="text-2xl font-bold text-red-600 mt-1">{rejected}</p></CardContent></Card>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="types">Leave Types ({leaveTypes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Leave Requests</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400"><CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No leave requests</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Employee</TableHead><TableHead>Type</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead><TableHead className="w-36">Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.employeeName || '\u2014'}</TableCell>
                        <TableCell>{l.leaveType || l.type || '\u2014'}</TableCell>
                        <TableCell>{l.startDate || '\u2014'}</TableCell>
                        <TableCell>{l.endDate || '\u2014'}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">{l.reason || '\u2014'}</TableCell>
                        <TableCell>
                          <Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{l.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {l.status === 'pending' && (
                              <>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600 hover:bg-green-50" onClick={() => handleStatusChange(l.id, 'approved')}><CheckCircle className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:bg-red-50" onClick={() => handleStatusChange(l.id, 'rejected')}><X className="w-3.5 h-3.5" /></Button>
                              </>
                            )}
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(l); setFormData({ ...l }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteRequest(l.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <EntityCrud entityKey="leave-management" config={ENTITY_CONFIGS['leave-management']} />
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Leave Request' : 'New Leave Request'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {!editItem && (
              <div>
                <Label>Employee (leave blank for self)</Label>
                <NativeSelect value={formData.userId || ''} onChange={e => { const v = e.target.value; const u = users.find(u => u.userId === v); setFormData({ ...formData, userId: v, employeeName: u?.name || '' }); }}>
                  <option value="">Select employee</option>
                  {users.map(u => <option key={u.userId} value={u.userId}>{u.name} ({u.role})</option>)}
                </NativeSelect>
              </div>
            )}
            <div>
              <Label>Leave Type</Label>
              <NativeSelect value={formData.leaveType || formData.type || ''} onChange={e => setFormData({ ...formData, leaveType: e.target.value, type: e.target.value })}>
                <option value="">Select type</option>
                {leaveTypes.length > 0 ? leaveTypes.map(lt => <option key={lt.id} value={lt.name}>{lt.name} ({lt.daysAllowed} days)</option>) : (
                  <>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                  </>
                )}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={formData.startDate || ''} onChange={e => setFormData({ ...formData, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={formData.endDate || ''} onChange={e => setFormData({ ...formData, endDate: e.target.value })} /></div>
            </div>
            <div><Label>Reason</Label><Textarea value={formData.reason || ''} onChange={e => setFormData({ ...formData, reason: e.target.value })} rows={3} /></div>
            {editItem && (
              <div>
                <Label>Status</Label>
                <NativeSelect value={formData.status || 'pending'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </NativeSelect>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRequest} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editItem ? 'Update' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== ONBOARDING & TRAINING (Enhanced) ==========
function OnboardingView() {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'programs' | 'checklists'>('programs');
  const [checklists, setChecklists] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cl, usrs, prg] = await Promise.all([
        api('/superadmin/onboard-checklist', { token: accessToken }),
        api('/users', { token: accessToken }),
        api('/superadmin/training-program', { token: accessToken }),
      ]);
      setChecklists(Array.isArray(cl) ? cl : []);
      setUsers(Array.isArray(usrs) ? usrs : []);
      setPrograms(Array.isArray(prg) ? prg : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSaveChecklist = async () => {
    setSaving(true);
    try {
      if (editItem) {
        await api(`/superadmin/onboard-checklist/${editItem.id}`, { method: 'PUT', body: formData, token: accessToken });
        toast.success('Updated');
      } else {
        await api('/superadmin/onboard-checklist', { method: 'POST', body: formData, token: accessToken });
        toast.success('Checklist item created');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm('Delete?')) return;
    try { await api(`/superadmin/onboard-checklist/${id}`, { method: 'DELETE', token: accessToken }); toast.success('Deleted'); load(); } catch (e: any) { toast.error(e.message); }
  };

  const completedCount = checklists.filter(c => c.status === 'completed').length;
  const progressPct = checklists.length > 0 ? Math.round((completedCount / checklists.length) * 100) : 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Onboarding & Training</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          {activeTab === 'checklists' && (
            <Button onClick={() => { setEditItem(null); setFormData({ status: 'pending' }); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Add Checklist Item
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Training Programs</p><p className="text-2xl font-bold mt-1">{programs.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Checklist Items</p><p className="text-2xl font-bold mt-1">{checklists.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600 mt-1">{completedCount}</p></CardContent></Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Progress</p>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progressPct} className="h-2 flex-1" />
              <span className="text-sm font-bold">{progressPct}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList className="mb-4">
          <TabsTrigger value="programs">Training Programs</TabsTrigger>
          <TabsTrigger value="checklists">Onboarding Checklists ({checklists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="programs">
          <EntityCrud entityKey="onboarding-training" config={ENTITY_CONFIGS['onboarding-training']} />
        </TabsContent>

        <TabsContent value="checklists">
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : checklists.length === 0 ? (
                <div className="py-16 text-center text-gray-400"><BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No onboarding checklists yet</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Task</TableHead><TableHead>Employee</TableHead><TableHead>Category</TableHead><TableHead>Due Date</TableHead><TableHead>Assigned By</TableHead><TableHead>Status</TableHead><TableHead className="w-20">Actions</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {checklists.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.title || c.name}</TableCell>
                        <TableCell>{c.employeeName || '\u2014'}</TableCell>
                        <TableCell>{c.category || '\u2014'}</TableCell>
                        <TableCell>{c.dueDate || '\u2014'}</TableCell>
                        <TableCell>{c.assignedBy || '\u2014'}</TableCell>
                        <TableCell><Badge className={c.status === 'completed' ? 'bg-green-100 text-green-800' : c.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}>{c.status}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditItem(c); setFormData({ ...c }); setDialogOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDeleteChecklist(c.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Checklist Item' : 'New Checklist Item'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Task Title</Label><Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} /></div>
            <div>
              <Label>Employee</Label>
              <NativeSelect value={formData.employeeId || ''} onChange={e => {
                const v = e.target.value;
                const u = users.find(u => (u.userId || u.id) === v);
                setFormData({ ...formData, employeeId: v, employeeName: u?.name || '' });
              }}>
                <option value="">Select employee</option>
                {users.map(u => <option key={u.userId || u.id} value={u.userId || u.id}>{u.name} ({u.role})</option>)}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <NativeSelect value={formData.category || ''} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="">Select</option>
                  <option value="documentation">Documentation</option>
                  <option value="it-setup">IT Setup</option>
                  <option value="training">Training</option>
                  <option value="orientation">Orientation</option>
                  <option value="compliance">Compliance</option>
                  <option value="welcome">Welcome</option>
                </NativeSelect>
              </div>
              <div><Label>Due Date</Label><Input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} /></div>
            </div>
            <div><Label>Assigned By</Label>
              <NativeSelect value={formData.assignedById || ''} onChange={e => {
                const v = e.target.value;
                const u = users.find(u => (u.userId || u.id) === v);
                setFormData({ ...formData, assignedBy: u?.name || '', assignedById: v });
              }}>
                <option value="">Select user</option>
                {users.map(u => <option key={u.userId || u.id} value={u.userId || u.id}>{u.name} ({u.role})</option>)}
              </NativeSelect>
            </div>
            <div><Label>Description</Label><Textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} /></div>
            <div>
              <Label>Status</Label>
              <NativeSelect value={formData.status || 'pending'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveChecklist} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== SELF-SERVICE HUB (Functional Employee Mode) ==========
function SelfServiceView({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { user, accessToken } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loadingClock, setLoadingClock] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState<any>({});
  const [savingLeave, setSavingLeave] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [myLeaves, setMyLeaves] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [today, lt, leaves, tasks] = await Promise.all([
          api('/attendance/today', { token: accessToken }),
          api('/superadmin/leave-type', { token: accessToken }).catch(() => []),
          api('/leave-requests', { token: accessToken }),
          api('/superadmin/task', { token: accessToken }).catch(() => []),
        ]);
        setTodayAttendance(today);
        setLeaveTypes(Array.isArray(lt) ? lt : []);
        setMyLeaves(Array.isArray(leaves) ? leaves.filter((l: any) => l.userId === user?.id).slice(0, 5) : []);
        setMyTasks(Array.isArray(tasks) ? tasks.filter((t: any) => t.assignedTo === user?.name).slice(0, 5) : []);
      } catch (e) { console.log(e); }
      setLoading(false);
    };
    loadData();
  }, [accessToken, user]);

  const handleClockIn = async () => {
    setLoadingClock(true);
    try {
      const res = await api('/attendance/clock-in', { method: 'POST', token: accessToken });
      setTodayAttendance(res);
      toast.success('Clocked in successfully');
    } catch (e: any) { toast.error(e.message); }
    setLoadingClock(false);
  };

  const handleClockOut = async () => {
    setLoadingClock(true);
    try {
      const res = await api('/attendance/clock-out', { method: 'POST', token: accessToken });
      setTodayAttendance(res);
      toast.success('Clocked out successfully');
    } catch (e: any) { toast.error(e.message); }
    setLoadingClock(false);
  };

  const handleSubmitLeave = async () => {
    if (!leaveForm.leaveType || !leaveForm.startDate) { toast.error('Leave type and start date required'); return; }
    setSavingLeave(true);
    try {
      await api('/leave-requests', { method: 'POST', body: leaveForm, token: accessToken });
      toast.success('Leave request submitted');
      setLeaveDialogOpen(false);
      setLeaveForm({});
    } catch (e: any) { toast.error(e.message); }
    setSavingLeave(false);
  };

  const quickTiles = [
    { label: 'View Payslips', desc: 'Access salary details', icon: DollarSign, color: 'bg-green-500', action: 'payroll' },
    { label: 'My Attendance', desc: 'View full history', icon: Clock, color: 'bg-purple-500', action: 'attendance' },
    { label: 'Update Profile', desc: 'Edit personal info', icon: User, color: 'bg-indigo-500', action: 'my-profile' },
    { label: 'View Benefits', desc: 'Check benefit plans', icon: Heart, color: 'bg-pink-500', action: 'benefits' },
    { label: 'My Goals', desc: 'Track your OKRs', icon: Target, color: 'bg-amber-500', action: 'goals-okrs' },
    { label: 'Training', desc: 'Enroll in programs', icon: GraduationCap, color: 'bg-cyan-500', action: 'onboarding-training' },
    { label: 'Company News', desc: 'View announcements', icon: Megaphone, color: 'bg-orange-500', action: 'announcements' },
    { label: 'Messages', desc: 'Check your inbox', icon: MessageCircle, color: 'bg-teal-500', action: 'messages' },
    { label: 'My Tasks', desc: 'View assignments', icon: ClipboardList, color: 'bg-red-500', action: 'tasks' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Self-Service Hub</h1>
      <p className="text-sm text-gray-500 mb-6">Your personal employee portal</p>

      {/* Clock In/Out + Leave Request */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card className="col-span-1">
          <CardHeader><CardTitle className="text-base">Today's Attendance</CardTitle></CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              {todayAttendance?.clockIn ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Clocked In</span>
                  </div>
                  <p className="text-xs text-gray-500">At {new Date(todayAttendance.clockIn).toLocaleTimeString()}</p>
                  {todayAttendance.clockOut ? (
                    <p className="text-xs text-gray-500">Out at {new Date(todayAttendance.clockOut).toLocaleTimeString()}</p>
                  ) : (
                    <Button size="sm" onClick={handleClockOut} disabled={loadingClock} className="mt-2 w-full">
                      {loadingClock ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clock Out'}
                    </Button>
                  )}
                </div>
              ) : (
                <Button onClick={handleClockIn} disabled={loadingClock} className="w-full mt-2">
                  {loadingClock ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />}
                  Clock In
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader><CardTitle className="text-base">Request Leave</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-3">Submit a new leave application</p>
            <Button className="w-full" onClick={() => { setLeaveForm({}); setLeaveDialogOpen(true); }}>
              <CalendarDays className="w-4 h-4 mr-2" />Request Leave
            </Button>
            {myLeaves.length > 0 && (
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-400 font-medium">Recent requests:</p>
                {myLeaves.slice(0, 3).map((l, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span>{l.leaveType || l.type}</span>
                    <Badge className={`text-[10px] ${l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{l.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader><CardTitle className="text-base">My Tasks</CardTitle></CardHeader>
          <CardContent>
            {myTasks.length === 0 ? (
              <div className="text-center text-gray-400 py-4"><ClipboardList className="w-8 h-8 mx-auto mb-1 opacity-50" /><p className="text-xs">No tasks assigned</p></div>
            ) : (
              <div className="space-y-2">
                {myTasks.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-[10px] text-gray-400">{t.dueDate ? `Due: ${t.dueDate}` : 'No due date'}</p>
                    </div>
                    <Badge className={`text-[10px] ml-2 ${t.status === 'completed' ? 'bg-green-100 text-green-800' : t.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{t.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Nav Tiles */}
      <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
      <div className="grid grid-cols-3 gap-4">
        {quickTiles.map((tile, idx) => {
          const Icon = tile.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => onNavigate(tile.action)}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-11 h-11 ${tile.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{tile.label}</h3>
                  <p className="text-xs text-gray-500">{tile.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leave Request Dialog */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Request Leave</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Leave Type</Label>
              <NativeSelect value={leaveForm.leaveType || ''} onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value, type: e.target.value })}>
                <option value="">Select leave type</option>
                {leaveTypes.length > 0 ? leaveTypes.map(lt => <option key={lt.id} value={lt.name}>{lt.name} ({lt.daysAllowed} days)</option>) : (
                  <>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Personal Leave">Personal Leave</option>
                  </>
                )}
              </NativeSelect>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start Date</Label><Input type="date" value={leaveForm.startDate || ''} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} /></div>
              <div><Label>End Date</Label><Input type="date" value={leaveForm.endDate || ''} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} /></div>
            </div>
            <div><Label>Reason</Label><Textarea value={leaveForm.reason || ''} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} rows={3} placeholder="Explain your reason..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitLeave} disabled={savingLeave}>{savingLeave && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== ANNOUNCEMENTS ==========
function AnnouncementsView() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ targetAudience: 'all', targetDepartments: [] });
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, refData] = await Promise.all([
        api('/announcements', { token: accessToken }),
        api('/reference-data', { token: accessToken }).catch(() => ({})),
      ]);
      setItems(Array.isArray(data) ? data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
      if (refData?.departments) setDepartments(refData.departments);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  // Reduce polling to 60 seconds to minimize server load
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleSave = async () => {
    if (!formData.title || !formData.content) { toast.error('Title and content required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        priority: formData.priority || 'normal',
        targetAudience: formData.targetAudience || 'all',
        targetDepartments: formData.targetAudience === 'all' ? [] : (formData.targetDepartments || []),
        createdByRole: 'superadmin',
      };
      if (editItem) {
        await api(`/announcements/${editItem.id}`, { method: 'PUT', body: payload, token: accessToken });
        toast.success('Announcement updated');
      } else {
        await api('/announcements', { method: 'POST', body: payload, token: accessToken });
        toast.success('Announcement created');
      }
      setDialogOpen(false);
      setFormData({ targetAudience: 'all', targetDepartments: [] });
      setEditItem(null);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api(`/announcements/${id}`, { method: 'DELETE', token: accessToken }); toast.success('Deleted'); setItems(prev => prev.filter(i => i.id !== id)); } catch (e: any) { toast.error(e.message); }
  };

  const toggleDepartment = (deptName: string) => {
    const current = formData.targetDepartments || [];
    if (current.includes(deptName)) {
      setFormData({ ...formData, targetDepartments: current.filter((d: string) => d !== deptName) });
    } else {
      setFormData({ ...formData, targetDepartments: [...current, deptName] });
    }
  };

  const selectAllDepartments = () => {
    setFormData({ ...formData, targetDepartments: departments.map((d: any) => d.name || d.id) });
  };

  const clearAllDepartments = () => {
    setFormData({ ...formData, targetDepartments: [] });
  };

  const getTargetLabel = (item: any) => {
    if (!item.targetAudience || item.targetAudience === 'all') return 'All Departments';
    if (item.targetDepartments?.length > 0) return `${item.targetDepartments.length} Department${item.targetDepartments.length > 1 ? 's' : ''}`;
    if (item.department) return item.department;
    return 'All';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} announcement{items.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditItem(null); setFormData({ targetAudience: 'all', targetDepartments: [] }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Create</Button>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-gray-400"><Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No announcements</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map(i => (
            <Card key={i.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium">{i.title}</h3>
                      <Badge className={i.priority === 'urgent' ? 'bg-red-100 text-red-800' : i.priority === 'important' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}>{i.priority}</Badge>
                      <Badge className={(!i.targetAudience || i.targetAudience === 'all') ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}>
                        {getTargetLabel(i)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{i.content}</p>
                    {i.targetDepartments?.length > 0 && i.targetAudience !== 'all' && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {i.targetDepartments.map((d: string) => (
                          <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">{i.authorName} {'\u2022'} {new Date(i.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setEditItem(i); setFormData({ ...i, targetDepartments: i.targetDepartments || [] }); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(i.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editItem ? 'Edit Announcement' : 'Create Announcement'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>Title</Label><Input value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Announcement title" /></div>
            <div><Label>Content</Label><Textarea value={formData.content || ''} onChange={e => setFormData({ ...formData, content: e.target.value })} rows={4} placeholder="Announcement content..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority</Label>
                <NativeSelect value={formData.priority || 'normal'} onChange={e => setFormData({ ...formData, priority: e.target.value })}>
                  <option value="normal">Normal</option>
                  <option value="important">Important</option>
                  <option value="urgent">Urgent</option>
                </NativeSelect>
              </div>
              <div>
                <Label>Target Audience</Label>
                <NativeSelect value={formData.targetAudience || 'all'} onChange={e => setFormData({ ...formData, targetAudience: e.target.value, targetDepartments: e.target.value === 'all' ? [] : formData.targetDepartments })}>
                  <option value="all">All Departments</option>
                  <option value="specific">Specific Department(s)</option>
                </NativeSelect>
              </div>
            </div>
            {formData.targetAudience === 'specific' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Select Departments</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={selectAllDepartments}>Select All</Button>
                    <Button type="button" variant="outline" size="sm" onClick={clearAllDepartments}>Clear All</Button>
                  </div>
                </div>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {departments.length === 0 ? (
                    <p className="text-sm text-gray-400">No departments found. Create departments first.</p>
                  ) : departments.map((dept: any) => {
                    const name = dept.name || dept.id;
                    const isSelected = (formData.targetDepartments || []).includes(name);
                    return (
                      <label key={dept.id || name} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDepartment(name)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{name}</span>
                        {dept.company && <span className="text-xs text-gray-400 ml-auto">{dept.company}</span>}
                      </label>
                    );
                  })}
                </div>
                {(formData.targetDepartments || []).length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    {formData.targetDepartments.length} department{formData.targetDepartments.length !== 1 ? 's' : ''} selected: {formData.targetDepartments.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== EMPLOYEES ==========
function EmployeesView() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    role: 'all',
    department: 'all',
    company: 'all',
    status: 'all',
  });

  useEffect(() => {
    api('/users', { token: accessToken }).then(d => setUsers(Array.isArray(d) ? d : [])).catch(console.log).finally(() => setLoading(false));
  }, [accessToken]);

  const uniqueDepts = [...new Set(users.map(u => u.department).filter(Boolean))];
  const uniqueCompanies = [...new Set(users.map(u => u.company).filter(Boolean))];

  const sortOptions = [
    { value: 'name', label: 'Name' },
    { value: 'email', label: 'Email' },
    { value: 'role', label: 'Role' },
    { value: 'department', label: 'Department' },
    { value: 'company', label: 'Company' },
    { value: 'status', label: 'Status' },
  ];

  const filterOptions = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'all', label: 'All Roles' },
        { value: 'superadmin', label: 'Super Admin' },
        { value: 'admin', label: 'Admin' },
        { value: 'manager', label: 'Manager' },
        { value: 'employee', label: 'Employee' },
      ],
    },
    {
      key: 'department',
      label: 'Department',
      options: [
        { value: 'all', label: 'All Departments' },
        ...uniqueDepts.map(d => ({ value: d, label: d })),
      ],
    },
    {
      key: 'company',
      label: 'Company',
      options: [
        { value: 'all', label: 'All Companies' },
        ...uniqueCompanies.map(c => ({ value: c, label: c })),
      ],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    },
  ];

  const filteredAndSorted = users
    .filter(u => {
      const matchSearch = !searchTerm || 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.department?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.company?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = filterValues.role === 'all' || u.role === filterValues.role;
      const matchDept = filterValues.department === 'all' || u.department === filterValues.department;
      const matchCompany = filterValues.company === 'all' || u.company === filterValues.company;
      const matchStatus = filterValues.status === 'all' || (u.status || 'active') === filterValues.status;
      return matchSearch && matchRole && matchDept && matchCompany && matchStatus;
    })
    .sort((a, b) => {
      const aVal = String(a[sortField] || '').toLowerCase();
      const bVal = String(b[sortField] || '').toLowerCase();
      const comparison = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
      </div>
      
      <ListControls
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        sortField={sortField}
        sortDir={sortDir}
        sortOptions={sortOptions}
        onSortChange={setSortField}
        onToggleSortDir={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
        filters={filterOptions}
        filterValues={filterValues}
        onFilterChange={(key, value) => setFilterValues({ ...filterValues, [key]: value })}
        onClearFilters={() => setFilterValues({ role: 'all', department: 'all', company: 'all', status: 'all' })}
        onExportCSV={() => exportToCSV(
          filteredAndSorted.map(u => ({
            Name: u.name,
            Email: u.email,
            Role: u.role,
            Department: u.department || '',
            Company: u.company || '',
            Status: u.status || 'active',
          })),
          'employees'
        )}
        onExportPDF={() => exportToPDF(
          'Employees Report',
          filteredAndSorted,
          ['name', 'email', 'role', 'department', 'company', 'status'],
          branding.companyName
        )}
        placeholder="Search employees..."
        resultCount={filteredAndSorted.length}
        totalCount={users.length}
      />

      <Card className="mt-4">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSorted.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">No employees found</TableCell></TableRow>
                  ) : filteredAndSorted.map(u => (
                    <TableRow key={u.userId}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                      <TableCell><Badge variant="outline" className={u.role === 'superadmin' ? 'border-red-200 text-red-700' : u.role === 'admin' ? 'border-amber-200 text-amber-700' : u.role === 'manager' ? 'border-blue-200 text-blue-700' : ''}>{u.role}</Badge></TableCell>
                      <TableCell className="text-sm">
                        {u.departments && u.departments.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {u.departments.map((d: string) => (
                              <Badge key={d} variant="outline" className="text-xs">
                                {d}
                                {d === u.department && <span className="ml-1">★</span>}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          u.department || '—'
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{u.company || '—'}</TableCell>
                      <TableCell><Badge className={u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{u.status || 'active'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ========== USER MANAGEMENT ==========
function UserManagementView() {
  const { accessToken, user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editUser, setEditUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [showTempPw, setShowTempPw] = useState(false);
  const [search, setSearch] = useState('');
  const [licenseInfo, setLicenseInfo] = useState<any>(null);

  const fetchLicenseInfo = useCallback(async () => {
    try {
      const response = await fetch(`https://ivohczdtuxasyfoiphqu.supabase.co/functions/v1/make-server-668731fc/subscription/license-info`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLicenseInfo(data);
      }
    } catch (error) {
      console.error('Error fetching license info:', error);
    }
  }, [accessToken]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usrs, ref] = await Promise.all([
        api('/users', { token: accessToken }),
        api('/reference-data', { token: accessToken }),
      ]);
      setUsers(Array.isArray(usrs) ? usrs : []);
      setCompanies(ref.companies || []);
      setDepartments(ref.departments || []);
      // Fetch license info
      await fetchLicenseInfo();
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken, fetchLicenseInfo]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!formData.email || !formData.name || !formData.role) {
        toast.error('Please fill in all required fields (Email, Name, Role)');
        setSaving(false);
        return;
      }

      // Prepare data with departments array
      const payload = {
        ...formData,
        departments: formData.departments || (formData.department ? [formData.department] : []),
        department: formData.department || (formData.departments && formData.departments[0]) || '',
      };
      
      if (editUser) {
        await api(`/users/${editUser.userId}`, { method: 'PUT', body: payload, token: accessToken });
        toast.success('User updated');
        setDialogOpen(false);
      } else {
        const res = await api('/superadmin/users/create', { method: 'POST', body: payload, token: accessToken });
        setTempPassword(res.tempPassword);
        setShowTempPw(true);
        toast.success('User created');
      }
      load();
    } catch (e: any) { 
      console.error('Error saving user:', e);
      
      // Handle specific error cases with helpful messages
      if (e.message && e.message.includes('already exists')) {
        toast.error('⚠️ A user with this email already exists. Please use a different email address.');
      } else if (e.needsSubscription) {
        toast.error('⚠️ No active subscription. You can create up to 5 users before purchasing licenses.');
      } else if (e.needsLicenses) {
        const usedCount = e.usedLicenses || 0;
        const purchasedCount = e.purchasedLicenses || 0;
        if (e.isTestMode) {
          toast.error(`⚠️ User limit reached. You have used all ${purchasedCount} available users. Please purchase licenses to add more users.`);
        } else {
          toast.error(`⚠️ No available licenses. You have used ${usedCount} of ${purchasedCount} licenses. Please purchase more to add users.`);
        }
      } else if (e.message && e.message.includes('Invalid email')) {
        toast.error('⚠️ Invalid email format. Please enter a valid email address.');
      } else if (e.message && e.message.includes('required')) {
        toast.error('⚠️ Please fill in all required fields (Email, Name, and Role).');
      } else {
        toast.error(e.message || 'Failed to save user. Please try again.');
      }
    }
    setSaving(false);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try { await api(`/superadmin/users/${userId}`, { method: 'DELETE', token: accessToken }); toast.success('User deleted'); load(); } catch (e: any) { toast.error(e.message); }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Reset password for this user?')) return;
    try {
      const res = await api(`/users/${userId}/reset-password`, { method: 'POST', token: accessToken });
      setTempPassword(res.tempPassword);
      setEditUser(null);
      setShowTempPw(true);
      setDialogOpen(true);
      toast.success('Password reset');
    } catch (e: any) { toast.error(e.message); }
  };

  const filtered = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => { setEditUser(null); setFormData({ role: 'employee', departments: [], department: '' }); setShowTempPw(false); setDialogOpen(true); }}><UserPlus className="w-4 h-4 mr-2" />Create User</Button>
      </div>

      {/* Info banner for license status */}
      {licenseInfo && licenseInfo.purchasedLicenses === 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-900">
            <p className="font-medium mb-1">⚠️ No Active Licenses</p>
            <p className="text-amber-700">
              You can create up to <strong>5 users</strong> before purchasing licenses. 
              Currently: <strong>{filtered.length}/5 users</strong>. 
              <span className="ml-1">Need more users? Purchase licenses in Billings & Subscriptions.</span>
            </p>
          </div>
        </div>
      )}

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Company</TableHead><TableHead>Department</TableHead><TableHead className="w-28">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.userId}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                    <TableCell className="text-sm">{u.company || u.companyName || '\u2014'}</TableCell>
                    <TableCell className="text-sm">
                      {u.departments && u.departments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.departments.map((d: string) => (
                            <Badge key={d} variant="outline" className="text-xs">
                              {d}
                              {d === u.department && <span className="ml-1">★</span>}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        u.department || '\u2014'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { 
                          setEditUser(u); 
                          setFormData({ 
                            ...u, 
                            departments: u.departments || (u.department ? [u.department] : []),
                            department: u.department || (u.departments && u.departments[0]) || ''
                          }); 
                          setShowTempPw(false); 
                          setDialogOpen(true); 
                        }}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleResetPassword(u.userId)}><KeyRound className="w-3.5 h-3.5 text-amber-500" /></Button>
                        {(u.role !== 'superadmin' || u.userId === user?.id) && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(u.userId)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={v => { if (!v) { setDialogOpen(false); setShowTempPw(false); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{showTempPw ? 'Temporary Password' : editUser ? 'Edit User' : 'Create User'}</DialogTitle></DialogHeader>
          {showTempPw ? (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg"><AlertCircle className="w-4 h-4 text-amber-600" /><p className="text-sm text-amber-800">Share this password securely with the user.</p></div>
              <div className="flex items-center gap-2"><Input value={tempPassword} readOnly className="font-mono" /><Button variant="outline" size="sm" onClick={() => copyToClipboard(tempPassword)}><Copy className="w-4 h-4" /></Button></div>
              <Button className="w-full" onClick={() => { setDialogOpen(false); setShowTempPw(false); }}>Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div><Label>Email *</Label><Input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editUser} /></div>
                </div>
                <div>
                  <Label>Role</Label>
                  <NativeSelect value={formData.role || 'employee'} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </NativeSelect>
                </div>
                <div>
                  <Label>Company</Label>
                  <NativeSelect value={formData.companyId || ''} onChange={e => setFormData({ ...formData, companyId: e.target.value })}>
                    <option value="">Select company</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </NativeSelect>
                </div>
                
                {/* Multi-Department Selection */}
                <MultiDepartmentSelect
                  departments={departments}
                  selectedDepartments={formData.departments || []}
                  onChange={(depts) => setFormData({ ...formData, departments: depts })}
                  primaryDepartment={formData.department}
                  onPrimaryChange={(dept) => setFormData({ ...formData, department: dept })}
                  showPrimary={true}
                  label="Assigned Departments"
                />
                
                <div><Label>Position</Label><Input value={formData.position || ''} onChange={e => setFormData({ ...formData, position: e.target.value })} /></div>
                <div>
                  <Label>Grade/Level</Label>
                  <Select value={formData.grade || ''} onValueChange={v => setFormData({ ...formData, grade: v })}>
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior</SelectItem>
                      <SelectItem value="Mid-Level">Mid-Level</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Director">Director</SelectItem>
                      <SelectItem value="VP">VP</SelectItem>
                      <SelectItem value="C-Level">C-Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editUser ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========== GENERIC ENTITY CRUD ==========
function EntityCrud({ entityKey, config }: { entityKey: string; config: EntityConfig }) {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [items, setItems] = useState<any[]>([]);
  const [relatedData, setRelatedData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [editItem, setEditItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState<any>(null);
  const [sortField, setSortField] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});

  // Helper: for a select field with "other" option, determine if the stored value is custom
  const getSelectDisplayValue = (field: { key: string; options?: string[] }, value: string) => {
    if (!value || !field.options) return value || '';
    if (field.options.includes(value)) return value;
    return 'other'; // stored value is custom → show "other" in dropdown
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api(config.apiPrefix, { token: accessToken });
      setItems(Array.isArray(data) ? data : []);

      // Fetch users if any field uses user-select or user-multi-select
      if (config.fields.some(f => f.type === 'user-select' || f.type === 'user-multi-select')) {
        const users = await api('/users', { token: accessToken });
        setAllUsers(Array.isArray(users) ? users : []);
      }

      const relatedEntities = config.fields.filter(f => f.type === 'related-select').map(f => f.relatedEntity!);
      if (relatedEntities.length > 0) {
        const related: Record<string, any[]> = {};
        for (const entity of relatedEntities) {
          const entityConfig = ENTITY_CONFIGS[entity];
          if (entityConfig) {
            const entityData = await api(entityConfig.apiPrefix, { token: accessToken });
            related[entity] = Array.isArray(entityData) ? entityData : [];
          }
        }
        setRelatedData(related);
      }
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [config, accessToken]);

  useEffect(() => { load(); }, [load]);

  // PERFORMANCE: Auto-refresh every 60 seconds for real-time updates (reduced from 30s)
  useEffect(() => {
    const interval = setInterval(() => { load(); }, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const submitData = { ...formData };
      // Handle unassigned value for user-select
      if (submitData.assignedToUserId === '__unassigned') {
        submitData.assignedToUserId = '';
        submitData.assignedToName = '';
        submitData.status = 'available';
      }
      // Clean up __unassigned for task fields
      if (submitData.assignedTo === '__unassigned') { submitData.assignedTo = ''; submitData.assignedToId = ''; submitData.assigneeId = ''; }
      if (submitData.assignedBy === '__unassigned') { submitData.assignedBy = ''; submitData.assignedById = ''; }
      // Validate meeting scheduling conflicts
      if (entityKey === 'meetings-1on1' && submitData.date && submitData.startTime && submitData.status === 'scheduled') {
        const meetDate = submitData.date;
        const meetStart = submitData.startTime;
        const meetEnd = submitData.endTime || '';
        const userIds = [submitData.organizerId, submitData.participantId].filter(Boolean);

        // Check against existing meetings
        const conflictingMeeting = items.find(m => {
          if (m.id === editItem?.id) return false;
          if (m.status === 'cancelled') return false;
          if (m.date !== meetDate) return false;
          const mUsers = [m.organizerId, m.participantId].filter(Boolean);
          const hasOverlap = userIds.some(uid => mUsers.includes(uid));
          if (!hasOverlap) return false;
          // Time overlap check
          if (meetStart && m.startTime) {
            const mEnd = m.endTime || m.startTime;
            if (meetEnd && m.startTime >= meetEnd) return false;
            if (mEnd && meetStart >= mEnd) return false;
            return true;
          }
          return true; // Same date, same user, assume conflict
        });
        if (conflictingMeeting) {
          const conflictUser = allUsers.find(u => {
            const uid = u.userId || u.id;
            return [conflictingMeeting.organizerId, conflictingMeeting.participantId].includes(uid) &&
              userIds.includes(uid);
          });
          toast.error(`Scheduling conflict: ${conflictUser?.name || 'User'} already has "${conflictingMeeting.title}" scheduled on ${meetDate} at ${conflictingMeeting.startTime}. Choose a different time.`);
          setSaving(false);
          return;
        }

        // Check against approved leaves
        try {
          const leaves = await api('/leave-requests', { token: accessToken });
          const leavesArr = Array.isArray(leaves) ? leaves : [];
          const leaveConflict = leavesArr.find(l => {
            if (l.status !== 'approved') return false;
            const uid = l.userId;
            if (!userIds.includes(uid)) return false;
            if (l.startDate && l.endDate) {
              return meetDate >= l.startDate && meetDate <= l.endDate;
            }
            return l.startDate === meetDate;
          });
          if (leaveConflict) {
            const conflictUser = allUsers.find(u => (u.userId || u.id) === leaveConflict.userId);
            toast.error(`${conflictUser?.name || 'User'} is on approved ${leaveConflict.leaveType || ''} leave from ${leaveConflict.startDate} to ${leaveConflict.endDate}. Cannot schedule meeting.`);
            setSaving(false);
            return;
          }
        } catch (e) { console.log('Leave check error:', e); }
      }

      // Validate asset assignment - an already-assigned asset can't be reassigned to someone else
      // (Multiple assets CAN be assigned to the same user though)
      if (submitData.assignedToUserId && entityKey === 'assets' && !editItem) {
        // Only block if creating a new asset that's somehow already assigned elsewhere — 
        // the server handles this, so no additional frontend check needed.
      }
      if (editItem) {
        await api(`${config.apiPrefix}/${editItem.id}`, { method: 'PUT', body: submitData, token: accessToken });
        toast.success('Updated successfully');
      } else {
        await api(config.apiPrefix, { method: 'POST', body: submitData, token: accessToken });
        toast.success('Created successfully');
      }
      setDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api(`${config.apiPrefix}/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted');
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) { toast.error(e.message); }
  };

  const getDisplayValue = (item: any, field: any) => {
    const val = item[field.key];
    if (!val) return '\u2014';
    if (field.type === 'related-select' && field.relatedEntity) {
      const relItems = relatedData[field.relatedEntity] || [];
      const found = relItems.find(r => r.id === val);
      const name = found?.name || val;
      // Ensure we return a string, not an object
      return typeof name === 'string' ? name : String(name || val);
    }
    if (field.type === 'user-select') {
      const found = allUsers.find(u => (u.userId || u.id) === val);
      const name = found?.name || val;
      // Ensure we return a string, not an object
      return typeof name === 'string' ? name : String(name || val);
    }
    if (field.type === 'user-multi-select') {
      if (Array.isArray(val)) {
        return val.map(uid => {
          const found = allUsers.find(u => (u.userId || u.id) === uid);
          const name = found?.name || uid;
          return typeof name === 'string' ? name : String(name || uid);
        }).join(', ') || '—';
      }
      return String(val);
    }
    if (field.type === 'questions') {
      if (Array.isArray(val)) return `${val.length} question(s)`;
      return '—';
    }
    return typeof val === 'string' ? val : String(val);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const filtered = items
    .filter(item => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return config.fields.some(f => String(item[f.key] || '').toLowerCase().includes(s));
    })
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = String(a[sortField] || '').toLowerCase();
      const bVal = String(b[sortField] || '').toLowerCase();
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const singularTitle = (() => {
    const SINGULAR_MAP: Record<string, string> = {
      'Companies': 'Company', 'Branches': 'Branch', 'Asset Categories': 'Asset Category',
      'Leave Types': 'Leave Type', 'Tax Brackets': 'Tax Bracket', 'Benefit Plans': 'Benefit Plan',
      'Performance Reviews': 'Performance Review', 'Goals & OKRs': 'Goal / OKR',
      'Disciplinary Cases': 'Disciplinary Case', 'Compliance Items': 'Compliance Item',
      'Task Assignments': 'Task Assignment', 'Training Programs': 'Training Program',
      'Workflows & Approvals': 'Workflow / Approval', 'Job Postings': 'Job Posting',
    };
    if (SINGULAR_MAP[config.title]) return SINGULAR_MAP[config.title];
    const t = config.title;
    if (t.endsWith('ies')) return t.slice(0, -3) + 'y';
    if (t.endsWith('ches') || t.endsWith('shes') || t.endsWith('xes') || t.endsWith('ses') || t.endsWith('zes')) return t.slice(0, -2);
    if (t.endsWith('s') && !t.endsWith('ss')) return t.slice(0, -1);
    return t;
  })();

  // Summary stats
  const statusField = config.fields.find(f => f.key === 'status');
  const statusCounts: Record<string, number> = {};
  if (statusField) {
    items.forEach(item => {
      const s = item.status || 'unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
  }

  const statusChartData = Object.entries(statusCounts).map(([name, value], idx) => ({
    id: `status-${name}-${idx}`, name, value, color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{config.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{items.length} record{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => { setEditItem(null); setFormData({}); setOtherTexts({}); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add {singularTitle}</Button>
        </div>
      </div>

      {/* Summary row */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{items.length}</p>
            </CardContent>
          </Card>
          {statusChartData.length > 0 && (
            <Card className="col-span-1 lg:col-span-3">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-4 flex-wrap">
                  {statusChartData.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-sm capitalize">{s.name}: <strong>{s.value}</strong></span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Chart row for entities with status */}
      {statusChartData.length > 1 && items.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base">Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart id="generic-status-pie">
                <Pie key="pie" data={statusChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusChartData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                </Pie>
                <Tooltip key="tooltip" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <CardTitle>{config.title} <span className="text-sm font-normal text-gray-400">({filtered.length})</span></CardTitle>
            </div>
            <ListControls
              searchValue={search}
              onSearchChange={setSearch}
              sortField={sortField}
              sortDir={sortDir}
              sortOptions={config.fields.slice(0, 6).map(f => ({ value: f.key, label: f.label }))}
              onSortChange={setSortField}
              onToggleSortDir={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
              filters={statusField && statusField.options ? [
                {
                  key: 'status',
                  label: 'Status',
                  options: statusField.options.map(o => ({ value: o, label: o })),
                }
              ] : []}
              filterValues={{ status: statusFilter }}
              onFilterChange={(key, value) => setStatusFilter(value)}
              onClearFilters={() => setStatusFilter('all')}
              onExportCSV={() => exportToCSV(filtered.map(item => {
                const row: any = {};
                config.fields.forEach(f => { row[f.label] = getDisplayValue(item, f); });
                return row;
              }), config.title.toLowerCase().replace(/\s+/g, '-'))}
              onExportPDF={() => exportToPDF(config.title, filtered, config.fields.map(f => f.key), branding.companyName)}
              placeholder={`Search ${config.title.toLowerCase()}...`}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400"><p>No {config.title.toLowerCase()} found</p>{(search || statusFilter !== 'all') && <p className="text-xs mt-1">Try adjusting your filters</p>}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {config.fields.slice(0, 6).map(f => (
                      <TableHead key={f.key} className="cursor-pointer select-none hover:bg-gray-50" onClick={() => toggleSort(f.key)}>
                        <span className="inline-flex items-center gap-1">{f.label}
                          {sortField === f.key ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-500" /> : <ArrowDown className="w-3 h-3 text-blue-500" />) : <ArrowUpDown className="w-3 h-3 text-gray-300" />}
                        </span>
                      </TableHead>
                    ))}
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(item => (
                    <TableRow key={item.id}>
                      {config.fields.slice(0, 6).map(f => (
                        <TableCell key={f.key} className={f.key === config.fields[0].key ? 'font-medium' : 'text-sm text-gray-600'}>
                          {f.key === 'status' ? (
                            <Badge className={
                              item[f.key] === 'active' || item[f.key] === 'completed' || item[f.key] === 'compliant' || item[f.key] === 'approved' || item[f.key] === 'paid' || item[f.key] === 'submitted'
                                ? 'bg-green-100 text-green-800'
                                : item[f.key] === 'inactive' || item[f.key] === 'closed' || item[f.key] === 'rejected' || item[f.key] === 'non-compliant' || item[f.key] === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : item[f.key] === 'pending' || item[f.key] === 'draft' || item[f.key] === 'planned' || item[f.key] === 'in-progress' || item[f.key] === 'investigating' || item[f.key] === 'pending-review'
                                ? 'bg-amber-100 text-amber-800'
                                : item[f.key] === 'at-risk' || item[f.key] === 'overdue'
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                            }>{typeof item[f.key] === 'string' ? item[f.key] : String(item[f.key] || '')}</Badge>
                          ) : f.key === 'rating' ? (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: parseInt(item[f.key] || '0') }).map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">{item[f.key]}/5</span>
                            </div>
                          ) : f.key === 'progress' ? (
                            <div className="flex items-center gap-2">
                              <Progress value={parseInt(item[f.key] || '0')} className="h-2 w-20" />
                              <span className="text-xs">{item[f.key]}%</span>
                            </div>
                          ) : (
                            getDisplayValue(item, f)
                          )}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setViewItem(item)}><Eye className="w-3.5 h-3.5 text-gray-500" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                            setEditItem(item);
                            setFormData({ ...item });
                            // Initialize otherTexts for fields whose stored value isn't in predefined options
                            const ot: Record<string, string> = {};
                            config.fields.forEach(f => {
                              if (f.type === 'select' && f.options?.includes('other') && item[f.key] && !f.options.includes(item[f.key])) {
                                ot[f.key] = item[f.key];
                              }
                            });
                            setOtherTexts(ot);
                            setDialogOpen(true);
                          }}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>View {singularTitle}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 py-2">
              {config.fields.map(f => (
                <div key={f.key} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-500 font-medium">{f.label}</span>
                  <span className="text-sm text-right max-w-[60%]">
                    {f.type === 'questions' && Array.isArray(viewItem[f.key]) ? (
                      <div className="text-left space-y-1.5 max-w-full">
                        {viewItem[f.key].map((q: string, idx: number) => (
                          <div key={idx} className="text-xs bg-gray-50 rounded px-2 py-1.5">
                            <span className="text-gray-400 font-mono mr-1">Q{idx + 1}.</span> {q}
                          </div>
                        ))}
                      </div>
                    ) : f.key === 'rating' ? (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: parseInt(viewItem[f.key] || '0') }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    ) : f.key === 'progress' ? (
                      <div className="flex items-center gap-2">
                        <Progress value={parseInt(viewItem[f.key] || '0')} className="h-2 w-20" />
                        <span>{viewItem[f.key]}%</span>
                      </div>
                    ) : (
                      getDisplayValue(viewItem, f) || '\u2014'
                    )}
                  </span>
                </div>
              ))}
              {viewItem.createdAt && (
                <div className="flex justify-between items-start py-2">
                  <span className="text-sm text-gray-500 font-medium">Created</span>
                  <span className="text-sm">{new Date(viewItem.createdAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewItem(null)}>Close</Button>
            <Button onClick={() => {
              setViewItem(null); setEditItem(viewItem); setFormData({ ...viewItem });
              const ot: Record<string, string> = {};
              config.fields.forEach(f => {
                if (f.type === 'select' && f.options?.includes('other') && viewItem[f.key] && !f.options.includes(viewItem[f.key])) {
                  ot[f.key] = viewItem[f.key];
                }
              });
              setOtherTexts(ot);
              setDialogOpen(true);
            }}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editItem ? `Edit ${singularTitle}` : `Add ${singularTitle}`}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              {config.fields.map(field => (
                <div key={field.key} className={field.label.includes('Description') || field.label.includes('Notes') || field.label.includes('Comments') || field.label.includes('Requirements') || field.label.includes('Action Items') || field.label.includes('Agenda') || field.type === 'questions' ? 'col-span-2' : ''}>
                  <Label>{field.label}</Label>
                  {field.type === 'select' ? (
                    <div className="space-y-2">
                      <NativeSelect
                        value={field.options?.includes('other') ? getSelectDisplayValue(field, formData[field.key] || '') : (formData[field.key] || '')}
                        onChange={e => {
                          const v = e.target.value;
                          if (v === 'other') {
                            setFormData({ ...formData, [field.key]: otherTexts[field.key] || 'other' });
                          } else {
                            setFormData({ ...formData, [field.key]: v });
                            setOtherTexts(prev => { const n = { ...prev }; delete n[field.key]; return n; });
                          }
                        }}
                      >
                        <option value="">{`Select ${field.label.toLowerCase()}`}</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </NativeSelect>
                      {field.options?.includes('other') && getSelectDisplayValue(field, formData[field.key] || '') === 'other' && (
                        <Input
                          placeholder={`Specify ${field.label.toLowerCase()}...`}
                          value={otherTexts[field.key] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setOtherTexts(prev => ({ ...prev, [field.key]: val }));
                            setFormData((prev: any) => ({ ...prev, [field.key]: val || 'other' }));
                          }}
                          autoFocus
                        />
                      )}
                    </div>
                  ) : field.type === 'user-select' ? (
                    <NativeSelect value={
                      (field.key === 'assignedTo' || field.key === 'assignedBy')
                        ? (formData[field.key + 'Id'] || (field.key === 'assignedTo' ? formData.assigneeId : '') || (() => { const mu = allUsers.find(u => u.name === formData[field.key]); return mu ? (mu.userId || mu.id) : ''; })() || '')
                        : (formData[field.key] || '')
                    } onChange={e => {
                      const v = e.target.value;
                      const updates: any = { [field.key]: v };
                      // Auto-set status to 'assigned' when a user is selected for assets
                      if (field.key === 'assignedToUserId') {
                        if (v && v !== '__unassigned') {
                          const assignedUser = allUsers.find(u => (u.userId || u.id) === v);
                          updates.assignedToName = assignedUser?.name || '';
                          updates.status = 'assigned';
                        } else {
                          updates.assignedToName = '';
                          updates.status = 'available';
                        }
                      }
                      // For task assignedTo/assignedBy, store the name + also store the userId
                      if (field.key === 'assignedTo' || field.key === 'assignedBy') {
                        if (v === '__unassigned' || !v) {
                          updates[field.key] = '';
                          updates[field.key + 'Id'] = '';
                          if (field.key === 'assignedTo') updates.assigneeId = '';
                        } else {
                          const selectedUser = allUsers.find(u => (u.userId || u.id) === v);
                          if (selectedUser) {
                            updates[field.key] = selectedUser.name;
                            updates[field.key + 'Id'] = v;
                            if (field.key === 'assignedTo') updates.assigneeId = v;
                          }
                        }
                      }
                      // For user-select fields ending in 'Id', also store the name for display
                      if (field.key.endsWith('Id') && field.type === 'user-select' && field.key !== 'assignedToUserId') {
                        const selUser = allUsers.find(u => (u.userId || u.id) === v);
                        const nameKey = field.key.replace(/Id$/, 'Name');
                        updates[nameKey] = (v && v !== '__unassigned' && selUser) ? selUser.name : '';
                      }
                      setFormData({ ...formData, ...updates });
                    }}>
                      <option value="">Select user...</option>
                      <option value="__unassigned">— Unassigned —</option>
                      {allUsers.map(u => {
                        const uid = u.userId || u.id;
                        const isAssetField = field.key === 'assignedToUserId';
                        const assignedCount = isAssetField ? items.filter(i => i[field.key] === uid && i.status === 'assigned' && i.id !== editItem?.id).length : 0;
                        return (
                          <option key={uid} value={uid}>
                            {u.name} ({u.role}){assignedCount > 0 ? ` — ${assignedCount} asset${assignedCount > 1 ? 's' : ''} assigned` : ''}
                          </option>
                        );
                      })}
                    </NativeSelect>
                  ) : field.type === 'user-multi-select' ? (
                    <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-white space-y-1">
                      {allUsers.length === 0 ? (
                        <p className="text-xs text-gray-400 p-2">No users loaded</p>
                      ) : allUsers.map(u => {
                        const uid = u.userId || u.id;
                        const selected = Array.isArray(formData[field.key]) ? formData[field.key].includes(uid) : false;
                        return (
                          <label key={uid} className={`flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-gray-50 ${selected ? 'bg-blue-50' : ''}`}>
                            <input type="checkbox" checked={selected} onChange={() => {
                              const current = Array.isArray(formData[field.key]) ? [...formData[field.key]] : [];
                              const updated = selected ? current.filter(id => id !== uid) : [...current, uid];
                              const names = updated.map(id => { const f = allUsers.find(u => (u.userId || u.id) === id); return f?.name || id; });
                              setFormData({ ...formData, [field.key]: updated, [field.key.replace(/Ids$/, 'Names')]: names });
                            }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="text-sm">{u.name}</span>
                            <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                          </label>
                        );
                      })}
                      <p className="text-[10px] text-gray-400 pt-1 border-t mt-1">{(Array.isArray(formData[field.key]) ? formData[field.key].length : 0)} selected</p>
                    </div>
                  ) : field.type === 'questions' ? (
                    <div className="space-y-2">
                      <div className="border rounded-lg p-3 bg-accent/50 space-y-2 max-h-60 overflow-y-auto">
                        {(Array.isArray(formData[field.key]) && formData[field.key].length > 0 ? formData[field.key] : field.defaultQuestions || []).map((q: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 group">
                            <span className="text-xs text-muted-foreground font-mono mt-2.5 min-w-[20px]">Q{idx + 1}</span>
                            <Input
                              value={q}
                              onChange={e => {
                                const qs = Array.isArray(formData[field.key]) && formData[field.key].length > 0 ? [...formData[field.key]] : [...(field.defaultQuestions || [])];
                                qs[idx] = e.target.value;
                                setFormData({ ...formData, [field.key]: qs });
                              }}
                              className="flex-1 text-sm"
                              placeholder={`Question ${idx + 1}`}
                            />
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 h-9 px-2"
                              onClick={() => {
                                const qs = Array.isArray(formData[field.key]) && formData[field.key].length > 0 ? [...formData[field.key]] : [...(field.defaultQuestions || [])];
                                qs.splice(idx, 1);
                                setFormData({ ...formData, [field.key]: qs });
                              }}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        {(!formData[field.key] || formData[field.key].length === 0) && (!field.defaultQuestions || field.defaultQuestions.length === 0) && (
                          <p className="text-xs text-gray-400 text-center py-3">No questions added yet</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => {
                          const qs = Array.isArray(formData[field.key]) && formData[field.key].length > 0 ? [...formData[field.key]] : [...(field.defaultQuestions || [])];
                          qs.push('');
                          setFormData({ ...formData, [field.key]: qs });
                        }}>
                          <Plus className="w-3.5 h-3.5 mr-1" />Add Question
                        </Button>
                        {Array.isArray(formData[field.key]) && formData[field.key].length > 0 && (
                          <Button type="button" variant="ghost" size="sm" className="text-xs text-gray-400" onClick={() => {
                            setFormData({ ...formData, [field.key]: [...(field.defaultQuestions || [])] });
                          }}>Reset to Defaults</Button>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {(Array.isArray(formData[field.key]) && formData[field.key].length > 0 ? formData[field.key] : field.defaultQuestions || []).length} question(s)
                        </span>
                      </div>
                    </div>
                  ) : field.type === 'related-select' ? (
                    <NativeSelect value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}>
                      <option value="">{`Select ${field.label.toLowerCase()}`}</option>
                      {(relatedData[field.relatedEntity!] || []).map(item => (
                        <option key={item.id} value={item.id}>{typeof item.name === 'string' ? item.name : String(item.name || item.id)}</option>
                      ))}
                    </NativeSelect>
                  ) : field.type === 'date' ? (
                    <Input type="date" value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  ) : field.type === 'date-future' ? (
                    <Input type="date" min={new Date().toISOString().slice(0, 10)} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  ) : field.type === 'time' ? (
                    <Input type="time" value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  ) : field.label.includes('Description') || field.label.includes('Notes') || field.label.includes('Comments') || field.label.includes('Requirements') || field.label.includes('Action Items') || field.label.includes('Agenda') ? (
                    <Textarea value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} rows={3} />
                  ) : (
                    <Input type={field.type || 'text'} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{editItem ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SuperAdminDashboard;
