import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { CheckCircle2, Users, BarChart3, Shield, Clock, FileText, Zap, DollarSign, UserCheck, Trophy, ChevronDown, Star, TrendingUp, Award, MessageSquare, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { HomepageChatAgent } from '../components/HomepageChatAgent';
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

// ─── HR Image Carousel (scroll + button driven) ───────────────────────────────
const HR_SLIDES = [
  {
    id: 'team',
    label: 'Team Management',
    bg: '#f0f4ff',
    accentColor: '#3b5bdb',
    illustration: (
      <svg viewBox="0 0 480 300" className="w-full h-full" aria-hidden="true">
        <rect width="480" height="300" fill="#f0f4ff" rx="16" />
        {/* Desk */}
        <rect x="60" y="190" width="360" height="14" rx="4" fill="#c8d6ff" />
        <rect x="100" y="204" width="12" height="50" rx="3" fill="#b0c0f0" />
        <rect x="368" y="204" width="12" height="50" rx="3" fill="#b0c0f0" />
        {/* Monitor */}
        <rect x="180" y="120" width="120" height="72" rx="8" fill="#3b5bdb" />
        <rect x="190" y="130" width="100" height="52" rx="5" fill="#6c8bff" />
        <rect x="225" y="192" width="30" height="8" rx="2" fill="#3b5bdb" />
        <rect x="210" y="200" width="60" height="5" rx="2" fill="#c8d6ff" />
        {/* People */}
        {[100, 200, 320].map((x, i) => (
          <g key={i}>
            <circle cx={x + 20} cy={90} r={22} fill={['#ffb3ba', '#b3e0ff', '#b3ffcc'][i]} />
            <rect x={x} y={114} width="40" height="72" rx="8" fill={['#ff6b80', '#3b9bdb', '#2db87d'][i]} />
            <rect x={x + 12} y={170} width="7" height="30" rx="3" fill={['#ff6b80', '#3b9bdb', '#2db87d'][i]} />
            <rect x={x + 22} y={170} width="7" height="30" rx="3" fill={['#ff6b80', '#3b9bdb', '#2db87d'][i]} />
          </g>
        ))}
        {/* Chat bubbles */}
        <rect x="310" y="50" width="100" height="36" rx="12" fill="white" opacity="0.9" />
        <text x="360" y="73" textAnchor="middle" fontSize="11" fill="#3b5bdb" fontWeight="600">Team Chat</text>
        <rect x="70" y="55" width="90" height="36" rx="12" fill="white" opacity="0.9" />
        <text x="115" y="78" textAnchor="middle" fontSize="11" fill="#e63946" fontWeight="600">Leave OK ✓</text>
      </svg>
    ),
  },
  {
    id: 'payroll',
    label: 'Payroll Processing',
    bg: '#fff7e6',
    accentColor: '#7C5A1A',
    illustration: (
      <svg viewBox="0 0 480 300" className="w-full h-full" aria-hidden="true">
        <rect width="480" height="300" fill="#fff7e6" rx="16" />
        {/* Document */}
        <rect x="140" y="40" width="200" height="240" rx="12" fill="white" stroke="#f0d8a0" strokeWidth="2" />
        <rect x="160" y="70" width="160" height="8" rx="4" fill="#f0c050" />
        <rect x="160" y="90" width="120" height="6" rx="3" fill="#f5e0a0" />
        {[110, 130, 150, 170, 190, 210, 230].map((y, i) => (
          <g key={i}>
            <rect x="160" y={y} width="70" height="5" rx="2" fill="#f0e0c0" />
            <rect x="270" y={y} width="50" height="5" rx="2" fill={i === 6 ? '#7C5A1A' : '#f0e0c0'} />
          </g>
        ))}
        <rect x="155" y="250" width="170" height="18" rx="6" fill="#7C5A1A" />
        <text x="240" y="263" textAnchor="middle" fontSize="11" fill="white" fontWeight="700">Process Payroll</text>
        {/* Coins */}
        {[[80, 140], [380, 110], [390, 180], [70, 200]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={18} fill="#ffd700" />
            <text x={cx} y={cy + 5} textAnchor="middle" fontSize="14" fill="#7C5A1A" fontWeight="900">$</text>
          </g>
        ))}
        {/* Check */}
        <circle cx="390" cy="60" r="22" fill="#22c55e" opacity="0.9" />
        <text x="390" y="67" textAnchor="middle" fontSize="20" fill="white" fontWeight="700">✓</text>
      </svg>
    ),
  },
  {
    id: 'performance',
    label: 'Performance Reviews',
    bg: '#f0fff4',
    accentColor: '#16a34a',
    illustration: (
      <svg viewBox="0 0 480 300" className="w-full h-full" aria-hidden="true">
        <rect width="480" height="300" fill="#f0fff4" rx="16" />
        {/* Background circles */}
        <circle cx="240" cy="150" r="110" fill="#bbf7d0" opacity="0.4" />
        {/* Chart bars */}
        {[
          [110, 200, 80, '#dcfce7', '#16a34a'],
          [170, 200, 120, '#bbf7d0', '#16a34a'],
          [230, 200, 150, '#86efac', '#15803d'],
          [290, 200, 100, '#bbf7d0', '#16a34a'],
          [350, 200, 170, '#4ade80', '#166534'],
        ].map(([x, y, h, fill, stroke], i) => (
          <g key={i}>
            <rect x={Number(x)} y={Number(y) - Number(h)} width="40" height={Number(h)} rx="6" fill={String(fill)} stroke={String(stroke)} strokeWidth="1.5" />
          </g>
        ))}
        {/* X-axis */}
        <rect x="100" y="200" width="280" height="3" rx="2" fill="#86efac" />
        {/* Stars */}
        {[130, 190, 250, 310, 370].map((x, i) => (
          <text key={i} x={x} y="230" textAnchor="middle" fontSize="16" fill="#fbbf24">★</text>
        ))}
        {/* Trophy */}
        <text x="362" y="45" fontSize="48" textAnchor="middle">🏆</text>
        {/* Labels */}
        <rect x="140" y="35" width="200" height="36" rx="10" fill="white" opacity="0.9" />
        <text x="240" y="58" textAnchor="middle" fontSize="13" fill="#166534" fontWeight="700">Performance Dashboard</text>
        {/* Up arrow */}
        <polygon points="60,160 80,120 100,160" fill="#4ade80" />
        <text x="80" y="110" textAnchor="middle" fontSize="11" fill="#166534" fontWeight="700">+24%</text>
      </svg>
    ),
  },
  {
    id: 'recruitment',
    label: 'Recruitment Pipeline',
    bg: '#fdf4ff',
    accentColor: '#9333ea',
    illustration: (
      <svg viewBox="0 0 480 300" className="w-full h-full" aria-hidden="true">
        <rect width="480" height="300" fill="#fdf4ff" rx="16" />
        {/* Funnel */}
        <polygon points="120,50 360,50 300,130 180,130" fill="#e9d5ff" stroke="#9333ea" strokeWidth="2" />
        <polygon points="180,135 300,135 270,200 210,200" fill="#c4b5fd" stroke="#9333ea" strokeWidth="2" />
        <polygon points="210,205 270,205 255,255 225,255" fill="#a78bfa" stroke="#9333ea" strokeWidth="2" />
        {/* Candidate dots */}
        {[[150,30],[200,30],[250,30],[300,30],[350,30]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r={14} fill={['#f9a8d4','#93c5fd','#6ee7b7','#fde68a','#c4b5fd'][i]} />
        ))}
        {/* Approved badge */}
        <circle cx="380" cy="250" r="32" fill="#9333ea" />
        <text x="380" y="256" textAnchor="middle" fontSize="22" fill="white" fontWeight="700">✓</text>
        {/* Label */}
        <rect x="100" y="265" width="160" height="26" rx="8" fill="white" opacity="0.9" />
        <text x="180" y="282" textAnchor="middle" fontSize="11" fill="#9333ea" fontWeight="700">5 Candidates Screened</text>
        {/* Magnifier */}
        <circle cx="50" cy="200" r="28" fill="none" stroke="#9333ea" strokeWidth="4" />
        <line x1="68" y1="220" x2="85" y2="238" stroke="#9333ea" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="200" r="14" fill="#e9d5ff" />
      </svg>
    ),
  },
  {
    id: 'attendance',
    label: 'Time & Attendance',
    bg: '#eff6ff',
    accentColor: '#2563eb',
    illustration: (
      <svg viewBox="0 0 480 300" className="w-full h-full" aria-hidden="true">
        <rect width="480" height="300" fill="#eff6ff" rx="16" />
        {/* Clock */}
        <circle cx="240" cy="145" r="100" fill="white" stroke="#2563eb" strokeWidth="4" />
        <circle cx="240" cy="145" r="90" fill="none" stroke="#dbeafe" strokeWidth="2" />
        {/* Hour ticks */}
        {Array.from({length:12}).map((_,i) => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          const x1 = 240 + 80 * Math.cos(angle);
          const y1 = 145 + 80 * Math.sin(angle);
          const x2 = 240 + 90 * Math.cos(angle);
          const y2 = 145 + 90 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#93c5fd" strokeWidth={i % 3 === 0 ? 3 : 1.5} strokeLinecap="round" />;
        })}
        {/* Hour hand - 9 o'clock */}
        <line x1="240" y1="145" x2="180" y2="145" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" />
        {/* Minute hand - 12 o'clock */}
        <line x1="240" y1="145" x2="240" y2="80" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
        {/* Center dot */}
        <circle cx="240" cy="145" r="6" fill="#2563eb" />
        {/* Check-in cards */}
        <rect x="30" y="80" width="120" height="50" rx="10" fill="white" stroke="#dbeafe" strokeWidth="2" />
        <text x="90" y="100" textAnchor="middle" fontSize="10" fill="#6b7280">Clock In</text>
        <text x="90" y="120" textAnchor="middle" fontSize="14" fill="#16a34a" fontWeight="700">09:02 AM</text>
        <rect x="330" y="200" width="120" height="50" rx="10" fill="white" stroke="#dbeafe" strokeWidth="2" />
        <text x="390" y="220" textAnchor="middle" fontSize="10" fill="#6b7280">Clock Out</text>
        <text x="390" y="240" textAnchor="middle" fontSize="14" fill="#dc2626" fontWeight="700">06:00 PM</text>
        {/* Status line */}
        <rect x="100" y="260" width="280" height="20" rx="8" fill="#dbeafe" />
        <rect x="100" y="260" width="210" height="20" rx="8" fill="#2563eb" />
        <text x="240" y="275" textAnchor="middle" fontSize="10" fill="white" fontWeight="700">Attendance: 94% ↑</text>
      </svg>
    ),
  },
];

