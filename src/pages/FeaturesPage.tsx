import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Users, Clock, FileText, DollarSign, Trophy, UserCheck, Award, BarChart3, Shield, Zap, Bell, BookOpen, Calendar, Gift, MessageSquare, Settings, Globe, Briefcase, Target, CheckCircle2 } from 'lucide-react';
import { PublicNavbar, PublicFooter } from '../components/PublicNavFooter';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function FadeSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: `opacity 0.5s ${delay}s ease, transform 0.5s ${delay}s ease` }}>
      {children}
    </div>
  );
}

export default function FeaturesPage() {
  const navigate = useNavigate();

  const featureCategories = [
    {
      category: 'People Management',
      description: 'Complete employee lifecycle management',
      icon: Users,
      features: [
        { name: 'Employee Profiles', description: 'Comprehensive employee information and documents' },
        { name: 'Organization Charts', description: 'Visual hierarchy and reporting structures' },
        { name: 'Department Management', description: 'Organize teams and departments efficiently' },
        { name: 'Role-Based Access', description: '4-tier permission system (SuperAdmin, Admin, Manager, Employee)' },
      ],
    },
    {
      category: 'Time & Attendance',
      description: 'Track work hours with precision',
      icon: Clock,
      features: [
        { name: 'Clock In/Out', description: 'Simple time tracking for employees' },
        { name: 'Shift Management', description: 'Create and manage work schedules' },
        { name: 'Overtime Tracking', description: 'Automatic overtime calculation' },
        { name: 'Real-time Monitoring', description: 'Live attendance dashboard' },
      ],
    },
    {
      category: 'Leave Management',
      description: 'Streamline leave requests and approvals',
      icon: FileText,
      features: [
        { name: 'Leave Requests', description: 'Easy submission and tracking' },
        { name: 'Approval Workflows', description: 'Multi-level approval process' },
        { name: 'Leave Balance', description: 'Real-time balance tracking' },
        { name: 'Calendar Integration', description: 'Visual leave calendar' },
      ],
    },
    {
      category: 'Compensation & Payroll',
      description: 'Accurate payroll processing',
      icon: DollarSign,
      features: [
        { name: 'Payroll Processing', description: 'Automated payroll calculations' },
        { name: 'Pay Slips', description: 'Digital payslip generation' },
        { name: 'Salary Grades', description: 'Manage pay grades and scales' },
        { name: 'Bonus Management', description: 'Track and process bonuses' },
      ],
    },
    {
      category: 'Performance Management',
      description: 'Drive employee performance',
      icon: Trophy,
      features: [
        { name: 'Performance Reviews', description: 'Structured review process' },
        { name: 'Goal Setting', description: 'Set and track employee goals' },
        { name: '360° Feedback', description: 'Comprehensive feedback system' },
        { name: 'Performance Analytics', description: 'Track performance trends' },
      ],
    },
    {
      category: 'Recruitment & Onboarding',
      description: 'Hire and onboard efficiently',
      icon: UserCheck,
      features: [
        { name: 'Applicant Tracking', description: 'Manage job applications' },
        { name: 'Interview Scheduling', description: 'Coordinate interviews seamlessly' },
        { name: 'Onboarding Workflows', description: 'Automated onboarding process' },
        { name: 'Document Collection', description: 'Digital document submission' },
      ],
    },
    {
      category: 'Learning & Development',
      description: 'Invest in employee growth',
      icon: BookOpen,
      features: [
        { name: 'Training Programs', description: 'Manage training initiatives' },
        { name: 'Certification Tracking', description: 'Track employee certifications' },
        { name: 'Course Management', description: 'Create and assign courses' },
        { name: 'Skill Development', description: 'Track skill development' },
      ],
    },
    {
      category: 'Communication',
      description: 'Keep your team connected',
      icon: MessageSquare,
      features: [
        { name: 'Announcements', description: 'Company-wide announcements' },
        { name: 'Team Messaging', description: 'Internal communication' },
        { name: 'Notifications', description: 'Real-time alerts and updates' },
        { name: 'Employee Directory', description: 'Searchable employee directory' },
      ],
    },
    {
      category: 'Analytics & Reporting',
      description: 'Data-driven insights',
      icon: BarChart3,
      features: [
        { name: 'HR Dashboards', description: 'Visual analytics dashboards' },
        { name: 'Custom Reports', description: 'Build custom reports' },
        { name: 'Workforce Analytics', description: 'Comprehensive workforce insights' },
        { name: 'Export Capabilities', description: 'Export data in multiple formats' },
      ],
    },
    {
      category: 'Security & Compliance',
      description: 'Enterprise-grade protection',
      icon: Shield,
      features: [
        { name: '2FA Authentication', description: 'Two-factor authentication' },
        { name: 'Audit Logs', description: 'Complete activity tracking' },
        { name: 'Data Encryption', description: 'Bank-level encryption' },
        { name: 'Row Level Security', description: 'Multi-tenant data isolation' },
      ],
    },
    {
      category: 'System Administration',
      description: 'Configure and customize',
      icon: Settings,
      features: [
        { name: 'Custom Branding', description: 'White-label customization' },
        { name: 'User Management', description: 'Manage users and permissions' },
        { name: 'Integration Settings', description: 'Configure integrations' },
        { name: 'Backup & Restore', description: 'Data backup and recovery' },
      ],
    },
  ];

  const stats = [
    { label: 'Features', value: '100+' },
    { label: 'HR Modules', value: '11' },
    { label: 'Access Tiers', value: '4' },
    { label: 'Uptime', value: '99.9%' },
  ];

  const platformStats = [
    { label: '11 Modules', sub: 'End-to-end HR coverage', color: 'text-blue-600' },
    { label: '100+ Features', sub: 'Built for every use case', color: 'text-purple-600' },
    { label: '4-Tier Access', sub: 'Role-based permissions', color: 'text-orange-600' },
    { label: '99.9% Uptime', sub: 'Enterprise reliability', color: 'text-green-600' },
  ];

  return (
    <div className="min-h-screen public-page-bg overflow-x-hidden">
      <PublicNavbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.04] blur-3xl" style={{ background: '#7C5A1A' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-[0.03] blur-3xl" style={{ background: '#444' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 backdrop-blur px-4 py-1.5 shadow-sm">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-gray-700 tracking-wide">Platform Features</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-mint-black">
                Powerful Features<br />
                <span className="relative">
                  for Modern HR
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black/20 rounded-full" />
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Everything you need to manage your workforce efficiently. From employee management to advanced analytics, all in one platform.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-primary text-white hover:bg-primary/90 text-base px-7 shadow-md font-semibold">
                  Start Now
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="border-black/20 bg-white text-gray-800 hover:bg-gray-50 text-base px-7 font-semibold">
                  View Pricing
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-gray-500 font-medium">
              </div>
            </motion.div>

            {/* Platform Features Visual Panel */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px] rounded-2xl border border-black/10 shadow-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
                <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between" style={{ background: '#7C5A1A' }}>
                  <span className="text-xs font-bold text-white/80">Platform Overview</span>
                  <span className="text-xs text-white/60">hr.blumebyte.com</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {platformStats.map(({ label, sub, color }, i) => (
                      <div key={i} className="rounded-xl bg-gray-50 p-3">
                        <div className={`text-lg font-black ${color}`}>{label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-black/8 p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Module Coverage</div>
                    <div className="space-y-1.5">
                      {['People & Payroll', 'Time & Leave', 'Performance', 'Recruitment'].map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span className="text-xs text-gray-600">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="section-mint py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ label, value }, i) => (
              <FadeSection key={i} delay={i * 0.08} className="text-center">
                <div className="text-3xl md:text-4xl font-black text-mint-black mb-2">{value}</div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE CATEGORIES ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection className="text-center mb-14">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">All Modules</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Every HR tool you need, in one platform</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Eleven modules covering the full employee lifecycle — from hire to retire.</p>
        </FadeSection>
        <div className="grid md:grid-cols-2 gap-6">
          {featureCategories.map((cat, i) => (
            <FadeSection key={i} delay={(i % 4) * 0.07}>
              <div className="group rounded-2xl border border-black/8 p-6 bg-white/85 hover:shadow-xl hover:border-black/15 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    <cat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-mint-black text-lg">{cat.category}</h3>
                    <p className="text-sm text-gray-500">{cat.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {cat.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{f.name}</span>
                        <span className="text-xs text-gray-500 ml-1.5">— {f.description}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection>
          <div className="relative overflow-hidden rounded-3xl bg-primary shadow-2xl px-8 py-16 md:py-20 text-center">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#fff', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 blur-3xl" style={{ background: '#fff', transform: 'translate(-30%, 30%)' }} />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">See all features in action</h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">Get started with Blumebyte today and transform your HR operations with 100+ powerful features.</p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100 text-base px-8 shadow-lg font-bold">Start Now</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="border-white/30 bg-transparent text-white hover:bg-white/10 text-base px-8 font-semibold">View Pricing</Button>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      <PublicFooter />
    </div>
  );
}
