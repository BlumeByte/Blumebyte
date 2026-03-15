import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Plus, Bell, Calendar, Heart, Users, Gift, Cake, Star, Pin, MessageCircle } from 'lucide-react';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'general' | 'urgent' | 'celebration' | 'policy' | 'event';
  author: string;
  authorAvatar?: string;
  publishedDate: Date;
  expiryDate?: Date;
  pinned: boolean;
  targetAudience: 'all' | 'department' | 'team' | 'management';
  department?: string;
  reactions: { [emoji: string]: number };
  comments: Comment[];
  status: 'draft' | 'published' | 'archived';
}

interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  date: Date;
}

interface Celebration {
  id: string;
  type: 'birthday' | 'anniversary' | 'welcome' | 'promotion' | 'achievement';
  employeeName: string;
  employeeAvatar?: string;
  date: Date;
  details: string;
  yearsOfService?: number;
  newRole?: string;
  achievement?: string;
}

const mockAnnouncements: Announcement[] = [
  {
    id: 'ANN001',
    title: 'New Remote Work Policy Update',
    content: 'We are updating our remote work policy to provide more flexibility. All employees can now work remotely up to 3 days per week. Please review the updated policy document and confirm your acknowledgment by Friday.',
    type: 'policy',
    author: 'Alexandra HR',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    publishedDate: new Date('2024-12-20'),
    expiryDate: new Date('2024-12-31'),
    pinned: true,
    targetAudience: 'all',
    reactions: { '👍': 15, '❤️': 8, '🎉': 3 },
    comments: [
      {
        id: 'C1',
        author: 'Sarah Johnson',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        content: 'This is great news! Really appreciate the flexibility.',
        date: new Date('2024-12-20')
      }
    ],
    status: 'published'
  },
  {
    id: 'ANN002',
    title: 'Holiday Party - December 22nd',
    content: 'Join us for our annual holiday party on December 22nd at 6 PM in the main conference room. Food, drinks, and good company guaranteed! RSVP by December 20th.',
    type: 'event',
    author: 'HR Team',
    publishedDate: new Date('2024-12-15'),
    expiryDate: new Date('2024-12-22'),
    pinned: false,
    targetAudience: 'all',
    reactions: { '🎉': 12, '🍕': 5, '🎊': 7 },
    comments: [],
    status: 'published'
  },
  {
    id: 'ANN003',
    title: 'Q4 Performance Reviews Starting',
    content: 'Q4 performance reviews will begin next week. Managers will be scheduling 1:1 meetings with their team members. Please prepare your self-evaluation forms.',
    type: 'general',
    author: 'Alexandra HR',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    publishedDate: new Date('2024-12-18'),
    pinned: false,
    targetAudience: 'all',
    reactions: { '📋': 8, '👍': 4 },
    comments: [],
    status: 'published'
  },
  {
    id: 'ANN004',
    title: 'System Maintenance Window',
    content: 'Our internal systems will be undergoing maintenance on Saturday, December 23rd from 2-6 AM PST. Some services may be temporarily unavailable.',
    type: 'urgent',
    author: 'IT Team',
    publishedDate: new Date('2024-12-19'),
    pinned: true,
    targetAudience: 'all',
    reactions: { '⚠️': 6, '👍': 3 },
    comments: [],
    status: 'published'
  }
];

const mockCelebrations: Celebration[] = [
  {
    id: 'CEL001',
    type: 'birthday',
    employeeName: 'Emma Wilson',
    employeeAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face',
    date: new Date(),
    details: 'Wishing Emma a wonderful birthday! 🎂'
  },
  {
    id: 'CEL002',
    type: 'anniversary',
    employeeName: 'Mike Chen',
    employeeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
    date: addDays(new Date(), 1),
    details: 'Celebrating 3 years at Blumebyte!',
    yearsOfService: 3
  },
  {
    id: 'CEL003',
    type: 'promotion',
    employeeName: 'Sarah Johnson',
    employeeAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
    date: new Date('2024-12-15'),
    details: 'Congratulations on your promotion!',
    newRole: 'Senior Frontend Developer'
  },
  {
    id: 'CEL004',
    type: 'welcome',
    employeeName: 'Alex Rivera',
    date: new Date('2024-12-18'),
    details: 'Welcome to the Blumebyte family!'
  }
];

