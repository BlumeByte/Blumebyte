import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { useRealtimeRefresh } from '../lib/use-realtime';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { Send, Loader2, MessageCircle, Trash2, RefreshCw, Search, Plus, Download, ChevronUp } from 'lucide-react';

// Number of messages to show per page in the chat window
const PAGE_SIZE = 30;

/** Export a conversation thread as a simple printable HTML page */
function exportConversationAsPdf(correspondentName: string, messages: any[], currentUserName: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Conversation with ${correspondentName}</title>
<style>
  body { font-family: sans-serif; margin: 32px; color: #111; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 24px; }
  .msg { margin-bottom: 16px; }
  .msg .header { font-size: 11px; color: #888; margin-bottom: 2px; }
  .msg .bubble { display: inline-block; padding: 10px 14px; border-radius: 12px; max-width: 70%; font-size: 13px; line-height: 1.5; white-space: pre-wrap; }
  .mine .bubble { background: #1d4ed8; color: #fff; }
  .theirs .bubble { background: #f3f4f6; color: #111; }
  .mine { text-align: right; }
</style>
</head>
<body>
<h1>Conversation with ${correspondentName}</h1>
<div class="meta">Exported on ${new Date().toLocaleString()}</div>
${messages.map(m => {
    const isMine = m.senderName === currentUserName;
    const time = new Date(m.createdAt).toLocaleString();
    return `<div class="msg ${isMine ? 'mine' : 'theirs'}">
  <div class="header">${isMine ? 'You' : m.senderName} &mdash; ${time}</div>
  <div class="bubble">${m.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
</div>`;
  }).join('')}
</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) win.onload = () => { win.print(); };
}

export function MessagesPanel() {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // New conversation dialog
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeForm, setComposeForm] = useState<any>({});
  const [sending, setSending] = useState(false);
  // Selected correspondent ID (the other person in the chat)
  const [selectedCorrespondentId, setSelectedCorrespondentId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Infinite scroll: how many messages to show at the top of the selected thread
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const chatRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [msgs, usrs] = await Promise.all([
        api('/messages', { token: accessToken }),
        api('/users/for-messages', { token: accessToken }),
      ]);
      let usersList = Array.isArray(usrs) ? usrs : [];
      if (usersList.length === 0) {
        try {
          const employees = await api('/employees', { token: accessToken });
          usersList = Array.isArray(employees) ? employees.map((e: any) => ({
            userId: e.userId || e.id,
            id: e.userId || e.id,
            name: e.name,
            email: e.email || '',
            role: e.role,
          })) : [];
        } catch { /* ignore */ }
      }
      setMessages(Array.isArray(msgs) ? msgs.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) : []);
      setUsers(usersList);
    } catch (e) { console.error('Error loading messages:', e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  useRealtimeRefresh({
    channelName: `messages-${user?.id ?? 'anon'}`,
    onRefresh: load,
    debounceMs: 500,
  });

  // Auto-scroll to bottom when new messages arrive in selected thread
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [selectedCorrespondentId, messages.length]);

  // Reset visible count when correspondent changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCorrespondentId]);

  const handleSend = async () => {
    if (!composeForm.recipientId || !composeForm.message?.trim()) {
      toast.error('Recipient and message required');
      return;
    }
    setSending(true);
    try {
      await api('/messages', { method: 'POST', body: composeForm, token: accessToken });
      toast.success('Message sent');
      setComposeOpen(false);
      setComposeForm({});
      // Open the thread with the new recipient
      setSelectedCorrespondentId(composeForm.recipientId);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSending(false);
  };

  const handleSendReply = async (recipientId: string, messageText: string) => {
    if (!messageText.trim()) return;
    try {
      await api('/messages', { method: 'POST', body: { recipientId, message: messageText }, token: accessToken });
      load();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api(`/messages/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Deleted');
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkRead = async (msgId: string) => {
    try {
      await api(`/messages/${msgId}`, { method: 'PUT', token: accessToken });
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, read: true } : m));
    } catch { /* ignore */ }
  };

  // Build a map of correspondent ID → conversation metadata
  const conversations = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; lastMessage: any; unread: number; messages: any[] }>();
    for (const m of messages) {
      const isMine = m.senderId === user?.id;
      const correspondentId = isMine ? m.recipientId : m.senderId;
      const correspondentName = isMine ? (m.recipientName || 'Unknown') : (m.senderName || 'Unknown');
      if (!map.has(correspondentId)) {
        map.set(correspondentId, { id: correspondentId, name: correspondentName, lastMessage: m, unread: 0, messages: [] });
      }
      const conv = map.get(correspondentId)!;
      conv.messages.push(m);
      if (!isMine && !m.read) conv.unread++;
      if (new Date(m.createdAt) > new Date(conv.lastMessage.createdAt)) conv.lastMessage = m;
    }
    return Array.from(map.values()).sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  }, [messages, user?.id]);

  const filteredConversations = conversations.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage?.message?.toLowerCase().includes(search.toLowerCase());
  });

  const selectedConv = conversations.find(c => c.id === selectedCorrespondentId);
  const threadMessages = selectedConv?.messages ?? [];
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);

  // Visible slice of the thread (infinite scroll loads older messages from top)
  const visibleMessages = threadMessages.slice(Math.max(0, threadMessages.length - visibleCount));
  const hasMore = threadMessages.length > visibleCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Team chat</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} aria-label="Refresh messages">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => { setComposeForm({}); setComposeOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 h-[600px]">
        {/* ── Conversation List ── */}
        <div className="col-span-1 flex flex-col h-full">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search conversations…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-0 h-full overflow-y-auto">
              {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : filteredConversations.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      className={`w-full text-left p-3 hover:bg-accent transition-colors ${selectedCorrespondentId === conv.id ? 'bg-blue-50 dark:bg-blue-950 border-l-2 border-l-blue-500' : ''}`}
                      onClick={() => {
                        setSelectedCorrespondentId(conv.id);
                        // Mark all unread messages in this conv as read
                        conv.messages.filter(m => !m.read && m.recipientId === user?.id).forEach(m => handleMarkRead(m.id));
                      }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {conv.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${conv.unread > 0 ? 'font-semibold' : 'font-medium'}`}>{conv.name}</p>
                            {conv.unread > 0 && <Badge className="bg-blue-500 text-white text-[10px] h-4 px-1.5 ml-1 shrink-0">{conv.unread}</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage?.message}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground pl-10">{new Date(conv.lastMessage.createdAt).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {totalUnread > 0 && (
            <p className="text-xs text-muted-foreground mt-1 pl-1">{totalUnread} unread message{totalUnread > 1 ? 's' : ''}</p>
          )}
        </div>

        {/* ── Chat Thread ── */}
        <div className="col-span-2 flex flex-col h-full">
          <Card className="flex-1 flex flex-col overflow-hidden h-full">
            {selectedConv ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                      {selectedConv.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{selectedConv.name}</p>
                      <p className="text-[10px] text-muted-foreground">{threadMessages.length} message{threadMessages.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportConversationAsPdf(selectedConv.name, threadMessages, user?.name || 'Me')}
                    aria-label="Export conversation as PDF"
                  >
                    <Download className="w-4 h-4 mr-1" />Export PDF
                  </Button>
                </div>

                {/* Messages area */}
                <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-muted/30">
                  {/* Load more button (infinite scroll trigger) */}
                  {hasMore && (
                    <div className="flex justify-center mb-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground"
                        onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      >
                        <ChevronUp className="w-3 h-3 mr-1" />Load earlier messages
                      </Button>
                    </div>
                  )}
                  {visibleMessages.map((m, idx) => {
                    const isMine = m.senderId === user?.id;
                    const showDate = idx === 0 || new Date(visibleMessages[idx - 1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
                    return (
                      <React.Fragment key={m.id}>
                        {showDate && (
                          <div className="flex justify-center">
                            <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                              {new Date(m.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group`}>
                          {!isMine && (
                            <div className="w-7 h-7 rounded-full bg-gray-400 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0 self-end">
                              {m.senderName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className={`max-w-[65%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                            <div
                              className={`px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words leading-relaxed ${
                                isMine
                                  ? 'bg-blue-600 text-white rounded-br-sm'
                                  : 'bg-card border border-border text-foreground rounded-bl-sm'
                              }`}
                            >
                              {m.message}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMine && m.read && <span className="ml-1 text-blue-400">✓✓</span>}
                              </span>
                              <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDelete(m.id)}
                                aria-label="Delete message"
                              >
                                <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Reply input */}
                <ReplyInput
                  onSend={(text) => handleSendReply(selectedConv.id, text)}
                />
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a conversation</p>
                  <p className="text-xs mt-1">or start a new one with the button above</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Recipient</Label>
              <Select value={composeForm.recipientId || ''} onValueChange={v => setComposeForm({ ...composeForm, recipientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.userId !== user?.id).map(u => (
                    <SelectItem key={u.userId} value={u.userId}>
                      {u.name} — {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={composeForm.message || ''}
                onChange={e => setComposeForm({ ...composeForm, message: e.target.value })}
                rows={5}
                placeholder="Type your message…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Controlled reply input kept as a separate component to preserve its own state */
function ReplyInput({ onSend }: { onSend: (text: string) => void }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    await onSend(text.trim());
    setText('');
    setSending(false);
  };

  return (
    <div className="flex gap-2 p-3 border-t bg-card shrink-0">
      <Input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type a message…"
        className="flex-1"
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
      />
      <Button size="sm" onClick={send} disabled={sending || !text.trim()} aria-label="Send message">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </Button>
    </div>
  );
}