import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Trophy, Target, TrendingUp, Star, MessageSquare, Award, CheckCircle2, Users, BarChart3, Zap } from 'lucide-react';
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

export default function PerformanceManagementPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Target, title: 'Goal Setting & OKRs', description: 'Set and cascade individual, team, and company goals aligned with strategic objectives.' },
    { icon: Star, title: '360° Performance Reviews', description: 'Conduct structured reviews with customisable templates, ratings, and multi-rater feedback.' },
    { icon: TrendingUp, title: 'Continuous Feedback', description: 'Enable real-time feedback and recognition — no more waiting for the annual review cycle.' },
    { icon: MessageSquare, title: '1-on-1 Meeting Notes', description: 'Schedule, track, and document regular manager check-ins with structured agendas.' },
    { icon: Award, title: 'Recognition & Rewards', description: 'Celebrate wins, nominate peers, and spotlight high performers across your organisation.' },
    { icon: Trophy, title: 'Performance Analytics', description: 'Identify top talent, spot performance gaps, and make data-driven promotion decisions.' },
    { icon: BarChart3, title: 'Rating Calibration', description: 'Standardise ratings across departments to ensure fair, consistent performance evaluations.' },
    { icon: Zap, title: 'Automated Review Cycles', description: 'Schedule and launch review campaigns on a defined cadence — quarterly, biannual, or annual.' },
    { icon: Users, title: 'Team Performance View', description: 'Managers get a clear view of their team\'s progress, completion rates, and top performers.' },
  ];

  const stats = [
    { label: 'Increase in Goal Completion', value: '2×' },
    { label: 'Faster Review Cycles', value: '3×' },
    { label: 'Manager Time Saved/Month', value: '4h+' },
    { label: 'Employee Satisfaction Lift', value: '+28%' },
  ];

  const benefits = [
    'Align every employee to company strategy through OKRs',
    'Replace annual reviews with continuous coaching cycles',
    'Identify high performers before they leave',
    'Create a culture of recognition and growth',
    'Make promotion decisions backed by objective data',
    'Reduce HR admin time with automated review workflows',
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
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-gray-700 tracking-wide">Performance Management</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-mint-black">
                Build a High-<br />
                <span className="relative">
                  Performance Culture
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black/20 rounded-full" />
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Drive employee growth and business results with goal tracking, continuous feedback, and structured performance reviews.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-primary text-white hover:bg-primary/90 text-base px-7 shadow-md font-semibold">
                  Start Free Trial
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

            {/* Performance Visual Panel */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px] rounded-2xl border border-black/10 shadow-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
                <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between" style={{ background: '#7C5A1A' }}>
                  <span className="text-xs font-bold text-white/80">Performance Overview</span>
                  <span className="text-xs text-white/60">Q2 2026</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Goals On Track', val: '76%', color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Reviews Done', val: '89%', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Top Performers', val: '18', color: 'text-purple-600', bg: 'bg-purple-50' },
                    ].map(({ label, val, color, bg }, i) => (
                      <div key={i} className={`rounded-xl p-3 text-center ${bg}`}>
                        <div className={`text-lg font-black ${color}`}>{val}</div>
                        <div className="text-[10px] text-gray-600 font-medium mt-0.5">{label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-black/8 p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-3">Team Performance Ratings</div>
                    {[
                      { name: 'Engineering', rating: 4.5, count: 24 },
                      { name: 'Sales', rating: 4.2, count: 18 },
                      { name: 'Operations', rating: 3.9, count: 31 },
                    ].map((row, i) => (
                      <div key={i} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-700 font-medium">{row.name}</span>
                          <span className="text-xs font-bold text-primary">★ {row.rating}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-primary h-1.5 rounded-full" style={{ width: `${(row.rating / 5) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-amber-800">Q2 Review Cycle Active</div>
                      <div className="text-[10px] text-amber-600">42 of 47 reviews completed</div>
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

      {/* ── FEATURES GRID ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <FadeSection className="text-center mb-14">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Full Performance Suite</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Everything to manage and grow performance</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">Tools for managers and employees that make performance a continuous conversation — not an annual event.</p>
        </FadeSection>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FadeSection key={i} delay={i * 0.06}>
              <div className="group rounded-2xl border border-black/8 p-6 bg-white/85 hover:shadow-xl hover:border-black/15 hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-mint-black mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <FadeSection delay={0.1}>
              <img
                src="https://images.pexels.com/photos/5668853/pexels-photo-5668853.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
                alt="Performance management"
                className="rounded-2xl shadow-xl w-full object-cover"
                style={{ maxHeight: 360 }}
              />
            </FadeSection>
            <FadeSection>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Why It Matters</span>
              <h2 className="text-3xl font-bold mt-3 mb-8 text-mint-black">Performance management that actually works</h2>
              <ul className="space-y-4">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-700">{b}</span>
                  </li>
                ))}
              </ul>
            </FadeSection>
          </div>
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
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Ready to boost performance?</h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">Empower your team to reach their full potential with structured goals, continuous feedback, and recognition.</p>
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
