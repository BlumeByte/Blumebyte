import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useLanguage } from '../lib/language-context';

interface ChatMessage {
  id: string;
  isBot: boolean;
  message: string;
  timestamp: Date;
  links?: { text: string; url: string }[];
}

const FAQ_RESPONSES: Record<string, { answer: string; links?: { text: string; url: string }[] }> = {
  pricing: {
    answer: "Blumebyte offers flexible pricing: $2.59/month per employee for monthly billing or $3.59/month per employee for yearly billing. All plans include full access to our comprehensive HR management features.",
    links: [
      { text: "View Pricing Details", url: "/#pricing" },
      { text: "Get Started", url: "/company-signup" }
    ]
  },
  features: {
    answer: "Blumebyte includes: Employee Management, Leave Tracking, Attendance & Clock In/Out, Payroll & Compensation, Performance Reviews, Training Programs, Compliance Tracking, Disciplinary Actions, 360° Feedback, Meetings & Announcements, Reports & Analytics, and more!",
    links: [
      { text: "View All Features", url: "/#features" },
      { text: "Get Started", url: "/company-signup" }
    ]
  },
  signup: {
    answer: "Getting started is easy! Click 'Sign Up' to create your company account. You can add team members and start managing your HR in minutes.",
    links: [
      { text: "Create Account", url: "/company-signup" },
      { text: "Contact Sales", url: "https://blumebyte.com/contact/" }
    ]
  },
  support: {
    answer: "We're here to help! Our support team is available via email and our contact form. Get in touch and we'll respond promptly to assist you.",
    links: [
      { text: "Contact Support", url: "https://blumebyte.com/contact/" },
      { text: "Sign In", url: "/login" }
    ]
  },
  trial: {
    answer: "Get started with Blumebyte today! Create your company account and start managing your HR operations with our comprehensive platform.",
    links: [
      { text: "Create Account", url: "/company-signup" },
      { text: "View Pricing", url: "/#pricing" }
    ]
  },
  security: {
    answer: "Security is our top priority. We use enterprise-grade encryption, role-based access control, and comply with industry standards. All data is backed up daily and stored securely.",
    links: [
      { text: "Security Details", url: "/security-policy" },
      { text: "Privacy Policy", url: "/privacy-policy" }
    ]
  },
  integrations: {
    answer: "Blumebyte is designed to work seamlessly with your existing workflows. Contact our team to learn about integration options and custom solutions for your business.",
    links: [
      { text: "Contact Us", url: "https://blumebyte.com/contact/" },
      { text: "Get Started", url: "/company-signup" }
    ]
  },
  demo: {
    answer: "Interested in seeing Blumebyte in action? Create your account to explore all features, or contact our team for a personalized walkthrough.",
    links: [
      { text: "Get Started", url: "/company-signup" },
      { text: "Contact Sales", url: "https://blumebyte.com/contact/" }
    ]
  }
};

const GREETING_MESSAGE = "👋 Hi! I'm the Blumebyte assistant. I can help you with questions about our HR management platform. Try asking about pricing, features, signup, support, or anything else!";

const QUICK_QUESTIONS = [
  "What are your pricing plans?",
  "What features do you offer?",
  "How do I sign up?",
  "Do you offer a free trial?",
  "Tell me about security"
];

