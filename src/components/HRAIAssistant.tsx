import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth-context';
import { useNavigate } from 'react-router';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Renders markdown-style links [text](url) as clickable in-app navigation links
function RenderMessageContent({ content, onNavigate }: { content: string; onNavigate: (path: string) => void }) {
  const sanitizeHref = (rawHref: string): string | null => {
    const trimmed = rawHref.trim();

    // Allow only in-app absolute paths like "/dashboard", but not protocol-relative URLs ("//evil.com")
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      return trimmed;
    }

    // Allow only explicit http(s) external links
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.toString();
      }
    } catch {
      // Invalid URL -> unsafe
    }

    return null;
  };

  // Split content by markdown link pattern [text](url)
  const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
  
  return (
    <>
      {parts.map((part, idx) => {
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          const [, text, href] = linkMatch;
          const safeHref = sanitizeHref(href);
          if (!safeHref) {
            return <span key={idx}>{part}</span>;
          }

          // Internal link (starts with / but NOT // which would be a protocol-relative external URL)
          if (safeHref.startsWith('/') && !safeHref.startsWith('//')) {
            return (
              <a
                key={idx}
                href={safeHref}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(safeHref);
                }}
                className="text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer"
              >
                {text}
              </a>
            );
          }
          // External link — only allow http/https URLs validated via URL constructor
          if (href.startsWith('https://') || href.startsWith('http://')) {
            try {
              const parsed = new URL(href);
              if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
                return (
                  <a
                    key={idx}
                    href={parsed.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {text}
                  </a>
                );
              }
            } catch {
              // Invalid URL — fall through to plain text
            }
          }
          // Unsafe or invalid URL — render as plain text
          return <span key={idx}>{text}</span>;
        }
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
}

export function HRAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<React.ElementRef<typeof ScrollArea>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInAppNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const token = await getToken();
      console.log('AI Assistant: Token retrieved:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        toast.error('Please sign in to use Blumebyte');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-668731fc/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
          },
          body: JSON.stringify({
            message: userMessage.content,
            history: messages.slice(-10),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || 'Failed to get response';
        const errorDetails = errorData.details || '';
        
        console.log('AI error details:', { 
          status: response.status, 
          errorData, 
          errorMessage, 
          errorDetails,
          statusCode: errorData.statusCode,
          rawError: errorData.rawError
        });
        console.log('Full error response:', JSON.stringify(errorData, null, 2));
        
        if (errorData.statusCode === 401 || errorData.statusCode === 403) {
          toast.error('Blumebyte is not properly configured. Please contact your administrator.');
        } else if (errorData.statusCode === 429) {
          toast.error('Blumebyte is temporarily busy. Please try again in a moment.');
        } else {
          toast.error(errorMessage);
        }
        
        throw new Error(`${errorMessage}: ${errorDetails}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    toast.success('New conversation started');
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
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="h-6 w-6" />
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
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <CardTitle className="text-lg">Blumebyte</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startNewConversation}
                      className="text-white hover:bg-white/20 h-8 text-xs"
                    >
                      New Chat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsOpen(false)}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-white/90 mt-1">
                  Your AI assistant for HR policies, leave, benefits, and more
                </p>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-[400px] p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">How can I help you today?</p>
                      <p className="text-xs px-4">
                        Ask questions about company policies, benefits, time off, or any HR-related topics
                      </p>
                      <div className="mt-4 space-y-2 w-full px-2">
                        <button
                          onClick={() => setInput("What is the company's vacation policy?")}
                          className="w-full text-left text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          What is the vacation policy?
                        </button>
                        <button
                          onClick={() => setInput('How do I request time off?')}
                          className="w-full text-left text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          How do I request time off?
                        </button>
                        <button
                          onClick={() => setInput('What benefits are available?')}
                          className="w-full text-left text-xs p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          What benefits are available?
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="text-sm whitespace-pre-wrap">
                              {message.role === 'assistant' ? (
                                <RenderMessageContent content={message.content} onNavigate={handleInAppNavigate} />
                              ) : (
                                message.content
                              )}
                            </div>
                            <p
                              className={`text-xs mt-1 ${
                                message.role === 'user'
                                  ? 'text-blue-100'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {message.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your question..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Powered by Google Gemini AI
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