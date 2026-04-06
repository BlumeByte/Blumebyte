import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { useRealtimeRefresh } from '../lib/use-realtime';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Send, Loader2, MessageCircle, Mail, Reply, Trash2, RefreshCw, Search } from 'lucide-react';

export function MessagesPanel() {
  const { user, accessToken } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [sending, setSending] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [msgs, usrs] = await Promise.all([
        api('/messages', { token: accessToken }),
        api('/users/for-messages', { token: accessToken }),
      ]);
      console.log('Messages loaded:', msgs);
      console.log('Users for messages loaded:', usrs);
      
      // If no users returned, try fallback to /employees endpoint
      let usersList = Array.isArray(usrs) ? usrs : [];
      if (usersList.length === 0) {
        console.log('No users from /users/for-messages, trying /employees fallback...');
        try {
          const employees = await api('/employees', { token: accessToken });
          console.log('Employees fallback loaded:', employees);
          usersList = Array.isArray(employees) ? employees.map((e: any) => ({
            userId: e.userId || e.id,
            id: e.userId || e.id,
            name: e.name,
            email: e.email || '',
            role: e.role,
            department: e.department || '',
            position: e.position || '',
            profileImageUrl: e.profileImageUrl || '',
            company: e.company || e.companyId || '',
          })) : [];
        } catch (fallbackErr) {
          console.error('Fallback /employees also failed:', fallbackErr);
        }
      }
      
      setMessages(Array.isArray(msgs) ? msgs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
      setUsers(usersList);
      console.log('Final users list set:', usersList.length, 'users');
    } catch (e) { 
      console.error('Error loading messages/users:', e); 
    }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  // Subscribe to realtime updates for messages
  useRealtimeRefresh({
    channelName: 'messages',
    onRefresh: load,
    debounceMs: 500,
  });

  const handleSend = async () => {
    if (!formData.recipientId || !formData.message) {
      toast.error('Recipient and message required');
      return;
    }
    setSending(true);
    try {
      await api('/messages', { method: 'POST', body: formData, token: accessToken });
      toast.success('Message sent');
      setDialogOpen(false);
      setFormData({});
      load();
    } catch (e: any) { toast.error(e.message); }
    setSending(false);
  };

  const handleReply = (msg: any) => {
    setFormData({
      recipientId: msg.senderId,
      message: '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api(`/messages/${id}`, { method: 'DELETE', token: accessToken });
      toast.success('Message deleted');
      setMessages(prev => prev.filter(m => m.id !== id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (e: any) { toast.error(e.message); }
  };

  const handleMarkRead = async (msg: any) => {
    if (msg.read || msg.recipientId !== user?.id) return;
    try {
      await api(`/messages/${msg.id}`, { method: 'PUT', token: accessToken });
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
    } catch (e) { console.log(e); }
  };

  const sentMessages = messages.filter((m: any) => m.senderId === user?.id);
  const receivedMessages = messages.filter((m: any) => m.recipientId === user?.id);
  const unreadCount = receivedMessages.filter(m => !m.read).length;

  const currentList = activeTab === 'inbox' ? receivedMessages : sentMessages;
  const filteredList = currentList.filter(m => {
    if (!search) return true;
    const s = search.toLowerCase();
    return m.senderName?.toLowerCase().includes(s) || m.recipientName?.toLowerCase().includes(s) || m.message?.toLowerCase().includes(s);
  });

  const getRecipientName = (id: string) => {
    const u = users.find(u => u.userId === id);
    return u?.name || 'Unknown';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Messages</h2>
          <p className="text-sm text-gray-500 mt-1">Send and receive messages with colleagues</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button onClick={() => { setFormData({}); setDialogOpen(true); }}>
            <Send className="w-4 h-4 mr-2" />New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Message List */}
        <div className="col-span-1">
          <div className="flex gap-1 mb-3">
            <Button variant={activeTab === 'inbox' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setActiveTab('inbox')}>
              <Mail className="w-4 h-4 mr-1" />Inbox {unreadCount > 0 && <Badge className="ml-1 bg-red-500 text-white text-[10px] h-5">{unreadCount}</Badge>}
            </Button>
            <Button variant={activeTab === 'sent' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setActiveTab('sent')}>
              <Send className="w-4 h-4 mr-1" />Sent <Badge variant="outline" className="ml-1 text-[10px] h-5">{sentMessages.length}</Badge>
            </Button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search messages..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
              ) : filteredList.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages</p>
                </div>
              ) : (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {filteredList.map(m => (
                    <div key={m.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?.id === m.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''} ${activeTab === 'inbox' && !m.read ? 'bg-blue-50/50' : ''}`}
                      onClick={() => { setSelectedMessage(m); handleMarkRead(m); }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${!m.read && activeTab === 'inbox' ? 'font-semibold' : 'font-medium'}`}>
                            {activeTab === 'inbox' ? m.senderName : `To: ${m.recipientName}`}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{m.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                        </div>
                        {activeTab === 'inbox' && !m.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0 ml-2" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardContent className="p-0 h-full">
              {selectedMessage ? (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">
                          {selectedMessage.senderId === user?.id ? `To: ${selectedMessage.recipientName}` : `From: ${selectedMessage.senderName}`}
                        </p>
                        <p className="text-xs text-gray-500">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex gap-1">
                        {selectedMessage.senderId !== user?.id && (
                          <Button size="sm" variant="outline" onClick={() => handleReply(selectedMessage)}>
                            <Reply className="w-4 h-4 mr-1" />Reply
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(selectedMessage.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex-1">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                  </div>
                  {selectedMessage.senderId !== user?.id && (
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type a quick reply..."
                          className="flex-1"
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && (e.target as HTMLInputElement).value.trim()) {
                              const msg = (e.target as HTMLInputElement).value.trim();
                              try {
                                await api('/messages', { method: 'POST', body: { recipientId: selectedMessage.senderId, message: msg }, token: accessToken });
                                toast.success('Reply sent');
                                (e.target as HTMLInputElement).value = '';
                                load();
                              } catch (err: any) { toast.error(err.message); }
                            }
                          }}
                        />
                        <Button size="sm" variant="outline" onClick={() => handleReply(selectedMessage)}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full py-24 text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Select a message to read</p>
                    <p className="text-xs text-gray-400 mt-1">Or compose a new message</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compose Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{formData.recipientId ? `Reply to ${getRecipientName(formData.recipientId)}` : 'New Message'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Recipient</Label>
              <Select value={formData.recipientId || ''} onValueChange={v => setFormData({ ...formData, recipientId: v })}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.userId !== user?.id).map(u => (
                    <SelectItem key={u.userId} value={u.userId}>
                      {u.name} - {u.role} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={formData.message || ''}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                rows={6}
                placeholder="Type your message here..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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