import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Button } from '../components/ui/button';
import { Clock, MapPin, Smartphone, Calendar, TrendingUp, Shield, CheckCircle2, Users, BarChart3, Zap } from 'lucide-react';
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

export default function TimeAttendancePage() {
  const navigate = useNavigate();

  const features = [
    { icon: Clock, title: 'Clock In/Out', description: 'Simple and intuitive time tracking with web, mobile, and kiosk options for every workplace.' },
    { icon: MapPin, title: 'GPS Geofencing', description: 'Location-based clock-ins for field workers and remote teams with smart geofencing rules.' },
    { icon: Smartphone, title: 'Mobile App', description: 'Clock in from anywhere with a sleek mobile experience on iOS and Android.' },
    { icon: Calendar, title: 'Shift Scheduling', description: 'Build and publish employee schedules with drag-and-drop simplicity and conflict detection.' },
    { icon: TrendingUp, title: 'Overtime Tracking', description: 'Automatically calculate and flag overtime based on your company policies and labour laws.' },
    { icon: Shield, title: 'Compliance Ready', description: 'Stay compliant with automated break tracking, rest period alerts, and regulatory reports.' },
    { icon: BarChart3, title: 'Attendance Reports', description: 'Visualise patterns, identify chronic absenteeism, and export reports in seconds.' },
    { icon: Zap, title: 'Payroll Sync', description: 'Approve timesheets with one click and push accurate hours directly to payroll.' },
    { icon: Users, title: 'Team Visibility', description: 'Managers see who is in, late, or absent — across all departments — in real time.' },
  ];

  const stats = [
    { label: 'Reduction in Payroll Errors', value: '80%' },
    { label: 'Hours Saved per Month', value: '5h+' },
    { label: 'Attendance Tracked Daily', value: '500+' },
    { label: 'Average On-Time Rate', value: '96%' },
  ];

  const benefits = [
    'Eliminate time theft and buddy punching',
    'Reduce payroll errors by up to 80%',
    'Save 5+ hours per week on timesheet processing',
    'Real-time attendance visibility for all managers',
    'Automated overtime and break compliance',
    'Seamless integration with payroll processing',
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
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-gray-700 tracking-wide">Time & Attendance</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight text-mint-black">
                Know Who's In,<br />
                <span className="relative">
                  Always.
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-black/20 rounded-full" />
                </span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg leading-relaxed">
                Track work hours, manage shifts, and monitor attendance with precision — from the office, the field, or anywhere in between.
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

            {/* Attendance Visual Panel */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }} className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[420px] rounded-2xl border border-black/10 shadow-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.97)' }}>
                <div className="px-5 py-4 border-b border-black/8 flex items-center justify-between" style={{ background: '#7C5A1A' }}>
                  <span className="text-xs font-bold text-white/80">Today's Attendance</span>
                  <span className="text-xs text-white/60">hr.blumebyte.com</span>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Present', val: '142', pct: '95%', color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Late', val: '5', pct: '3%', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                      { label: 'Absent', val: '3', pct: '2%', color: 'text-red-600', bg: 'bg-red-50' },
                    ].map(({ label, val, pct, color, bg }, i) => (
                      <div key={i} className={`rounded-xl p-3 text-center ${bg}`}>
                        <div className={`text-xl font-black ${color}`}>{val}</div>
                        <div className="text-[10px] text-gray-600 font-medium">{label}</div>
                        <div className={`text-[10px] font-bold ${color}`}>{pct}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-black/8 p-3">
                    <div className="text-xs font-semibold text-gray-700 mb-3">Live Clock-ins</div>
                    {[
                      { name: 'Sarah K.', time: '8:02 AM', status: 'On Time', statusColor: 'text-green-600 bg-green-50' },
                      { name: 'James O.', time: '8:18 AM', status: 'Late', statusColor: 'text-yellow-600 bg-yellow-50' },
                      { name: 'Amara D.', time: '7:55 AM', status: 'Early', statusColor: 'text-blue-600 bg-blue-50' },
                      { name: 'Kofi M.', time: '8:00 AM', status: 'On Time', statusColor: 'text-green-600 bg-green-50' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-black/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold">{row.name[0]}</div>
                          <div>
                            <div className="text-xs font-medium text-gray-800">{row.name}</div>
                            <div className="text-[10px] text-gray-400">{row.time}</div>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.statusColor}`}>{row.status}</span>
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
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Complete Time Tracking</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">Every tool you need to manage time</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">From daily clock-ins to monthly attendance reports — time tracking that works the way your business does.</p>
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
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Why Blumebyte Time Tracking</span>
              <h2 className="text-3xl font-bold mt-3 mb-8 text-mint-black">Time tracking your whole team will use</h2>
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
                src="https://images.pexels.com/photos/4475523/pexels-photo-4475523.jpeg?auto=compress&cs=tinysrgb&w=800&h=600"
                alt="Team at work"
                className="rounded-2xl shadow-xl w-full object-cover"
                style={{ maxHeight: 360 }}
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
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">Modernise your time tracking today</h2>
              <p className="text-lg text-white/70 max-w-xl mx-auto">Join teams using Blumebyte to track time accurately and process payroll without the headache.</p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Button size="lg" onClick={() => navigate('/company-signup')} className="bg-white text-black hover:bg-gray-100 text-base px-8 shadow-lg font-bold">Start Now</Button>
                <Button size="lg" variant="outline" onClick={() => window.open('https://blumebyte.com/contact/', '_blank')} className="border-white/30 bg-transparent text-white hover:bg-white/10 text-base px-8 font-semibold">Contact Sales</Button>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>

      <PublicFooter />
    </div>
  );
}