function HRImageCarousel() {
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollTime = useRef(0);
  const total = HR_SLIDES.length;

  const goNext = useCallback(() => setActiveIdx(i => (i + 1) % total), [total]);
  const goPrev = useCallback(() => setActiveIdx(i => (i - 1 + total) % total), [total]);

  // Scroll wheel drives image changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastScrollTime.current < 600) return;
      lastScrollTime.current = now;
      if (Math.abs(e.deltaY) < 20) return;
      e.preventDefault();
      if (e.deltaY > 0) goNext(); else goPrev();
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [goNext, goPrev]);

  const slide = HR_SLIDES[activeIdx];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <FadeSection className="text-center mb-10">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">HR in Action</span>
        <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-mint-black">See every HR process come alive</h2>
        <p className="text-base text-gray-500 max-w-xl mx-auto">Scroll or tap through core workflows — from payroll to recruitment, everything flows smoothly.</p>
      </FadeSection>

      <div ref={containerRef} className="relative rounded-3xl overflow-hidden select-none" style={{ touchAction: 'pan-y' }}>
        {/* Image area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl"
            style={{ background: slide.bg, height: 340 }}
          >
            <div className="absolute inset-0 p-6">
              {slide.illustration}
            </div>

            {/* Slide label badge */}
            <div className="absolute top-5 left-5 px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-md"
              style={{ background: slide.accentColor }}>
              {slide.label}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Prev/Next buttons */}
        <button
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-black/10 shadow flex items-center justify-center hover:bg-white transition-colors z-10"
          aria-label="Previous"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-black/10 shadow flex items-center justify-center hover:bg-white transition-colors z-10"
          aria-label="Next"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Dot navigation */}
      <div className="flex justify-center gap-2 mt-6">
        {HR_SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIdx(i)}
            aria-label={`View ${s.label}`}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIdx ? 28 : 10,
              height: 10,
              background: i === activeIdx ? slide.accentColor : '#d1d5db',
            }}
          />
        ))}
      </div>

      {/* Slide titles row */}
      <div className="flex justify-center gap-3 mt-5 flex-wrap">
        {HR_SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveIdx(i)}
            className="text-xs font-semibold px-3 py-1 rounded-full border transition-all duration-200"
            style={{
              borderColor: i === activeIdx ? s.accentColor : '#e5e7eb',
              color: i === activeIdx ? s.accentColor : '#9ca3af',
              background: i === activeIdx ? `${s.accentColor}12` : 'transparent',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </section>
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

// ─── Testimonial data (companies kept anonymous) ──────────────────────────────
const TESTIMONIALS = [
  {
    name: 'A. M.',
    role: 'HR Director',
    company: 'Anonymous',
    quote: 'Blumebyte transformed how we manage our 200-person team. Payroll that used to take 3 days now takes 30 minutes.',
    rating: 5,
  },
  {
    name: 'K. A.',
    role: 'CEO',
    company: 'Anonymous',
    quote: 'The attendance tracking and leave management alone saved us countless hours every month. Incredible platform.',
    rating: 5,
  },
  {
    name: 'F. A.',
    role: 'Operations Manager',
    company: 'Anonymous',
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
      price: billingAnnual ? '$2.55' : '$3.55',
      period: '/employee/month',
      billingCycle: billingAnnual ? 'Billed annually ($30.60/year)' : 'Billed monthly',
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
      price: billingAnnual ? '$2.55' : '$3.55',
      period: '/employee/month',
      billingCycle: billingAnnual ? 'Billed annually ($30.60/year)' : 'Billed monthly',
      description: 'Best value for scale',
      popular: true,
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
    { q: 'How is pricing calculated?', a: 'Pricing is per active employee per month. The minimum purchase is 2 licenses.' },
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
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {['Kube', 'MotionTrix', 'Legacy', 'EvoCakes', 'BeadMatics', 'GitHub', 'Supabase', 'Vercel', 'Bluehost'].map((name) => (
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

      {/* ── 5. HR IMAGES CAROUSEL ── */}
      <HRImageCarousel />

      {/* ── 6. FEATURES BENTO GRID ── */}
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
                    <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-mint-black">{t.name}</div>
                      <div className="text-xs text-gray-500">{t.role} · Verified Customer</div>
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
