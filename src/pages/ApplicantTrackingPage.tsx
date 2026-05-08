import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { UserCheck, Users, Briefcase, FileText, Calendar, MessageSquare, CheckCircle2, Target, BarChart3, Zap } from 'lucide-react';
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

export default function ApplicantTrackingPage() {
  const navigate = useNavigate();

  const features = [
    { icon: Briefcase, title: 'Multi-Board Job Posting', description: 'Post openings to major job boards with one click and consolidate all applications.' },
    { icon: Users, title: 'Candidate Pipeline', description: 'Track candidates through every stage from application to offer with drag-and-drop.' },
    { icon: Calendar, title: 'Interview Scheduling', description: 'Coordinate interviews with automated scheduling, reminders, and calendar sync.' },
    { icon: FileText, title: 'Resume Parsing', description: 'Automatically extract and organise candidate information from uploaded resumes.' },
    { icon: MessageSquare, title: 'Candidate Communication', description: 'Send templated emails, keep candidates informed, and log all correspondence.' },
    { icon: UserCheck, title: 'Collaborative Hiring', description: 'Collect structured feedback, scorecards, and team votes on every candidate.' },
    { icon: Target, title: 'Job Requisition Management', description: 'Control headcount approvals and budget before a single job goes live.' },
    { icon: BarChart3, title: 'Hiring Analytics', description: 'Track time-to-hire, source quality, pipeline conversion, and cost-per-hire.' },
    { icon: Zap, title: 'Offer Letter Automation', description: 'Generate, send, and track signed offer letters without leaving the platform.' },
  ];

  const stats = [
    { label: 'Reduction in Time-to-Hire', value: '40%' },
    { label: 'Candidate Pipeline Visibility', value: '100%' },
    { label: 'Interview No-Shows Reduced', value: '-35%' },
    { label: 'Hiring Team Hours Saved', value: '8h/wk' },
  ];

  const benefits = [
    'Centralise every application in one place',
    'Automate repetitive recruiter communication',
    'Make faster decisions with structured scorecards',
    'Track diversity and inclusion across hiring stages',
    'Reduce time-to-hire with automated scheduling',
    'Get full analytics on every recruitment source',
  ];

  const pipelineStages = [
    { label: 'Applied', count: 47, color: 'bg-blue-500', textColor: 'text-blue-600', bgLight: 'bg-blue-50' },
    { label: 'Screening', count: 23, color: 'bg-purple-500', textColor: 'text-purple-600', bgLight: 'bg-purple-50' },
    { label: 'Interview', count: 12, color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50' },
    { label: 'Offer', count: 4, color: 'bg-yellow-500', textColor: 'text-yellow-600', bgLight: 'bg-yellow-50' },
    { label: 'Hired', count: 3, color: 'bg-green-500', textColor: 'text-green-600', bgLight: 'bg-green-50' },
  ];

  const recentApps = [
    { name: 'Alex M.', role: 'Frontend Engineer', time: '2h ago' },
    { name: 'Priya S.', role: 'Product Manager', time: '5h ago' },
    { name: 'Tom R.', role: 'Data Analyst', time: '1d ago' },
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
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-gray-700 tracking-wide">Applicant Tracking System</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-mint-black">
                Hire Faster,<br />
                <span className="relative">
                  Hire Better
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black/20 rounded-full" />
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Manage every stage of your hiring process — from job posting to signed offer letter — in one streamlined applicant tracking system.
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

            {/* Hiring Pipeline Visual Panel */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px] rounded-2xl border border-black/10 shadow-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
                <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between" style={{ background: '#7C5A1A' }}>
                  <span className="text-xs font-bold text-white/80">Hiring Pipeline</span>
                  <span className="text-xs text-white/60">hr.blumebyte.com</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    {pipelineStages.map((stage, i) => (
                      <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${stage.bgLight}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                          <span className="text-xs font-medium text-gray-700">{stage.label}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white ${stage.textColor}`}>{stage.count} candidates</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-black/8 p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Recent Applications</div>
                    {recentApps.map((app, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold">{app.name[0]}</div>
                          <div>
                            <div className="text-xs font-medium text-gray-800">{app.name}</div>
                            <div className="text-[10px] text-gray-400">{app.role}</div>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400">{app.time}</span>
                      </div>
                    ))}
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
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Full ATS Suite</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Everything you need to hire your team</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">From job posting to signed offer — hiring simplified end-to-end.</p>
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
            <FadeSection>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Why Recruiters Love It</span>
              <h2 className="text-3xl font-bold mt-3 mb-8 text-mint-black">Recruiting your team will actually enjoy</h2>
              <ul className="space-y-4">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-700">{b}</span>
                  </li>
                ))}
              </ul>
            </FadeSection>
            <FadeSection delay={0.1}>
              <img
                src="https://images.pexels.com/photos/5439143/pexels-photo-5439143.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
                alt="Applicant tracking"
                className="rounded-2xl shadow-xl w-full object-cover"
              />
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
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Ready to hire smarter?</h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">Cut time-to-hire in half. Join recruiting teams already running their pipeline on Blumebyte.</p>
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