export function HomepageChatAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { retranslate } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    retranslate();
  }, [messages, retranslate]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Show greeting when chat opens
      setMessages([{
        id: '1',
        isBot: true,
        message: GREETING_MESSAGE,
        timestamp: new Date()
      }]);
    }
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const findBestResponse = (userMessage: string): { answer: string; links?: { text: string; url: string }[] } | null => {
    const msg = userMessage.toLowerCase();
    
    // Check for keyword matches
    if (msg.includes('price') || msg.includes('cost') || msg.includes('pricing') || msg.includes('plan')) {
      return FAQ_RESPONSES.pricing;
    }
    if (msg.includes('feature') || msg.includes('what can') || msg.includes('what do')) {
      return FAQ_RESPONSES.features;
    }
    if (msg.includes('sign up') || msg.includes('signup') || msg.includes('register') || msg.includes('create account') || msg.includes('get started')) {
      return FAQ_RESPONSES.signup;
    }
    if (msg.includes('support') || msg.includes('help') || msg.includes('contact')) {
      return FAQ_RESPONSES.support;
    }
    if (msg.includes('trial') || msg.includes('free') || msg.includes('demo')) {
      return FAQ_RESPONSES.trial;
    }
    if (msg.includes('security') || msg.includes('secure') || msg.includes('safe') || msg.includes('privacy') || msg.includes('data')) {
      return FAQ_RESPONSES.security;
    }
    if (msg.includes('integrat') || msg.includes('api') || msg.includes('connect')) {
      return FAQ_RESPONSES.integrations;
    }
    if (msg.includes('demo') || msg.includes('show me') || msg.includes('video')) {
      return FAQ_RESPONSES.demo;
    }
    
    return null;
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      isBot: false,
      message: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    setTimeout(() => {
      const response = findBestResponse(text);
      
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        isBot: true,
        message: response 
          ? response.answer 
          : "I'm not sure about that specific question. For detailed assistance, please visit our contact page or speak with our team directly.",
        timestamp: new Date(),
        links: response?.links || [
          { text: "Contact Us", url: "https://blumebyte.com/contact/" }
        ]
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-[#7C5A1A] hover:bg-[#5c4112]"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="bg-[#7C5A1A] text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    <CardTitle className="text-lg">Blumebyte Assistant</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-white/90 mt-1">
                  Ask me anything about Blumebyte
                </p>
              </CardHeader>

              <CardContent className="p-0">
                <div className="h-[450px] overflow-y-auto p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-2 ${
                          msg.isBot ? 'flex-row' : 'flex-row-reverse'
                        }`}
                      >
                        {msg.isBot && (
                          <Avatar className="h-8 w-8 mt-1 bg-[#7C5A1A]">
                            <AvatarFallback className="text-white text-xs bg-transparent">
                              <Bot className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`flex flex-col ${
                            msg.isBot ? 'items-start' : 'items-end'
                          } max-w-[80%]`}
                        >
                          <div
                            className={`rounded-lg p-3 ${
                              msg.isBot
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-[#7C5A1A] text-white'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.message}
                            </p>
                            {msg.links && msg.links.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {msg.links.map((link, idx) => {
                                  const isExternal = link.url.startsWith('http');
                                  
                                  if (isExternal) {
                                    return (
                                      <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-[#7C5A1A] hover:text-[#5c4112] hover:underline cursor-pointer"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        {link.text}
                                      </a>
                                    );
                                  }
                                  
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        // Check if it's a hash link
                                        if (link.url.includes('#')) {
                                          const [path, hash] = link.url.split('#');
                                          navigate(path || '/');
                                          // Wait for navigation then scroll to element
                                          setTimeout(() => {
                                            const element = document.getElementById(hash);
                                            if (element) {
                                              element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                          }, 100);
                                        } else {
                                          navigate(link.url);
                                        }
                                        setIsOpen(false);
                                      }}
                                      className="flex items-center gap-1 text-xs text-[#7C5A1A] hover:text-[#5c4112] hover:underline cursor-pointer"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      {link.text}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {isTyping && (
                      <div className="flex gap-2">
                        <Avatar className="h-8 w-8 mt-1 bg-[#7C5A1A]">
                          <AvatarFallback className="text-white text-xs bg-transparent">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {messages.length === 1 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Quick questions:</p>
                        <div className="space-y-1">
                          {QUICK_QUESTIONS.map((q, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendMessage(q)}
                              className="w-full justify-start text-xs h-auto py-2 text-left"
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question..."
                      disabled={isTyping}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() || isTyping}
                      size="sm"
                      className="bg-[#7C5A1A] hover:bg-[#5c4112]"
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Need more help? <a href="https://blumebyte.com/contact/" target="_blank" rel="noopener noreferrer" className="text-[#7C5A1A] hover:underline">Contact our team</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}