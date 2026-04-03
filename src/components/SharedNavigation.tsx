import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { ChevronDown, BarChart3, FileText, Clock, DollarSign, Trophy, Award, UserCheck, Users, Heart, Building2, GraduationCap, Briefcase, Zap, Sparkles, Globe, Target, Shield, Briefcase as BriefcaseIcon, Book, Calendar, Video, FileCheck, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import logoImage from 'figma:asset/fc8bfa36a5c8bac46710f5cb76c2233c090fc8f2.png';

export function SharedNavigation() {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
      }
    };
  }, [closeTimeout]);

  // Dropdown menu content
  const platformMenu = [
    {
      title: 'Core Platform',
      items: [
        { name: 'Platform Overview', icon: BarChart3, description: 'Complete HR management solution' },
        { name: 'HR Data & Reporting', icon: FileText, description: 'Advanced analytics and insights' },
        { name: 'Time & Attendance', icon: Clock, description: 'Clock in/out and time tracking' },
      ]
    },
    {
      title: 'Workforce Management',
      items: [
        { name: 'Payroll', icon: DollarSign, description: 'Streamlined payroll processing' },
        { name: 'Performance Management', icon: Trophy, description: 'Track and improve performance' },
        { name: 'Compensation', icon: Award, description: 'Manage pay grades and bonuses' },
      ]
    },
    {
      title: 'Talent & Growth',
      items: [
        { name: 'Applicant Tracking', icon: UserCheck, description: 'Recruit and hire top talent' },
        { name: 'Onboarding', icon: Users, description: 'Seamless new hire experience' },
        { name: 'Employee Experience', icon: Heart, description: 'Boost engagement and satisfaction' },
      ]
    }
  ];

  const solutionsMenu = [
    {
      title: 'By Industry',
      items: [
        { name: 'Construction', icon: Building2 },
        { name: 'Education', icon: GraduationCap },
        { name: 'Finance', icon: DollarSign },
        { name: 'Healthcare', icon: Heart },
        { name: 'Manufacturing', icon: Briefcase },
        { name: 'Technology', icon: Zap },
      ]
    }
  ];

  const resourcesMenu = [
    {
      title: 'Learn',
      items: [
        { name: 'HR Toolkit', icon: BriefcaseIcon, description: 'Templates and tools' },
        { name: 'Content Library', icon: Book, description: 'Guides and resources' },
        { name: 'HR Glossary', icon: FileText, description: 'Industry terminology' },
        { name: 'Webinar Library', icon: Video, description: 'On-demand videos' },
        { name: 'Events Hub', icon: Calendar, description: 'Upcoming events' },
        { name: 'HR Virtual Summit', icon: Trophy, description: 'Annual conference' },
      ]
    }
  ];

  const handleMouseEnter = (menu: string) => {
    setOpenDropdown(menu);
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
  };

  const handleMouseLeave = () => {
    setCloseTimeout(setTimeout(() => setOpenDropdown(null), 200));
  };

  const DropdownMenu = ({ menu, content }: { menu: string; content: any[] }) => (
    <div
      className="relative"
      onMouseEnter={() => handleMouseEnter(menu)}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors">
        {menu}
        <ChevronDown className="h-4 w-4" />
      </button>
      
      {openDropdown === menu && (
        <>
          {/* Invisible bridge to prevent gap issues */}
          <div className="absolute top-full left-0 right-0 h-2" />
          
          <div 
            className={`absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-6 ${
              menu === 'Resources' || menu === 'Solutions' ? 'w-[350px]' : 'w-[600px]'
            }`}
            onMouseEnter={() => handleMouseEnter(menu)}
          >
            <div className={menu === 'Resources' || menu === 'Solutions' ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-6'}>
              {content.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                  <ul className="space-y-2">
                    {section.items.map((item: any, itemIdx: number) => (
                      <li key={itemIdx}>
                        <button 
                          onClick={() => {
                            setOpenDropdown(null);
                            if (menu === 'Our Platform') {
                              // Route to specific platform pages
                              const routeMap: { [key: string]: string } = {
                                'Platform Overview': '/platform-overview',
                                'HR Data & Reporting': '/hr-data-reporting',
                                'Time & Attendance': '/time-attendance',
                                'Payroll': '/payroll',
                                'Performance Management': '/performance-management',
                                'Compensation': '/compensation',
                                'Applicant Tracking': '/applicant-tracking',
                                'Onboarding': '/onboarding',
                                'Employee Experience': '/employee-experience',
                              };
                              navigate(routeMap[item.name] || '/platform-overview');
                            } else if (menu === 'Solutions') {
                              navigate(`/industry/${item.name.toLowerCase()}`);
                            } else if (menu === 'Resources') {
                              // Link all resources to YouTube channel
                              window.open('https://www.youtube.com/@BlumeByte', '_blank');
                            }
                          }}
                          className="flex items-start gap-3 w-full text-left p-2 rounded-md hover:bg-gray-50 transition-colors group"
                        >
                          <item.icon className="h-5 w-5 text-gray-400 group-hover:text-black mt-0.5 shrink-0" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 group-hover:text-black">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {item.description}
                              </div>
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
        </>
      )}
    </div>
  );

  return (
    <nav className="border-b bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <img src={logoImage} alt="Blumebyte" className="h-8 cursor-pointer" onClick={() => navigate('/')} />
            
            {/* Desktop Navigation with Dropdowns */}
            <div className="hidden md:flex items-center gap-1">
              <DropdownMenu menu="Our Platform" content={platformMenu} />
              <DropdownMenu menu="Solutions" content={solutionsMenu} />
              <DropdownMenu menu="Resources" content={resourcesMenu} />
              <button 
                onClick={() => navigate('/pricing')}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
              >
                Pricing
              </button>
            </div>
          </div>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex gap-3">
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/company-signup')} className="bg-black text-white hover:bg-gray-800">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>
                  <img src={logoImage} alt="Blumebyte" className="h-8" />
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {/* Mobile Menu Content */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="platform">
                    <AccordionTrigger className="text-sm font-medium">Our Platform</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pl-2">
                        {platformMenu.map((section, idx) => (
                          <div key={idx}>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{section.title}</h4>
                            <div className="space-y-2">
                              {section.items.map((item: any, itemIdx: number) => (
                                <button
                                  key={itemIdx}
                                  onClick={() => {
                                    const routeMap: { [key: string]: string } = {
                                      'Platform Overview': '/platform-overview',
                                      'HR Data & Reporting': '/hr-data-reporting',
                                      'Time & Attendance': '/time-attendance',
                                      'Payroll': '/payroll',
                                      'Performance Management': '/performance-management',
                                      'Compensation': '/compensation',
                                      'Applicant Tracking': '/applicant-tracking',
                                      'Onboarding': '/onboarding',
                                      'Employee Experience': '/employee-experience',
                                    };
                                    navigate(routeMap[item.name] || '/platform-overview');
                                    setMobileMenuOpen(false);
                                  }}
                                  className="flex items-start gap-2 w-full text-left p-2 rounded-md hover:bg-gray-50"
                                >
                                  <item.icon className="h-4 w-4 text-gray-400 mt-0.5" />
                                  <div>
                                    <div className="text-sm font-medium">{item.name}</div>
                                    <div className="text-xs text-gray-500">{item.description}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="solutions">
                    <AccordionTrigger className="text-sm font-medium">Solutions</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2">
                        {solutionsMenu[0].items.map((item: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              navigate(`/industry/${item.name.toLowerCase()}`);
                              setMobileMenuOpen(false);
                            }}
                            className="flex items-center gap-2 w-full text-left p-2 rounded-md hover:bg-gray-50"
                          >
                            <item.icon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="resources">
                    <AccordionTrigger className="text-sm font-medium">Resources</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2">
                        {resourcesMenu[0].items.map((item: any, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => {
                              window.open('https://www.youtube.com/@BlumeByte', '_blank');
                              setMobileMenuOpen(false);
                            }}
                            className="flex items-start gap-2 w-full text-left p-2 rounded-md hover:bg-gray-50"
                          >
                            <item.icon className="h-4 w-4 text-gray-400 mt-0.5" />
                            <div>
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <button
                  onClick={() => {
                    navigate('/pricing');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-gray-50 rounded-md"
                >
                  Pricing
                </button>

                {/* Mobile Auth Buttons */}
                <div className="pt-4 space-y-2 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="w-full bg-black text-white hover:bg-gray-800"
                    onClick={() => {
                      navigate('/company-signup');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}