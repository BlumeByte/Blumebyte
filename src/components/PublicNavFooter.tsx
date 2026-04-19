import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import {
  Menu, X, ChevronDown, ChevronUp,
  BarChart3, FileText, Clock, DollarSign, Trophy, Award,
  UserCheck, Users, Heart, Building2, GraduationCap, Zap,
  Sparkles, Globe, Shield, Target, Book, Video, Calendar,
  Briefcase,
} from 'lucide-react';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

// ─── Desktop dropdown data ────────────────────────────────────────────────────
const platformMenu = [
  {
    title: 'Core Platform',
    items: [
      { name: 'Platform Overview', icon: BarChart3, description: 'Complete HR management solution', path: '/platform-overview' },
      { name: 'HR Data & Reporting', icon: FileText, description: 'Advanced analytics and insights', path: '/hr-data-reporting' },
      { name: 'Time & Attendance', icon: Clock, description: 'Clock in/out and time tracking', path: '/time-attendance' },
    ],
  },
  {
    title: 'Workforce Management',
    items: [
      { name: 'Payroll', icon: DollarSign, description: 'Streamlined payroll processing', path: '/payroll' },
      { name: 'Performance Management', icon: Trophy, description: 'Track and improve performance', path: '/performance-management' },
      { name: 'Compensation', icon: Award, description: 'Manage pay grades and bonuses', path: '/compensation' },
    ],
  },
  {
    title: 'Talent & Growth',
    items: [
      { name: 'Applicant Tracking', icon: UserCheck, description: 'Recruit and hire top talent', path: '/applicant-tracking' },
      { name: 'Onboarding', icon: Users, description: 'Seamless new hire experience', path: '/onboarding' },
      { name: 'Employee Experience', icon: Heart, description: 'Boost engagement and satisfaction', path: '/employee-experience' },
    ],
  },
];

const solutionsMenu = [
  {
    title: 'By Industry',
    items: [
      { name: 'Construction', icon: Building2, path: '/industry/construction' },
      { name: 'Education', icon: GraduationCap, path: '/industry/education' },
      { name: 'Finance', icon: DollarSign, path: '/industry/finance' },
      { name: 'Healthcare', icon: Heart, path: '/industry/healthcare' },
      { name: 'Manufacturing', icon: Briefcase, path: '/industry/manufacturing' },
      { name: 'Technology', icon: Zap, path: '/industry/technology' },
    ],
  },
  {
    title: 'By Company Size',
    items: [
      { name: 'Startups', icon: Sparkles, path: '/platform-overview' },
      { name: 'Small Companies (1-50)', icon: Users, path: '/platform-overview' },
      { name: 'Mid-sized (51-200)', icon: Building2, path: '/platform-overview' },
      { name: 'Large Companies (200+)', icon: Globe, path: '/platform-overview' },
    ],
  },
  {
    title: 'By Stakeholder',
    items: [
      { name: 'Executives', icon: Target, path: '/platform-overview' },
      { name: 'HR Leaders', icon: Users, path: '/platform-overview' },
      { name: 'Finance Teams', icon: DollarSign, path: '/platform-overview' },
      { name: 'IT Departments', icon: Shield, path: '/platform-overview' },
    ],
  },
];

const resourcesMenu = [
  {
    title: 'Learn',
    items: [
      { name: 'HR Toolkit', icon: Briefcase, description: 'Templates and tools', path: '/resources' },
      { name: 'Content Library', icon: Book, description: 'Guides and resources', path: '/resources' },
      { name: 'HR Glossary', icon: FileText, description: 'Industry terminology', path: '/resources' },
      { name: 'Webinar Library', icon: Video, description: 'On-demand videos', path: '/resources' },
      { name: 'Events Hub', icon: Calendar, description: 'Upcoming events', path: '/resources' },
      { name: 'HR Virtual Summit', icon: Trophy, description: 'Annual conference', path: '/resources' },
    ],
  },
];

