import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle2, Users, BarChart3, Shield, Clock, FileText, Zap, Sparkles, Building2, Heart, Briefcase, GraduationCap, TrendingUp as Growth, DollarSign, UserCheck, Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { HomepageChatAgent } from '../components/HomepageChatAgent';
import { TechSliders3D } from '../components/TechSliders3D';
import { HeroUIUXAnimation } from '../components/HeroUIUXAnimation';
import { PublicNavbar, PublicFooter } from '../components/PublicNavFooter';

// 4 HR-themed hero images
const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=80',
    headline: 'Modern HR Management for Growing Companies',
    sub: 'Streamline your HR operations with Blumebyte. Manage employees, track attendance, process leave requests, and more — all in one powerful platform.',
  },
  {
    url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80',
    headline: 'Empower Your People. Drive Results.',
    sub: 'From hiring to retirement, give your team the tools they need to thrive — with real-time analytics, automated workflows, and seamless payroll.',
  },
  {
    url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80',
    headline: 'Smarter HR for Every Industry',
    sub: 'Whether you\'re in tech, healthcare, or finance, Blumebyte adapts to your workforce. Compliant, secure, and built for scale.',
  },
  {
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1920&q=80',
    headline: 'Insights That Move Your Business Forward',
    sub: 'Real-time dashboards and advanced reporting give HR leaders the visibility they need to make confident, data-driven decisions.',
  },
];

/** Duration (ms) of the text fade-out/in between hero slides */
const SLIDE_FADE_MS = 400;

