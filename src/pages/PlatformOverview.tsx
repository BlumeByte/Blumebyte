import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Users, BarChart3, Clock, DollarSign, Trophy, UserCheck, Shield, Zap, FileText, Calendar, Award, CheckCircle2, TrendingUp, Star, Target } from 'lucide-react';
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

export default function PlatformOverview() {
  const navigate = useNavigate();

  const modules = [
    { icon: Users, title: 'Employee Management', description: 'Complete employee lifecycle — profiles, org charts, departments, and role-based access.', features: ['Employee profiles & history', 'Org chart visualisation', 'Department & role management', '4-tier access control'] },
    { icon: Clock, title: 'Time & Attendance', description: 'Track hours, manage shifts, and monitor attendance from any device, anywhere.', features: ['Clock in/out (web & mobile)', 'Shift & schedule management', 'GPS geofencing', 'Overtime & break compliance'] },
    { icon: FileText, title: 'Leave Management', description: 'Streamline leave requests, multi-level approvals, and real-time balance tracking.', features: ['Leave requests & approvals', 'Custom leave policies', 'Real-time balance tracking', 'Leave calendar view'] },
    { icon: DollarSign, title: 'Payroll', description: 'Automated, accurate payroll processing with tax compliance and digital payslips.', features: ['Automated calculations', 'Tax compliance & deductions', 'Digital payslip generation', 'Direct deposit support'] },
    { icon: Trophy, title: 'Performance Management', description: 'Goal tracking, 360° reviews, and continuous feedback to drive employee growth.', features: ['OKR & goal setting', '360° performance reviews', 'Continuous feedback', 'Performance analytics'] },
    { icon: UserCheck, title: 'Recruitment & ATS', description: 'Attract, screen, and hire top talent with a full applicant tracking system.', features: ['Job posting & pipeline', 'Candidate communication', 'Interview scheduling', 'Offer letter automation'] },
    { icon: Award, title: 'Compensation', description: 'Manage pay grades, bonuses, and ensure competitive, equitable compensation.', features: ['Pay grades & bands', 'Merit increase planning', 'Bonus management', 'Pay equity analysis'] },
    { icon: BarChart3, title: 'Analytics & Reports', description: 'Real-time dashboards and custom reports for data-driven HR decisions.', features: ['Custom report builder', 'HR dashboards', 'Workforce analytics', 'CSV / PDF export'] },
    { icon: Shield, title: 'Security & Compliance', description: 'Enterprise-grade protection with 2FA, audit logs, and encrypted data storage.', features: ['2FA authentication', 'Full audit trail', 'Row-level security', 'Data encryption'] },
  ];

  const stats = [
    { label: 'HR Modules', value: '11+' },
    { label: 'Features Available', value: '100+' },
    { label: 'Uptime Guaranteed', value: '99.9%' },
    { label: 'Businesses Onboarded', value: '20+' },
  ];

  const pillars = [
    { icon: Zap, title: 'Fast Implementation', description: 'Most companies are live within 24 hours. Guided onboarding, no engineering required.' },
    { icon: Shield, title: 'Enterprise Security', description: 'Bank-level encryption, 2FA, SOC 2-aligned controls, and role-based permissions.' },
    { icon: TrendingUp, title: 'Scales with You', description: 'From 2 to 2,000 employees — Blumebyte grows with your business without changing tools.' },
    { icon: Star, title: 'Dedicated Support', description: 'Real humans available to help your team succeed, not just a knowledge base.' },
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
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-gray-700 tracking-wide">Platform Overview</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-mint-black">
                One Platform.<br />
                <span className="relative">
                  Your Entire HR.
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black/20 rounded-full" />
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Blumebyte brings together every HR function — employees, payroll, time, performance, recruitment, and analytics — in a single, beautifully unified platform.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-primary text-white hover:bg-primary/90 text-base px-7 shadow-md font-semibold">
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/pricing')} className="border-black/20 bg-white text-gray-800 hover:bg-gray-50 text-base px-7 font-semibold">
                  View Pricing
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card needed</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Cancel anytime</span>
              </div>
            </motion.div>

            {/* Platform Overview Panel */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px] rounded-2xl border border-black/10 shadow-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
                <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between" style={{ background: '#7C5A1A' }}>
                  <span className="text-xs font-bold text-white/80">Platform Modules</span>
                  <span className="text-xs text-white/60">hr.blumebyte.com</span>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { icon: Users, label: 'Employee Management', status: 'Active', color: 'text-green-600 bg-green-50' },
                    { icon: DollarSign, label: 'Payroll Processing', status: 'Active', color: 'text-green-600 bg-green-50' },
                    { icon: Clock, label: 'Time & Attendance', status: 'Active', color: 'text-green-600 bg-green-50' },
                    { icon: FileText, label: 'Leave Management', status: 'Active', color: 'text-green-600 bg-green-50' },
                    { icon: Trophy, label: 'Performance Reviews', status: 'Active', color: 'text-green-600 bg-green-50' },
                    { icon: UserCheck, label: 'Recruitment / ATS', status: 'Active', color: 'text-green-600 bg-green-50' },
                    { icon: BarChart3, label: 'Analytics & Reports', status: 'Active', color: 'text-green-600 bg-green-50' },
                  ].map(({ icon: Icon, label, status, color }, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-gray-800">{label}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color}`}>{status}</span>
                    </div>
                  ))}
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

      {/* ── MODULE GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection className="text-center mb-14">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">All-in-One HR Solution</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Every module you need, beautifully unified</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">From onboarding to offboarding — manage the complete employee journey without switching between tools.</p>
        </FadeSection>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <FadeSection key={i} delay={i * 0.06}>
              <div className="group rounded-2xl border border-black/8 p-6 bg-white/85 hover:shadow-xl hover:border-black/15 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <mod.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-mint-black mb-2">{mod.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{mod.description}</p>
                <ul className="space-y-1.5">
                  {mod.features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── PILLARS ── */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeSection className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-mint-black mb-4">Built for reliability & scale</h2>
            <p className="text-lg text-gray-500">Enterprise-grade infrastructure with the simplicity every team deserves.</p>
          </FadeSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map(({ icon: Icon, title, description }, i) => (
              <FadeSection key={i} delay={i * 0.08}>
                <div className="rounded-2xl border border-black/8 bg-white/85 p-6 h-full hover:shadow-md transition-shadow duration-300">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-mint-black mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHOTO SECTION ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <FadeSection>
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <img
              src="https://images.pexels.com/photos/5716030/pexels-photo-5716030.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
              alt="HR team using Blumebyte"
              className="rounded-2xl shadow-xl w-full object-cover"
              style={{ maxHeight: 380 }}
            />
            <div className="space-y-6">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Why Teams Choose Blumebyte</span>
              <h2 className="text-3xl font-bold text-mint-black">Everything in one place, nothing left behind</h2>
              <p className="text-gray-600 leading-relaxed">HR teams spend less time managing tools and more time supporting people. Blumebyte eliminates the data silos, spreadsheets, and disconnected systems that slow modern HR down.</p>
              <ul className="space-y-3">
                {[
                  'One login for your entire HR operation',
                  'Real-time data across every module',
                  'No per-module pricing surprises',
                  'Trusted by 20+ businesses across Africa',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeSection>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection>
          <div className="relative overflow-hidden rounded-3xl bg-primary shadow-2xl px-8 py-16 md:py-20 text-center">
            <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)' }} />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: '#fff', transform: 'translate(30%, -30%)' }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5 blur-3xl" style={{ background: '#fff', transform: 'translate(-30%, 30%)' }} />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Ready to get started?</h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">Join hundreds of companies using Blumebyte to transform how they manage their people and operations.</p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100 text-base px-8 shadow-lg font-bold">Start Free Trial</Button>
                <Button size="lg" variant="outline" onClick={() => window.open('https://blumebyte.com/contact/', '_blank')} className="border-white/30 bg-transparent text-white hover:bg-white/10 text-base px-8 font-semibold">Contact Sales</Button>
              </div>
              <p className="text-xs text-white/40 pt-1">No credit card required · 14-day free trial · Cancel anytime</p>
            </div>
          </div>
        </FadeSection>
      </section>

      <PublicFooter />
    </div>
  );
}
