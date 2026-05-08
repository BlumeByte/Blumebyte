import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { CheckCircle2, Users, BarChart3, Shield, Clock, FileText, Zap, DollarSign, UserCheck, Trophy, ChevronDown, Star, TrendingUp, Award, MessageSquare, BookOpen } from 'lucide-react';
import { HomepageChatAgent } from '../components/HomepageChatAgent';
import { PublicNavbar, PublicFooter } from '../components/PublicNavFooter';

// ─── Scroll-reveal hook ────────────────────────────────────────────────────────
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

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const duration = 1600;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [visible, end]);
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

// ─── Dashboard mockup ─────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div className="relative w-full" style={{ maxWidth: 560 }}>
      {/* Floating orbs behind mockup */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-gray-900/8 blur-3xl" />
      <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-gray-900/5 blur-2xl" />

      {/* Main dashboard card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-2xl border border-black/10 shadow-2xl overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.97)' }}
      >
        {/* Mockup header bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-black/8" style={{ background: '#7C5A1A' }}>
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-3 h-5 rounded bg-white/15 flex items-center px-2">
            <span className="text-[10px] text-white/60">hr.blumebyte.com/dashboard</span>
          </div>
        </div>

        <div className="flex" style={{ minHeight: 320 }}>
          {/* Sidebar */}
          <div className="w-14 border-r border-black/8 flex flex-col items-center py-4 gap-3" style={{ background: '#fafafa' }}>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-white" />
            </div>
            {[Users, Clock, DollarSign, BarChart3, FileText].map((Icon, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${i === 0 ? 'bg-black/10' : 'hover:bg-black/5'}`}>
                <Icon className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 space-y-3">
            {/* KPI row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Employees', val: '124', trend: '+3%', icon: Users },
                { label: 'Attendance', val: '94%', trend: '+1.2%', icon: Clock },
                { label: 'Payroll', val: '$48k', trend: 'this month', icon: DollarSign },
              ].map(({ label, val, trend, icon: Icon }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                  className="rounded-xl p-2.5 border border-black/8"
                  style={{ background: i === 0 ? '#7C5A1A' : '#fafafa' }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-medium ${i === 0 ? 'text-white/70' : 'text-gray-500'}`}>{label}</span>
                    <Icon className={`w-3 h-3 ${i === 0 ? 'text-white/50' : 'text-gray-400'}`} />
                  </div>
                  <div className={`text-sm font-bold ${i === 0 ? 'text-white' : 'text-gray-900'}`}>{val}</div>
                  <div className={`text-[9px] mt-0.5 ${i === 0 ? 'text-green-400' : 'text-gray-400'}`}>{trend}</div>
                </motion.div>
              ))}
            </div>

            {/* Mini chart */}
            <div className="rounded-xl border border-black/8 p-3" style={{ background: '#fafafa' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-700">Headcount Trend</span>
                <span className="text-[9px] text-gray-400">Last 6 months</span>
              </div>
              <svg viewBox="0 0 180 45" className="w-full" style={{ height: 45 }}>
                <polyline
                  points="0,38 30,30 60,32 90,20 120,18 150,10 180,8"
                  fill="none"
                  stroke="#7C5A1A"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="0,38 30,30 60,32 90,20 120,18 150,10 180,8 180,45 0,45"
                  fill="url(#chartGrad)"
                  stroke="none"
                />
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C5A1A" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#7C5A1A" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Employee rows */}
            <div className="rounded-xl border border-black/8 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-black/5" style={{ background: '#fafafa' }}>
                <span className="text-[10px] font-semibold text-gray-600">Recent Activity</span>
              </div>
              {[
                { name: 'Sarah K.', action: 'Leave Approved', time: '2m ago', color: '#16a34a' },
                { name: 'James O.', action: 'Payslip Generated', time: '1h ago', color: '#2563eb' },
                { name: 'Amara D.', action: 'Clocked In', time: '3h ago', color: '#7C5A1A' },
              ].map((row, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2.5 px-3 py-2 border-b border-black/5 last:border-0 bg-white"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                    style={{ background: row.color }}>
                    {row.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium text-gray-800 truncate">{row.name}</div>
                    <div className="text-[9px] text-gray-400">{row.action}</div>
                  </div>
                  <span className="text-[9px] text-gray-400 shrink-0">{row.time}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating notification card */}
      <motion.div
        initial={{ opacity: 0, x: 24, y: -8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute -top-4 -right-4 rounded-xl border border-black/10 shadow-lg px-3 py-2 flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.97)', zIndex: 10 }}
      >
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-gray-800">Payroll Processed</div>
          <div className="text-[9px] text-gray-500">124 employees · $48,200</div>
        </div>
      </motion.div>

      {/* Floating leave card */}
      <motion.div
        initial={{ opacity: 0, x: -24, y: 8 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute -bottom-4 -left-6 rounded-xl border border-black/10 shadow-lg px-3 py-2 flex items-center gap-2"
        style={{ background: 'rgba(255,255,255,0.97)', zIndex: 10 }}
      >
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <div className="text-[10px] font-semibold text-gray-800">Leave Request</div>
          <div className="text-[9px] text-gray-500">3 pending approvals</div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-black/8 rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.85)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left gap-3 hover:bg-black/2 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Section fade wrapper ─────────────────────────────────────────────────────
function FadeSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ${delay}s cubic-bezier(0.22,1,0.36,1), transform 0.55s ${delay}s cubic-bezier(0.22,1,0.36,1)`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Testimonial data ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Aisha Mensah',
    role: 'HR Director',
    company: 'Nexus Technologies',
    quote: 'Blumebyte transformed how we manage our 200-person team. Payroll that used to take 3 days now takes 30 minutes.',
    rating: 5,
  },
  {
    name: 'Kwame Asante',
    role: 'CEO',
    company: 'BuildRight',
    quote: 'The attendance tracking and leave management alone saved us countless hours every month. Incredible platform.',
    rating: 5,
  },
  {
    name: 'Fatima Al-Hassan',
    role: 'Operations Manager',
    company: 'MediCare Solutions',
    quote: 'From recruitment to performance reviews, everything is in one place. Our HR team loves it.',
    rating: 5,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [billingAnnual, setBillingAnnual] = useState(true);

  const pricingPlans = [
    {
      name: 'Monthly',
      price: billingAnnual ? '$5' : '$6',
      period: '/employee/month',
      billingCycle: billingAnnual ? 'Billed annually' : 'Billed monthly',
      description: 'For growing teams',
      features: [
        'People Management',
        'Time & Attendance',
        'Leave Management',
        'Compensation & Payroll',
        'Performance Management',
        'Recruitment & Hiring',
        'Documents & Assets',
        'Reporting & Analytics',
        '24/7 Support',
      ],
    },
    {
      name: 'Business',
      price: billingAnnual ? '$5' : '$6',
      period: '/employee/month',
      billingCycle: billingAnnual ? 'Billed annually · Save 17%' : 'Billed monthly',
      description: 'Best value for scale',
      popular: true,
      savings: billingAnnual ? 'Save 17%' : undefined,
      features: [
        'Everything in Monthly',
        'Advanced Analytics',
        'Custom Workflows',
        'Priority Support',
        'Employee Self-Service Portal',
        'Learning & Development',
        'System Administration',
        'Communication Tools',
        'Quarterly Business Reviews',
      ],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      billingCycle: 'Tailored pricing',
      description: 'For large organizations',
      features: [
        'Everything in Business',
        'Custom Integrations',
        'Dedicated Account Manager',
        'White-label Options',
        'Advanced Security',
        'Custom SLA',
        'On-site Onboarding',
      ],
      contactLink: 'https://blumebyte.com/contact/',
    },
  ];

  const faqs = [
    { q: 'How is pricing calculated?', a: 'Pricing is per active employee per month. The minimum purchase is 2 licenses. Annual billing gives you 17% off.' },
    { q: 'Is there a free trial?', a: 'Yes — get full access to all features for 14 days with no credit card required.' },
    { q: 'Can I upgrade or downgrade my plan?', a: 'Absolutely. You can change plans at any time; adjustments take effect at the next billing cycle.' },
    { q: 'What payment methods are accepted?', a: 'We accept all major credit cards and bank transfers via Paystack.' },
    { q: 'How quickly can we get started?', a: 'Most companies are live within a day. Our guided onboarding walks you through every step.' },
    { q: 'Is our data secure?', a: 'Yes. We use bank-level encryption, role-based access control, and comply with global data protection standards.' },
  ];

  const benefitCards = [
    {
      icon: Users,
      title: 'Employee Management',
      description: 'Centralise profiles, org charts, documents, and lifecycle events in one powerful view.',
    },
    {
      icon: DollarSign,
      title: 'Payroll Automation',
      description: 'Run accurate payroll in minutes — deductions, taxes, and payslips handled automatically.',
    },
    {
      icon: Clock,
      title: 'Attendance Tracking',
      description: 'Real-time clock in/out, shift scheduling, and overtime calculation at your fingertips.',
    },
    {
      icon: UserCheck,
      title: 'Recruitment System',
      description: 'Source, screen, and hire top talent with a built-in applicant tracking pipeline.',
    },
  ];

  const bentoFeatures = [
    { icon: Users, title: 'Employee Profiles', description: 'Rich employee records with history, documents, and org chart view', size: 'large' },
    { icon: FileText, title: 'Leave Management', description: 'Multi-level approvals, real-time balances', size: 'small' },
    { icon: DollarSign, title: 'Payroll', description: 'Automated calculations & payslips', size: 'small' },
    { icon: Trophy, title: 'Performance Reviews', description: 'Goal tracking, 360° feedback, and appraisal cycles', size: 'large' },
    { icon: UserCheck, title: 'Recruitment', description: 'Job postings and applicant pipeline', size: 'small' },
    { icon: BookOpen, title: 'Documents', description: 'Secure storage for all HR files', size: 'small' },
    { icon: MessageSquare, title: 'Messaging', description: 'Built-in team communication', size: 'small' },
    { icon: BarChart3, title: 'Reports & Analytics', description: 'Data-driven HR insights and exportable reports', size: 'large' },
  ];

  return (
    <div className="min-h-screen public-page-bg overflow-x-hidden">
      <PublicNavbar />

      {/* ── 1. HERO ── */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-[0.04] blur-3xl" style={{ background: '#7C5A1A' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-[0.03] blur-3xl" style={{ background: '#444' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: copy */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-7"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 backdrop-blur px-4 py-1.5 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-semibold text-gray-700 tracking-wide">Trusted by 20+ businesses across Africa</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-mint-black">
                Modern HR Management<br />
                <span className="relative">
                  for Growing Teams
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black/20 rounded-full" />
                </span>
              </h1>

              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Manage employees, payroll, attendance, recruitment, performance, and operations — all in one intelligent platform.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Button
                  size="lg"
                  onClick={() => navigate('/company-signup')}
                  className="bg-primary text-white hover:bg-primary/90 text-base px-7 shadow-md font-semibold"
                >
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.open('https://blumebyte.com/contact/', '_blank')}
                  className="border-black/20 bg-white text-gray-800 hover:bg-gray-50 text-base px-7 font-semibold"
                >
                  Book a Demo
                </Button>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card needed</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 99.9% uptime SLA</span>
              </div>
            </motion.div>

            {/* Right: dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <DashboardMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. TRUSTED BY ── */}
      <FadeSection className="border-y border-black/6 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Trusted by teams across industries</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {['Nexus Technologies', 'BuildRight', 'MediCare Solutions', 'Alpha Finance', 'EduTrack', 'LogiCo'].map((name) => (
              <span key={name} className="text-sm font-bold text-gray-300 tracking-wide select-none hover:text-gray-400 transition-colors">{name}</span>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* ── 3. CORE BENEFITS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection className="text-center mb-14">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Why Blumebyte</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Everything your HR team needs</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Four pillars that power modern HR operations, built for speed and clarity.</p>
        </FadeSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefitCards.map((card, i) => (
            <FadeSection key={i} delay={i * 0.08}>
              <div className="group rounded-2xl border border-black/8 p-6 bg-white/85 hover:shadow-xl hover:border-black/15 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-mint-black mb-2">{card.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── 4. STATS ── */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-mint-black">The numbers speak for themselves</h2>
          </FadeSection>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Employees Managed Daily', value: 500, suffix: '+', prefix: '' },
              { label: 'Businesses Onboarded', value: 20, suffix: '+', prefix: '' },
              { label: 'Uptime Guaranteed', value: 99, suffix: '.9%', prefix: '' },
              { label: 'Hours Saved per Month', value: 40, suffix: 'h+', prefix: '~' },
            ].map(({ label, value, suffix, prefix }, i) => (
              <FadeSection key={i} delay={i * 0.08} className="text-center">
                <div className="text-4xl md:text-5xl font-black text-mint-black mb-2 tabular-nums">
                  <AnimatedCounter end={value} suffix={suffix} prefix={prefix} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. FEATURES BENTO GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection className="text-center mb-14">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Full Platform</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Every module you need, beautifully unified</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">From onboarding to offboarding — manage the complete employee journey.</p>
        </FadeSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bentoFeatures.map((feat, i) => (
            <FadeSection key={i} delay={i * 0.06}
              className={feat.size === 'large' ? 'sm:col-span-2 lg:col-span-1' : ''}
            >
              <div className={`group rounded-2xl border border-black/8 bg-white/85 hover:shadow-lg hover:border-black/15 hover:-translate-y-0.5 transition-all duration-300 p-6 ${feat.size === 'large' ? 'min-h-[160px]' : 'min-h-[130px]'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:scale-105 transition-all duration-300">
                    <feat.icon className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <h3 className="font-bold text-mint-black mb-1">{feat.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              </div>
            </FadeSection>
          ))}
        </div>

        <FadeSection className="text-center mt-10">
          <Button variant="outline" onClick={() => navigate('/features')} className="border-black/20 text-gray-700 hover:bg-gray-50 px-7">
            View All Features →
          </Button>
        </FadeSection>
      </section>

      {/* ── 6. WHY BLUMEBYTE ── */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-mint-black mb-4">Built for reliability & scale</h2>
            <p className="text-lg text-gray-500">Enterprise-grade infrastructure with simplicity at the forefront.</p>
          </FadeSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: TrendingUp, title: 'Real-time Analytics', description: 'Live dashboards and instant reports at every level.' },
              { icon: Shield, title: 'Secure Infrastructure', description: 'Bank-level encryption, 2FA, and SOC 2-aligned controls.' },
              { icon: Zap, title: 'Fast Implementation', description: 'Most customers go live in under 24 hours.' },
              { icon: Award, title: 'Multi-tenant Architecture', description: 'Perfect isolation and scalability for every organisation.' },
            ].map(({ icon: Icon, title, description }, i) => (
              <FadeSection key={i} delay={i * 0.08}>
                <div className="rounded-2xl border border-black/8 bg-white/85 p-6 h-full hover:shadow-md transition-shadow duration-300">
                  <div className="w-10 h-10 rounded-xl border border-black/8 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-bold text-mint-black mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. TESTIMONIALS ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection className="text-center mb-14">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer Stories</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Loved by HR teams everywhere</h2>
        </FadeSection>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <FadeSection key={i} delay={i * 0.1}>
                <div className={`rounded-2xl border p-6 h-full flex flex-col bg-white/90 transition-all duration-300 hover:shadow-lg ${i === testimonialIdx ? 'border-black/20 shadow-md' : 'border-black/8'}`}
                  onClick={() => setTestimonialIdx(i)} style={{ cursor: 'pointer' }}>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, s) => (
                      <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed flex-1 mb-5">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-mint-black">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role} · {t.company}</div>
                    </div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>

          {/* Mobile carousel dots */}
          <div className="flex justify-center gap-2 mt-8 md:hidden">
            {TESTIMONIALS.map((t, i) => (
              <button
                key={i}
                aria-label={`View testimonial ${i + 1}`}
                onClick={() => setTestimonialIdx(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === testimonialIdx ? 'w-6 bg-primary' : 'w-3 bg-black/20'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. PRICING ── */}
      <section id="pricing" className="section-mint py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection className="text-center mb-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Simple, transparent pricing</h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">No hidden fees. Pay only for what you use.</p>
          </FadeSection>

          {/* Toggle */}
          <FadeSection className="flex justify-center items-center gap-4 mb-12 mt-8">
            <span className={`text-sm font-medium ${!billingAnnual ? 'text-mint-black' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setBillingAnnual(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${billingAnnual ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${billingAnnual ? 'left-7' : 'left-1'}`} />
            </button>
            <span className={`text-sm font-medium flex items-center gap-1.5 ${billingAnnual ? 'text-mint-black' : 'text-gray-400'}`}>
              Annual
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full">Save 17%</span>
            </span>
          </FadeSection>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan, index) => (
              <FadeSection key={index} delay={index * 0.1} className="relative">
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                    <span className="px-4 py-1 bg-primary text-white text-xs font-bold rounded-full shadow">Most Popular</span>
                  </div>
                )}
                <div className={`rounded-2xl border p-7 flex flex-col h-full transition-all duration-300 ${plan.popular ? 'border-black bg-primary text-white shadow-2xl scale-105' : 'border-black/10 bg-white/90 hover:shadow-lg'}`}>
                  <div className="mb-6">
                    <h3 className={`text-lg font-bold mb-1 ${plan.popular ? 'text-white' : 'text-mint-black'}`}>{plan.name}</h3>
                    <p className={`text-sm mb-4 ${plan.popular ? 'text-white/70' : 'text-gray-500'}`}>{plan.description}</p>
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-black ${plan.popular ? 'text-white' : 'text-mint-black'}`}>{plan.price}</span>
                      {plan.period && <span className={`text-sm mb-1.5 ${plan.popular ? 'text-white/60' : 'text-gray-500'}`}>{plan.period}</span>}
                    </div>
                    <p className={`text-xs mt-1 ${plan.popular ? 'text-white/60' : 'text-gray-400'}`}>{plan.billingCycle}</p>
                  </div>

                  <ul className="space-y-2.5 flex-1 mb-7">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.popular ? 'text-white/80' : 'text-green-600'}`} />
                        <span className={`text-sm ${plan.popular ? 'text-white/85' : 'text-gray-600'}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.contactLink ? (
                    <Button
                      className={`w-full font-semibold ${plan.popular ? 'bg-white text-black hover:bg-gray-100' : 'border-black/20 hover:bg-gray-50'}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => window.open(plan.contactLink, '_blank')}
                    >
                      Contact Sales
                    </Button>
                  ) : (
                    <Button
                      className={`w-full font-semibold ${plan.popular ? 'bg-white text-black hover:bg-gray-100' : 'bg-primary text-white hover:bg-primary/90'}`}
                      onClick={() => navigate('/company-signup')}
                    >
                      {plan.popular ? 'Get Started Free' : 'Start Free Trial'}
                    </Button>
                  )}
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FAQ ── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-mint-black mb-4">Frequently asked questions</h2>
          <p className="text-gray-500">Can't find the answer you're looking for? <button className="underline text-mint-black font-medium" onClick={() => window.open('https://blumebyte.com/contact/', '_blank')}>Contact us</button></p>
        </FadeSection>
        <FadeSection className="space-y-3">
          {faqs.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </FadeSection>
      </section>

      {/* ── 10. FINAL CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <FadeSection>
          <div className="relative overflow-hidden rounded-3xl bg-primary shadow-2xl px-8 py-16 md:py-20 text-center">
            {/* subtle gradient overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
            {/* floating circles */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#fff', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 blur-3xl" style={{ background: '#fff', transform: 'translate(-30%, 30%)' }} />

            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Transform Your HR<br />Operations Today
              </h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">
                Join 20+ businesses using Blumebyte to manage their teams smarter, faster, and at scale.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate('/company-signup')}
                  className="bg-white text-black hover:bg-gray-100 text-base px-8 shadow-lg font-bold"
                >
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => window.open('https://blumebyte.com/contact/', '_blank')}
                  className="border-white/30 bg-transparent text-white hover:bg-white/10 text-base px-8 font-semibold"
                >
                  Contact Sales
                </Button>
              </div>
              <p className="text-xs text-white/40 pt-1">No credit card required · 14-day free trial · Cancel anytime</p>
            </div>
          </div>
        </FadeSection>
      </section>

      <PublicFooter />
      <HomepageChatAgent />
    </div>
  );
}
