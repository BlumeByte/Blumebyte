import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Users, Info, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../lib/auth-context';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
}

export function EmployeeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showClearingAlert, setShowClearingAlert] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, accessToken } = useAuth();
  const pollInterval = useRef<number>();

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages from server
  const fetchMessages = React.useCallback(async () => {
    try {
      const token = accessToken;
      if (!token) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-668731fc/chat/messages`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [accessToken]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      fetchMessages();
      
      // PERFORMANCE: Poll for new messages every 10 seconds instead of 3
      pollInterval.current = window.setInterval(fetchMessages, 10000);
    } else {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    }

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [isOpen, fetchMessages]);

  // Don't render if no user is logged in (moved after all hooks)
  if (!user) {
    return null;
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const token = accessToken;
      if (!token) {
        toast.error('Please sign in to send messages');
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-668731fc/chat/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-User-Token': token,
          },
          body: JSON.stringify({
            message: messageText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Fetch updated messages
      await fetchMessages();
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
      // Restore input if failed
      setInput(messageText);
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
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
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
              <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <CardTitle className="text-lg">Blumebyte Chat</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-primary-foreground/90 mt-1">
                  Chat with your colleagues
                </p>
              </CardHeader>

              <CardContent className="p-0">
                {/* Weekly Clearing Alert */}
                {showClearingAlert && (
                  <Alert className="m-3 mb-0 border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800 flex items-start justify-between gap-2">
                      <span>
                        <strong>Notice:</strong> Chat messages are automatically cleared every Sunday at midnight for security and privacy. Please save important information elsewhere.
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowClearingAlert(false)}
                        className="h-4 w-4 p-0 hover:bg-transparent"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="h-[400px] overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-sm font-medium mb-1">No messages yet</p>
                      <p className="text-xs px-4">
                        Start a conversation with your team
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isOwnMessage = msg.userId === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${
                              isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <Avatar className="h-8 w-8 mt-1">
                              <AvatarFallback className="text-xs">
                                {getInitials(msg.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`flex flex-col ${
                                isOwnMessage ? 'items-end' : 'items-start'
                              } max-w-[70%]`}
                            >
                              <p className="text-xs text-muted-foreground mb-1">
                                {isOwnMessage ? 'You' : msg.userName}
                              </p>
                              <div
                                className={`rounded-lg p-3 ${
                                  isOwnMessage
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {msg.message}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                <div className="border-t p-3">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading}
                      size="sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}