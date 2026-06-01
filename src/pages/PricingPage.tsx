import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, Play, RotateCcw, Trophy, Zap } from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';
import { SharedNavigation } from '../components/SharedNavigation';

type PricingPlan = {
  name: string;
  price: string;
  period: string;
  billingCycle: string;
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
  contactLink?: string;
};

// ─── Snake Mini-Game ──────────────────────────────────────────────────────────
const GRID = 16;
const CELL = 16;
const CANVAS = GRID * CELL;
const GAME_TICK_MS = 135;

type Point = { x: number; y: number };

function SnakeMiniGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    snake: [{ x: 8, y: 8 }] as Point[],
    dir: { x: 1, y: 0 } as Point,
    nextDir: { x: 1, y: 0 } as Point,
    food: { x: 4, y: 4 } as Point,
    score: 0,
    running: false,
    over: false,
    intervalId: null as ReturnType<typeof setInterval> | null,
  });
  const [displayScore, setDisplayScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const randomFood = (snake: Point[]): Point => {
    let pos: Point;
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;
    ctx.clearRect(0, 0, CANVAS, CANVAS);
    ctx.fillStyle = 'rgba(124,90,26,0.07)';
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        ctx.beginPath();
        ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.font = `bold ${CELL - 4}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', s.food.x * CELL + CELL / 2, s.food.y * CELL + CELL / 2 + 1);
    s.snake.forEach((seg, i) => {
      const isHead = i === 0;
      const alpha = isHead ? 1 : 0.85 - (i / s.snake.length) * 0.4;
      ctx.fillStyle = isHead ? '#7C5A1A' : `rgba(124,90,26,${alpha})`;
      const r = isHead ? CELL / 2 - 1 : CELL / 2 - 2;
      ctx.beginPath();
      ctx.roundRect(seg.x * CELL + 2, seg.y * CELL + 2, CELL - 4, CELL - 4, r);
      ctx.fill();
    });
  }, []);

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (!s.running) return;
    s.dir = s.nextDir;
    const head = s.snake[0];
    const next: Point = { x: (head.x + s.dir.x + GRID) % GRID, y: (head.y + s.dir.y + GRID) % GRID };
    if (s.snake.some(seg => seg.x === next.x && seg.y === next.y)) {
      s.running = false;
      s.over = true;
      if (s.intervalId) clearInterval(s.intervalId);
      setGameOver(true);
      draw();
      return;
    }
    s.snake = [next, ...s.snake];
    if (next.x === s.food.x && next.y === s.food.y) {
      s.score += 1;
      s.food = randomFood(s.snake);
      setDisplayScore(s.score);
    } else {
      s.snake = s.snake.slice(0, -1);
    }
    draw();
  }, [draw]);

  const startGame = useCallback(() => {
    const s = stateRef.current;
    if (s.intervalId) clearInterval(s.intervalId);
    s.snake = [{ x: 8, y: 8 }];
    s.dir = { x: 1, y: 0 };
    s.nextDir = { x: 1, y: 0 };
    s.food = randomFood(s.snake);
    s.score = 0;
    s.running = true;
    s.over = false;
    setDisplayScore(0);
    setGameOver(false);
    setStarted(true);
    draw();
    s.intervalId = setInterval(tick, GAME_TICK_MS);
  }, [draw, tick]);

  useEffect(() => {
    draw();
    return () => { if (stateRef.current.intervalId) clearInterval(stateRef.current.intervalId); };
  }, [draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if (!s.running) return;
      const map: Record<string, Point> = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
        a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
      };
      const nd = map[e.key];
      if (!nd) return;
      if (nd.x !== -s.dir.x || nd.y !== -s.dir.y) s.nextDir = nd;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const s = stateRef.current;
    if (!s.running) return;
    let nd: Point;
    if (Math.abs(dx) > Math.abs(dy)) {
      nd = dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 };
    } else {
      nd = dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 };
    }
    if (nd.x !== -s.dir.x || nd.y !== -s.dir.y) s.nextDir = nd;
  };

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS}
          height={CANVAS}
          className="rounded-2xl border-2 border-black/10 shadow-xl cursor-default"
          style={{ background: 'rgba(255,255,255,0.97)', touchAction: 'none' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        />
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.92)' }}>
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3 shadow-lg">
              <Play className="w-6 h-6 text-white ml-0.5" />
            </div>
            <p className="text-sm font-bold text-gray-800 mb-0.5">Catch the Payslip!</p>
            <p className="text-xs text-gray-500 mb-4">Arrows / WASD to move</p>
            <Button size="sm" onClick={startGame} className="bg-primary text-white hover:bg-primary/90 text-xs px-4">
              Play
            </Button>
          </div>
        )}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.92)' }}>
            <p className="text-sm font-bold text-gray-800 mb-1">Game Over!</p>
            <p className="text-2xl font-black text-primary mb-4">{displayScore} pts</p>
            <Button size="sm" onClick={startGame} className="bg-primary text-white hover:bg-primary/90 text-xs px-4 flex items-center gap-1.5">
              <RotateCcw className="w-3 h-3" /> Play Again
            </Button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>Score: <span className="font-bold text-primary">{displayScore}</span></span>
        {started && !gameOver && <span className="text-[10px]">Arrows / WASD / swipe</span>}
      </div>
    </div>
  );
}


export default function PricingPage() {
  const navigate = useNavigate();

  const pricingPlans: PricingPlan[] = [
    {
      name: 'Monthly Plan',
      price: '$3.55',
      period: '/employee/month',
      billingCycle: 'Billed monthly',
      description: 'Perfect for companies wanting flexibility',
      features: [
        'Operations and Compliance',
        'Performance Management',
        'Organization Management',
        'Compensation and Payroll',
        'Reporting and Analytics',
        'Time and Attendance',
        'People Management',
        'Learning and Development',
        'System Administration',
        'Communication',
        'Documents',
        'Assets',
        'Employee Self-Service Portal',
        'Leave Management',
        'Recruitment & Hiring',
        '24/7 Support',
      ],
    },
    {
      name: 'Yearly Plan',
      price: '$2.55',
      period: '/employee/month',
      billingCycle: 'Billed annually at $30.60/employee',
      description: 'Best value for growing companies',
      features: [
        'Operations and Compliance',
        'Performance Management',
        'Organization Management',
        'Compensation and Payroll',
        'Reporting and Analytics',
        'Time and Attendance',
        'People Management',
        'Learning and Development',
        'System Administration',
        'Communication',
        'Documents',
        'Assets',
        'Employee Self-Service Portal',
        'Leave Management',
        'Recruitment & Hiring',
        '24/7 Support',
        'Priority Support',
        'Quarterly Business Reviews',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      billingCycle: 'Tailored for your needs',
      description: 'For large organizations with specific requirements',
      features: [
        'Everything in Yearly Plan',
        'Custom Integrations',
        'Dedicated Account Manager',
        'White-label Options',
        'Advanced Security Features',
        'Custom SLA',
        'Onboarding Support',
        'Training Sessions',
      ],
      contactLink: 'https://blumebyte.com/contact/',
    },
  ];

  const faqs = [
    {
      question: 'What is included in the free trial?',
      answer: 'The free trial includes full access to all features for 14 days. No credit card required.'
    },
    {
      question: 'How is pricing calculated?',
      answer: 'Pricing is per employee per month. Monthly plan is $3.55/employee/month. Annual plan is $2.55/employee/month ($30.60/employee/year). Minimum purchase is 2 licenses.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the next billing cycle.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards and bank transfers via Paystack.'
    },
    {
      question: 'Is there a setup fee?',
      answer: 'No, there are no setup fees or hidden costs. Pay only for what you use.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied.'
    },
  ];

  return (
    <div className="min-h-screen public-page-bg">
      {/* Navigation */}
      <SharedNavigation />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-mint-black">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            No hidden fees. No surprises. Just powerful HR management at an affordable price.
          </p>
        </div>

        {/* Mini Game */}
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 justify-center">
          <div className="flex-1 text-center md:text-left space-y-4 max-w-sm">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1 text-xs font-semibold text-gray-600 shadow-sm">
              <span className="text-base">🎮</span> Take a break
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-mint-black">Catch the Payslip!</h2>
            <p className="text-gray-500 text-sm">
              Guide your HR agent to collect payslips before your team notices. Use arrow keys, WASD, or swipe on mobile.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs text-gray-400">
              <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-amber-500" /> Beat your high score</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-primary" /> Instant play, no download</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <SnakeMiniGame />
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              className={`glass-public hover-lift relative border transition-all hover:shadow-xl ${
                plan.popular ? 'border-mint-green shadow-lg scale-105' : 'border-mint-green/20'
              }`}
            >
              {plan.popular && plan.savings && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-mint-black text-white text-sm font-medium rounded-full">
                  {plan.savings}
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl text-mint-black">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-mint-black">{plan.price}</span>
                  <span className="text-gray-600 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.billingCycle}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-mint-green shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.contactLink ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => window.open(plan.contactLink, '_blank')}
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? 'bg-mint-black text-white hover:bg-[#1a3525]'
                        : ''
                    }`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/company-signup')}
                  >
                    Get Started
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-mint py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-mint-black">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know about pricing</p>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="glass-public hover-lift border border-mint-green/20">
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                  <CardDescription>{faq.answer}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <Card className="bg-mint-black text-white border-0">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Our team is here to help you find the perfect plan for your business
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => navigate('/company-signup')} className="bg-mint-white text-mint-black hover:bg-mint-green-light">
                Start Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open('https://blumebyte.com/contact/', '_blank')} className="border-white bg-transparent text-white hover:bg-white hover:text-mint-black">
                Contact Sales
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-mint-green/15 bg-mint-white/80 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-600">© 2026 Blumebyte. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