export default function LandingPage() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setSlide(idx);
      setAnimating(false);
    }, SLIDE_FADE_MS);
  };

  // Auto-advance every 5 s — goes through the fade animation so text fades too
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setSlide(prev => (prev + 1) % HERO_SLIDES.length);
        setAnimating(false);
      }, SLIDE_FADE_MS);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const prev = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    goTo((slide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };
  const next = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    goTo((slide + 1) % HERO_SLIDES.length);
  };

  const features = [
    { icon: Users, title: 'Employee Management', description: 'Manage your workforce with ease. Track attendance, performance, and more.' },
    { icon: Clock, title: 'Time & Attendance', description: 'Clock in/out tracking with real-time monitoring and reports.' },
    { icon: FileText, title: 'Leave Management', description: 'Streamline leave requests and approvals with automated workflows.' },
    { icon: BarChart3, title: 'Analytics & Reports', description: 'Get insights into your workforce with powerful analytics.' },
    { icon: Shield, title: 'Secure & Compliant', description: 'Enterprise-grade security with role-based access control.' },
    { icon: Zap, title: 'Automation', description: 'Automate routine tasks to save time and reduce errors.' },
  ];

  const pricingPlans = [
    {
      name: 'Monthly Plan', price: '$6', period: '/employee/month', billingCycle: 'Billed monthly',
      features: ['Operations and Compliance','Performance Management','Organization Management','Compensation and Payroll','Reporting and Analytics','Time and Attendance','People Management','Learning and Development','System Administration','Communication','Documents','Assets'],
    },
    {
      name: 'Yearly Plan', price: '$5', period: '/employee/month', billingCycle: 'Billed annually at $60/employee',
      features: ['Operations and Compliance','Performance Management','Organization Management','Compensation and Payroll','Reporting and Analytics','Time and Attendance','People Management','Learning and Development','System Administration','Communication','Documents','Assets'],
      popular: true, savings: '17% savings',
    },
    {
      name: 'Custom Plan', price: 'Contact Us', period: '', billingCycle: 'Tailored for your needs',
      features: ['Everything in Yearly Plan','Custom Integrations','Dedicated Account Manager','White-label Options'],
      contactLink: 'https://blumebyte.com/contact/',
    },
  ];

  const currentSlide = HERO_SLIDES[slide];

  return (
    <div className="min-h-screen public-page-bg">
      <PublicNavbar />

      {/* ── HERO: Auto-sliding images with glassmorphism overlay ── */}
      <section className="relative overflow-hidden min-h-[700px]">
        {/* Slide images */}
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 z-0 transition-opacity duration-700"
            style={{ opacity: i === slide ? 1 : 0 }}
          >
            <img src={s.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-black/50" />
          </div>
        ))}

        {/* Prev / Next arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Slide indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); goTo(i); }}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-white' : 'w-4 bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Glassmorphism text card */}
            <div className={`space-y-6 transition-opacity duration-500 ${animating ? 'opacity-0' : 'opacity-100'}`}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm text-white text-sm font-medium border border-white/25">
                <Sparkles className="h-4 w-4 text-white" />
                AI-Powered HR Management
              </div>
              {/* Glassmorphism headline card */}
              <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
                <h1 className="text-4xl sm:text-5xl md:text-5xl font-bold leading-tight text-white mb-4">
                  {currentSlide.headline}
                </h1>
                <p className="text-lg text-gray-200">{currentSlide.sub}</p>
              </div>
              <p className="text-xl font-semibold text-gray-200">Starting at just $5 per employee/month</p>
              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  size="lg"
                  onClick={() => navigate('/company-signup')}
                  className="bg-white text-black hover:bg-gray-100 text-base px-8 shadow-lg font-semibold"
                >
                  Get Started Now
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/pricing')}
                  className="border-white/50 text-white hover:bg-white/15 backdrop-blur-sm text-base px-8 font-semibold"
                >
                  View Pricing
                </Button>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 pt-2">
                {['🔒 SOC 2 Compliant', '⚡ 99.9% Uptime', '🌍 Multi-tenant', '🤖 AI-Powered'].map(badge => (
                  <span key={badge} className="text-xs text-white/70 bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: HR Animation */}
            <div className="hidden lg:flex items-center justify-center h-[600px]">
              <HeroUIUXAnimation />
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Tech Sliders */}
      <TechSliders3D />

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">Everything you need to manage your team</h2>
          <p className="text-lg text-gray-600">Powerful features designed for modern HR teams</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="glass-public hover-lift border hover:border-mint-green transition-all animate-fade-in-up" style={{ animationDelay: `${index * 0.07}s` }}>
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-mint-black flex items-center justify-center mb-4 shadow-md">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-mint-black">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform Overview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">A Complete HR Platform</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">From hiring to retirement, manage every aspect of your employee lifecycle in one place</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: UserCheck, title: 'Hire & Onboard', desc: 'Attract top talent with our applicant tracking system and create seamless onboarding experiences' },
            { icon: Growth, title: 'Grow & Develop', desc: 'Foster employee growth with performance management, training, and development tools' },
            { icon: BarChart3, title: 'Analyze & Optimize', desc: 'Make data-driven decisions with comprehensive HR analytics and reporting' },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title} className="glass-public hover-lift border hover:border-mint-green transition-all">
              <CardHeader>
                <Icon className="h-10 w-10 text-mint-green mb-4" />
                <CardTitle className="text-mint-black">{title}</CardTitle>
                <CardDescription className="text-sm">{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">Built for Your Industry</h2>
            <p className="text-lg text-gray-600">Tailored solutions for businesses across all sectors</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { name: 'Technology', icon: Zap },
              { name: 'Healthcare', icon: Heart },
              { name: 'Finance', icon: DollarSign },
              { name: 'Education', icon: GraduationCap },
              { name: 'Construction', icon: Building2 },
              { name: 'Manufacturing', icon: Briefcase },
            ].map((industry, idx) => (
              <button key={idx} className="flex flex-col items-center justify-center p-6 glass-public rounded-xl hover:border-mint-green hover:shadow-lg transition-all group">
                <industry.icon className="h-8 w-8 text-mint-green/60 group-hover:text-mint-green mb-3 transition-colors" />
                <span className="text-sm font-medium text-gray-700 group-hover:text-mint-black transition-colors">{industry.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-600">Choose the plan that's right for your business</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <Card key={index} className={`glass-public hover-lift relative border transition-all hover:shadow-xl ${plan.popular ? 'border-mint-green shadow-lg scale-105' : 'border-mint-green/20'}`}>
              {plan.popular && plan.savings && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-mint-black text-white text-sm font-medium rounded-full shadow">{plan.savings}</div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl text-mint-black">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.billingCycle}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-mint-black">{plan.price}</span>
                  <span className="text-gray-600 text-sm">{plan.period}</span>
                </div>
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
                  <Button className="w-full" variant="outline" onClick={() => window.open(plan.contactLink, '_blank')}>Contact Sales</Button>
                ) : (
                  <Button
                    className={`w-full ${plan.popular ? 'bg-mint-black text-white hover:bg-[#1a3525]' : ''}`}
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

      {/* Why Blumebyte */}
      <section className="section-mint py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-mint-black">Why Companies Choose Blumebyte</h2>
            <p className="text-lg text-gray-600">Award-winning platform trusted by growing businesses</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Trophy, title: 'Award-Winning Support', desc: '24/7 customer support with industry-leading response times and satisfaction rates' },
              { icon: Shield, title: 'Enterprise Security', desc: 'Bank-level encryption, 2FA, and compliance with global data protection standards' },
              { icon: Zap, title: 'Easy Implementation', desc: 'Get up and running in days, not months, with guided onboarding and migration support' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="glass-public hover-lift border border-mint-green/20">
                <CardHeader>
                  <Icon className="h-10 w-10 text-mint-green mb-4" />
                  <CardTitle className="text-mint-black">{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Glassmorphism CTA with dark background */}
        <div className="relative overflow-hidden rounded-2xl bg-mint-black shadow-2xl">
          {/* Subtle green glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/10" />
          <div className="relative z-10 p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Ready to transform your HR operations?</h2>
            <p className="text-lg mb-8 text-gray-300 max-w-2xl mx-auto">
              Join hundreds of companies already using Blumebyte to streamline their HR processes
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/company-signup')} className="text-lg px-8 bg-white text-black hover:bg-gray-100 font-semibold shadow-lg">
                Get Started Today
              </Button>
              <Button size="lg" variant="outline" onClick={() => window.open('https://blumebyte.com/contact/', '_blank')} className="text-lg px-8 border-white/50 text-white hover:bg-white/15 font-semibold">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
      <HomepageChatAgent />
    </div>
  );
}