export function AnnouncementsModule({ userRole }: { userRole: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [celebrations] = useState<Celebration[]>(mockCelebrations);
  const [showNewAnnouncementDialog, setShowNewAnnouncementDialog] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'general',
    targetAudience: 'all',
    department: '',
    expiryDate: '',
    pinned: false
  });

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.content) return;

    const announcement: Announcement = {
      id: `ANN${String(announcements.length + 1).padStart(3, '0')}`,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      type: newAnnouncement.type as any,
      author: userRole === 'hr' ? 'Alexandra HR' : 'Current User',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
      publishedDate: new Date(),
      expiryDate: newAnnouncement.expiryDate ? new Date(newAnnouncement.expiryDate) : undefined,
      pinned: newAnnouncement.pinned,
      targetAudience: newAnnouncement.targetAudience as any,
      department: newAnnouncement.department || undefined,
      reactions: {},
      comments: [],
      status: 'published'
    };

    setAnnouncements(prev => [announcement, ...prev]);
    setShowNewAnnouncementDialog(false);
    setNewAnnouncement({
      title: '',
      content: '',
      type: 'general',
      targetAudience: 'all',
      department: '',
      expiryDate: '',
      pinned: false
    });
  };

  const addReaction = (announcementId: string, emoji: string) => {
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id === announcementId) {
        const newReactions = { ...ann.reactions };
        newReactions[emoji] = (newReactions[emoji] || 0) + 1;
        return { ...ann, reactions: newReactions };
      }
      return ann;
    }));
  };

  const togglePin = (announcementId: string) => {
    setAnnouncements(prev => prev.map(ann => 
      ann.id === announcementId ? { ...ann, pinned: !ann.pinned } : ann
    ));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'celebration': return 'bg-green-100 text-green-800';
      case 'policy': return 'bg-blue-100 text-blue-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'urgent': return <Bell className="w-4 h-4" />;
      case 'celebration': return <Gift className="w-4 h-4" />;
      case 'policy': return <MessageCircle className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'general': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getCelebrationIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Cake className="w-5 h-5 text-pink-500" />;
      case 'anniversary': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'welcome': return <Users className="w-5 h-5 text-blue-500" />;
      case 'promotion': return <Star className="w-5 h-5 text-green-500" />;
      case 'achievement': return <Star className="w-5 h-5 text-purple-500" />;
      default: return <Gift className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatCelebrationDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd');
  };

  const pinnedAnnouncements = announcements.filter(ann => ann.pinned && ann.status === 'published');
  const regularAnnouncements = announcements.filter(ann => !ann.pinned && ann.status === 'published');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Announcements & Celebrations</h2>
          <p className="text-gray-600">Stay updated with company news and celebrate milestones</p>
        </div>
        {(userRole === 'hr' || userRole === 'manager') && (
          <Dialog open={showNewAnnouncementDialog} onOpenChange={setShowNewAnnouncementDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Announcement title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={newAnnouncement.type} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="celebration">Celebration</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Audience</Label>
                    <Select value={newAnnouncement.targetAudience} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, targetAudience: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Employees</SelectItem>
                        <SelectItem value="department">Specific Department</SelectItem>
                        <SelectItem value="team">Specific Team</SelectItem>
                        <SelectItem value="management">Management Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newAnnouncement.targetAudience === 'department' && (
                  <div>
                    <Label>Department</Label>
                    <Select value={newAnnouncement.department} onValueChange={(value) => setNewAnnouncement(prev => ({ ...prev, department: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">Human Resources</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={newAnnouncement.content}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Announcement content..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newAnnouncement.expiryDate}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={newAnnouncement.pinned}
                    onChange={(e) => setNewAnnouncement(prev => ({ ...prev, pinned: e.target.checked }))}
                  />
                  <Label htmlFor="pinned">Pin to top</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewAnnouncementDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAnnouncement}>
                    Publish Announcement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Announcements</CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pinned Posts</CardTitle>
            <Pin className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pinnedAnnouncements.length}</div>
            <p className="text-xs text-muted-foreground">High priority</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Birthdays</CardTitle>
            <Cake className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {celebrations.filter(c => c.type === 'birthday').length}
            </div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Work Anniversaries</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {celebrations.filter(c => c.type === 'anniversary').length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="announcements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="celebrations">Celebrations</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <div className="space-y-4">
            {/* Pinned Announcements */}
            {pinnedAnnouncements.length > 0 && (
              <div>
                <h3 className="font-medium text-lg mb-3 flex items-center">
                  <Pin className="w-5 h-5 mr-2" />
                  Pinned Announcements
                </h3>
                <div className="space-y-3">
                  {pinnedAnnouncements.map((announcement) => (
                    <Card key={announcement.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={announcement.authorAvatar} />
                              <AvatarFallback>
                                {announcement.author.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">{announcement.title}</h4>
                              <p className="text-sm text-gray-600">
                                By {announcement.author} • {format(announcement.publishedDate, 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getTypeColor(announcement.type)}>
                              {getTypeIcon(announcement.type)}
                              <span className="ml-1">{announcement.type}</span>
                            </Badge>
                            {userRole === 'hr' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => togglePin(announcement.id)}
                              >
                                <Pin className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{announcement.content}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {Object.entries(announcement.reactions).map(([emoji, count]) => (
                                <button
                                  key={emoji}
                                  onClick={() => addReaction(announcement.id, emoji)}
                                  className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              ))}
                              <button
                                onClick={() => addReaction(announcement.id, '👍')}
                                className="px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                              >
                                +
                              </button>
                            </div>
                            {announcement.comments.length > 0 && (
                              <div className="flex items-center space-x-1 text-sm text-gray-600">
                                <MessageCircle className="w-4 h-4" />
                                <span>{announcement.comments.length} comments</span>
                              </div>
                            )}
                          </div>
                          {announcement.expiryDate && (
                            <div className="text-sm text-gray-500">
                              Expires {format(announcement.expiryDate, 'MMM dd')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Regular Announcements */}
            <div>
              <h3 className="font-medium text-lg mb-3">Recent Announcements</h3>
              <div className="space-y-3">
                {regularAnnouncements.map((announcement) => (
                  <Card key={announcement.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={announcement.authorAvatar} />
                            <AvatarFallback>
                              {announcement.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">{announcement.title}</h4>
                            <p className="text-sm text-gray-600">
                              By {announcement.author} • {format(announcement.publishedDate, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTypeColor(announcement.type)}>
                            {getTypeIcon(announcement.type)}
                            <span className="ml-1">{announcement.type}</span>
                          </Badge>
                          {userRole === 'hr' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => togglePin(announcement.id)}
                            >
                              <Pin className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{announcement.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {Object.entries(announcement.reactions).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(announcement.id, emoji)}
                                className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                              >
                                <span>{emoji}</span>
                                <span>{count}</span>
                              </button>
                            ))}
                            <button
                              onClick={() => addReaction(announcement.id, '👍')}
                              className="px-2 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-sm"
                            >
                              +
                            </button>
                          </div>
                          {announcement.comments.length > 0 && (
                            <div className="flex items-center space-x-1 text-sm text-gray-600">
                              <MessageCircle className="w-4 h-4" />
                              <span>{announcement.comments.length} comments</span>
                            </div>
                          )}
                        </div>
                        {announcement.expiryDate && (
                          <div className="text-sm text-gray-500">
                            Expires {format(announcement.expiryDate, 'MMM dd')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="celebrations">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Team Celebrations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {celebrations.map((celebration) => (
                <Card key={celebration.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-3">
                      {getCelebrationIcon(celebration.type)}
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={celebration.employeeAvatar} />
                        <AvatarFallback>
                          {celebration.employeeName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium">{celebration.employeeName}</h4>
                        <p className="text-sm text-gray-600">{celebration.details}</p>
                        {celebration.yearsOfService && (
                          <p className="text-sm text-gray-500">{celebration.yearsOfService} years of service</p>
                        )}
                        {celebration.newRole && (
                          <p className="text-sm text-gray-500">New role: {celebration.newRole}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          {formatCelebrationDate(celebration.date)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upcoming">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">Upcoming Events & Milestones</h3>
            <div className="space-y-3">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Holiday Party</h4>
                      <p className="text-sm text-gray-600">December 22nd, 6:00 PM</p>
                    </div>
                    <Badge variant="outline">2 days</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Cake className="w-5 h-5 text-pink-500" />
                    <div>
                      <h4 className="font-medium">Emma Wilson's Birthday</h4>
                      <p className="text-sm text-gray-600">Today</p>
                    </div>
                    <Badge variant="outline">Today</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h4 className="font-medium">Mike Chen's Work Anniversary</h4>
                      <p className="text-sm text-gray-600">3 years at Blumebyte</p>
                    </div>
                    <Badge variant="outline">Tomorrow</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}