// ─── Desktop Dropdown ─────────────────────────────────────────────────────────
function DesktopDropdown({ label, content }: { label: string; content: typeof platformMenu }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors">
        {label}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-[600px] bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-6">
          <div className="grid grid-cols-2 gap-6">
            {content.map((section, i) => (
              <div key={i}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, j) => (
                    <li key={j}>
                      <button
                        onClick={() => { setOpen(false); navigate(item.path); }}
                        className="flex items-start gap-3 w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors group"
                      >
                        <item.icon className="h-5 w-5 text-gray-400 group-hover:text-black mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 group-hover:text-black">{item.name}</div>
                          {(item as any).description && (
                            <div className="text-xs text-gray-500 mt-0.5">{(item as any).description}</div>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mobile accordion section ─────────────────────────────────────────────────
function MobileSection({
  label,
  content,
  onNavigate,
}: {
  label: string;
  content: typeof platformMenu;
  onNavigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="pl-4 pb-1 space-y-0.5">
          {content.map((section, i) => (
            <div key={i} className="mt-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-1">
                {section.title}
              </p>
              {section.items.map((item, j) => (
                <button
                  key={j}
                  onClick={() => onNavigate(item.path)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Public Navbar ─────────────────────────────────────────────────────────────
export function PublicNavbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (path: string) => { navigate(path); setMobileOpen(false); };

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo + desktop nav */}
          <div className="flex items-center gap-8">
            <img
              src={logoImage}
              alt="Blumebyte"
              className="h-8 cursor-pointer"
              onClick={() => navigate('/')}
            />
            <div className="hidden md:flex items-center gap-1">
              <DesktopDropdown label="Our Platform" content={platformMenu} />
              <DesktopDropdown label="Solutions" content={solutionsMenu} />
              <DesktopDropdown label="Resources" content={resourcesMenu} />
              <button
                onClick={() => navigate('/pricing')}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => navigate('/hirings')}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors flex items-center gap-1"
              >
                <Briefcase className="h-4 w-4" />
                Hirings
              </button>
            </div>
          </div>

          {/* Desktop CTA + mobile hamburger */}
          <div className="flex items-center gap-2">
            <div className="hidden md:flex gap-3">
              <Button variant="ghost" onClick={() => navigate('/login')}>Sign In</Button>
              <Button onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
                Get Started
              </Button>
            </div>
            <button
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-black hover:bg-gray-100 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu drawer – full-width below the nav bar */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white shadow-lg w-full">
          <div className="px-4 py-3 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <MobileSection label="Our Platform" content={platformMenu} onNavigate={go} />
            <MobileSection label="Solutions" content={solutionsMenu} onNavigate={go} />
            <MobileSection label="Resources" content={resourcesMenu} onNavigate={go} />
            <button
              onClick={() => go('/pricing')}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => go('/hirings')}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Hirings
            </button>
            <div className="border-t pt-3 mt-2 flex flex-col gap-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => go('/login')}
              >
                Sign In
              </Button>
              <Button
                className="w-full bg-black text-white hover:bg-gray-800"
                onClick={() => go('/company-signup')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Public Footer ─────────────────────────────────────────────────────────────
export function PublicFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <img src={logoImage} alt="Blumebyte" className="h-10 mb-4" />
            <p className="text-sm text-gray-600 leading-relaxed">
              Modern HR management platform for growing companies across Africa and beyond.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-4 text-sm uppercase tracking-wide">Platform</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><button onClick={() => navigate('/platform-overview')} className="hover:text-black transition-colors">Overview</button></li>
              <li><button onClick={() => navigate('/features')} className="hover:text-black transition-colors">Features</button></li>
              <li><button onClick={() => navigate('/integrations')} className="hover:text-black transition-colors">Integrations</button></li>
              <li><button onClick={() => navigate('/pricing')} className="hover:text-black transition-colors">Pricing</button></li>
              <li><button onClick={() => navigate('/hirings')} className="hover:text-black transition-colors">Hirings</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-4 text-sm uppercase tracking-wide">Resources</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><button onClick={() => window.open('https://www.youtube.com/@BlumeByte', '_blank')} className="hover:text-black transition-colors">Tutorials</button></li>
              <li><button onClick={() => window.open('https://www.youtube.com/@BlumeByte', '_blank')} className="hover:text-black transition-colors">Webinars</button></li>
              <li><button onClick={() => window.open('https://www.youtube.com/@BlumeByte', '_blank')} className="hover:text-black transition-colors">Documentation</button></li>
              <li><button onClick={() => window.open('https://www.youtube.com/@BlumeByte', '_blank')} className="hover:text-black transition-colors">Support</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-black mb-4 text-sm uppercase tracking-wide">Legal</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li><button onClick={() => navigate('/privacy-policy')} className="hover:text-black transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms-conditions')} className="hover:text-black transition-colors">Terms of Service</button></li>
              <li><button onClick={() => navigate('/security-policy')} className="hover:text-black transition-colors">Security</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Blumebyte. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Follow us</span>
            <button
              onClick={() => window.open('https://www.youtube.com/@BlumeByte', '_blank')}
              className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-600 transition-all duration-200"
              aria-label="YouTube"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
