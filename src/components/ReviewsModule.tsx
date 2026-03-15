import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Plus, Calendar as CalendarIcon, Eye, Edit, Upload, Star, Target, TrendingUp, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Review {
  id: string;
  employeeName: string;
  employeeId: string;
  reviewerName: string;
  reviewerId: string;
  scheduledDate: Date;
  completedDate?: Date;
  reviewType: 'quarterly' | 'annual' | 'promotion' | 'probation';
  cpfLevel: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  overallRating?: number;
  publicNotes: string;
  privateNotes: string;
  goals: Goal[];
  actionItems: ActionItem[];
  documents: Document[];
}

interface Goal {
  id: string;
  description: string;
  status: 'not-started' | 'in-progress' | 'completed';
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
}

interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  dueDate: Date;
  status: 'pending' | 'completed';
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: Date;
  size: string;
}

const mockReviews: Review[] = [
  {
    id: 'REV001',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    reviewerName: 'Alex Rodriguez',
    reviewerId: 'EMP100',
    scheduledDate: new Date('2025-01-15'),
    reviewType: 'quarterly',
    cpfLevel: 'L4 - Senior Engineer',
    status: 'scheduled',
    publicNotes: '',
    privateNotes: '',
    goals: [],
    actionItems: [],
    documents: []
  },
  {
    id: 'REV002',
    employeeName: 'Mike Chen',
    employeeId: 'EMP002',
    reviewerName: 'Alex Rodriguez',
    reviewerId: 'EMP100',
    scheduledDate: new Date('2024-12-01'),
    completedDate: new Date('2024-12-05'),
    reviewType: 'quarterly',
    cpfLevel: 'L3 - Mid-level Engineer',
    status: 'completed',
    overallRating: 4,
    publicNotes: 'Mike has shown excellent technical growth this quarter. His work on the API gateway project has been outstanding.',
    privateNotes: 'Consider for promotion to L4 next quarter. Needs to work on leadership skills.',
    goals: [
      {
        id: 'G1',
        description: 'Lead a small team on the next project',
        status: 'not-started',
        dueDate: new Date('2025-03-01'),
        priority: 'high'
      },
      {
        id: 'G2',
        description: 'Complete advanced architecture course',
        status: 'in-progress',
        dueDate: new Date('2025-02-15'),
        priority: 'medium'
      }
    ],
    actionItems: [
      {
        id: 'A1',
        description: 'Enroll in leadership development program',
        assignee: 'Mike Chen',
        dueDate: new Date('2025-01-15'),
        status: 'pending'
      }
    ],
    documents: [
      {
        id: 'D1',
        name: 'Performance Review Form Q4 2024.pdf',
        type: 'pdf',
        uploadDate: new Date('2024-12-05'),
        size: '2.3 MB'
      }
    ]
  },
  {
    id: 'REV003',
    employeeName: 'Emma Wilson',
    employeeId: 'EMP003',
    reviewerName: 'Sarah Creative',
    reviewerId: 'EMP101',
    scheduledDate: new Date('2024-11-15'),
    reviewType: 'probation',
    cpfLevel: 'L2 - Junior Designer',
    status: 'overdue',
    publicNotes: '',
    privateNotes: '',
    goals: [],
    actionItems: [],
    documents: []
  }
];

export function ReviewsModule({ userRole }: { userRole: string }) {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showReviewDetails, setShowReviewDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const [newReview, setNewReview] = useState({
    employeeId: '',
    reviewType: '',
    scheduledDate: '',
    cpfLevel: ''
  });

  const [reviewForm, setReviewForm] = useState({
    overallRating: 0,
    publicNotes: '',
    privateNotes: '',
    newGoal: '',
    newActionItem: '',
    actionAssignee: '',
    goalPriority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleScheduleReview = () => {
    if (!selectedDate || !newReview.employeeId || !newReview.reviewType) return;
    
    const review: Review = {
      id: `REV${String(reviews.length + 1).padStart(3, '0')}`,
      employeeName: 'New Employee',
      employeeId: newReview.employeeId,
      reviewerName: userRole === 'hr' ? 'Alexandra HR' : 'Current User',
      reviewerId: 'CURRENT',
      scheduledDate: selectedDate,
      reviewType: newReview.reviewType as any,
      cpfLevel: newReview.cpfLevel,
      status: 'scheduled',
      publicNotes: '',
      privateNotes: '',
      goals: [],
      actionItems: [],
      documents: []
    };
    
    setReviews(prev => [review, ...prev]);
    setShowScheduleDialog(false);
    setNewReview({
      employeeId: '',
      reviewType: '',
      scheduledDate: '',
      cpfLevel: ''
    });
    setSelectedDate(undefined);
  };

  const addGoal = () => {
    if (!reviewForm.newGoal || !selectedReview) return;
    
    const goal: Goal = {
      id: `G${Date.now()}`,
      description: reviewForm.newGoal,
      status: 'not-started',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      priority: reviewForm.goalPriority
    };
    
    setSelectedReview(prev => prev ? {
      ...prev,
      goals: [...prev.goals, goal]
    } : null);
    
    setReviewForm(prev => ({ ...prev, newGoal: '' }));
  };

  const addActionItem = () => {
    if (!reviewForm.newActionItem || !reviewForm.actionAssignee || !selectedReview) return;
    
    const actionItem: ActionItem = {
      id: `A${Date.now()}`,
      description: reviewForm.newActionItem,
      assignee: reviewForm.actionAssignee,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'pending'
    };
    
    setSelectedReview(prev => prev ? {
      ...prev,
      actionItems: [...prev.actionItems, actionItem]
    } : null);
    
    setReviewForm(prev => ({ ...prev, newActionItem: '', actionAssignee: '' }));
  };

  const updateReviewStatus = (reviewId: string, status: Review['status']) => {
    setReviews(prev => prev.map(review => 
      review.id === reviewId 
        ? { ...review, status, ...(status === 'completed' ? { completedDate: new Date() } : {}) }
        : review
    ));
  };

  const saveReview = () => {
    if (!selectedReview) return;
    
    const updatedReview = {
      ...selectedReview,
      overallRating: reviewForm.overallRating,
      publicNotes: reviewForm.publicNotes,
      privateNotes: reviewForm.privateNotes,
      status: 'completed' as const,
      completedDate: new Date()
    };
    
    setReviews(prev => prev.map(review => 
      review.id === selectedReview.id ? updatedReview : review
    ));
    
    setShowReviewDetails(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quarterly': return 'bg-blue-100 text-blue-800';
      case 'annual': return 'bg-purple-100 text-purple-800';
      case 'promotion': return 'bg-green-100 text-green-800';
      case 'probation': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Reviews</h2>
          <p className="text-gray-600">Schedule and manage employee performance evaluations</p>
        </div>
        {(userRole === 'hr' || userRole === 'manager') && (
          <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Performance Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select value={newReview.employeeId} onValueChange={(value) => setNewReview(prev => ({ ...prev, employeeId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMP001">Sarah Johnson</SelectItem>
                      <SelectItem value="EMP002">Mike Chen</SelectItem>
                      <SelectItem value="EMP003">Emma Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Review Type</Label>
                  <Select value={newReview.reviewType} onValueChange={(value) => setNewReview(prev => ({ ...prev, reviewType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select review type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quarterly">Quarterly Review</SelectItem>
                      <SelectItem value="annual">Annual Review</SelectItem>
                      <SelectItem value="promotion">Promotion Review</SelectItem>
                      <SelectItem value="probation">Probation Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>CPF Level</Label>
                  <Select value={newReview.cpfLevel} onValueChange={(value) => setNewReview(prev => ({ ...prev, cpfLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CPF level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L1 - Entry Level">L1 - Entry Level</SelectItem>
                      <SelectItem value="L2 - Junior">L2 - Junior</SelectItem>
                      <SelectItem value="L3 - Mid-level">L3 - Mid-level</SelectItem>
                      <SelectItem value="L4 - Senior">L4 - Senior</SelectItem>
                      <SelectItem value="L5 - Lead">L5 - Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Scheduled Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleScheduleReview}>
                    Schedule Review
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Review Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>CPF Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>{review.employeeName}</TableCell>
                  <TableCell>{review.reviewerName}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(review.reviewType)}>
                      {review.reviewType.charAt(0).toUpperCase() + review.reviewType.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(review.scheduledDate, 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{review.cpfLevel}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(review.status)}>
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1).replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedReview(review);
                          setReviewForm({
                            overallRating: review.overallRating || 0,
                            publicNotes: review.publicNotes,
                            privateNotes: review.privateNotes,
                            newGoal: '',
                            newActionItem: '',
                            actionAssignee: '',
                            goalPriority: 'medium'
                          });
                          setShowReviewDetails(true);
                        }}
                      >
                        {review.status === 'completed' ? <Eye className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                      </Button>
                      {review.status === 'scheduled' && (userRole === 'hr' || userRole === 'manager') && (
                        <Button
                          size="sm"
                          onClick={() => updateReviewStatus(review.id, 'in-progress')}
                        >
                          Start
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Details Dialog */}
      <Dialog open={showReviewDetails} onOpenChange={setShowReviewDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedReview && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Performance Review - {selectedReview.employeeName}
                </DialogTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getTypeColor(selectedReview.reviewType)}>
                    {selectedReview.reviewType.charAt(0).toUpperCase() + selectedReview.reviewType.slice(1)}
                  </Badge>
                  <Badge className={getStatusColor(selectedReview.status)}>
                    {selectedReview.status.charAt(0).toUpperCase() + selectedReview.status.slice(1).replace('-', ' ')}
                  </Badge>
                </div>
              </DialogHeader>

              <Tabs defaultValue="review" className="mt-6">
                <TabsList>
                  <TabsTrigger value="review">Review</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                  <TabsTrigger value="actions">Action Items</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <TabsContent value="review" className="space-y-4">
                  {selectedReview.status !== 'completed' && (userRole === 'hr' || userRole === 'manager') && (
                    <>
                      <div>
                        <Label>Overall Rating</Label>
                        <div className="flex items-center space-x-2 mt-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => setReviewForm(prev => ({ ...prev, overallRating: rating }))}
                              className={`p-1 ${rating <= reviewForm.overallRating ? 'text-yellow-500' : 'text-gray-300'}`}
                            >
                              <Star className="w-6 h-6 fill-current" />
                            </button>
                          ))}
                          <span className="ml-2">{reviewForm.overallRating}/5</span>
                        </div>
                      </div>

                      <div>
                        <Label>Public Notes (Shared with Employee)</Label>
                        <Textarea
                          value={reviewForm.publicNotes}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, publicNotes: e.target.value }))}
                          placeholder="Enter feedback that will be shared with the employee..."
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label>Private Notes (Internal Only)</Label>
                        <Textarea
                          value={reviewForm.privateNotes}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, privateNotes: e.target.value }))}
                          placeholder="Enter internal notes and observations..."
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={saveReview}>
                          Complete Review
                        </Button>
                      </div>
                    </>
                  )}

                  {selectedReview.status === 'completed' && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Overall Rating</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className={`w-5 h-5 ${rating <= (selectedReview.overallRating || 0) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                          <span className="ml-2">{selectedReview.overallRating}/5</span>
                        </div>
                      </div>

                      {selectedReview.publicNotes && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Public Feedback</Label>
                          <p className="mt-1 p-3 bg-gray-50 rounded">{selectedReview.publicNotes}</p>
                        </div>
                      )}

                      {(userRole === 'hr' || userRole === 'manager') && selectedReview.privateNotes && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Private Notes</Label>
                          <p className="mt-1 p-3 bg-red-50 rounded border-l-4 border-red-500">{selectedReview.privateNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="goals" className="space-y-4">
                  {(userRole === 'hr' || userRole === 'manager') && selectedReview.status !== 'completed' && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <Label>Add New Goal</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={reviewForm.newGoal}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, newGoal: e.target.value }))}
                          placeholder="Enter goal description"
                          className="flex-1"
                        />
                        <Select value={reviewForm.goalPriority} onValueChange={(value) => setReviewForm(prev => ({ ...prev, goalPriority: value as any }))}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={addGoal}>Add</Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedReview.goals.map((goal) => (
                      <Card key={goal.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{goal.description}</p>
                              <p className="text-sm text-gray-600">Due: {format(goal.dueDate, 'MMM dd, yyyy')}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Badge className={getPriorityColor(goal.priority)}>
                                {goal.priority}
                              </Badge>
                              <Badge className={goal.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                              goal.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                                              'bg-gray-100 text-gray-800'}>
                                {goal.status.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  {(userRole === 'hr' || userRole === 'manager') && selectedReview.status !== 'completed' && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <Label>Add Action Item</Label>
                      <div className="space-y-2 mt-2">
                        <Input
                          value={reviewForm.newActionItem}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, newActionItem: e.target.value }))}
                          placeholder="Enter action item description"
                        />
                        <div className="flex space-x-2">
                          <Input
                            value={reviewForm.actionAssignee}
                            onChange={(e) => setReviewForm(prev => ({ ...prev, actionAssignee: e.target.value }))}
                            placeholder="Assignee"
                            className="flex-1"
                          />
                          <Button onClick={addActionItem}>Add Action</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {selectedReview.actionItems.map((action) => (
                      <Card key={action.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{action.description}</p>
                              <p className="text-sm text-gray-600">
                                Assigned to: {action.assignee} • Due: {format(action.dueDate, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <Badge className={action.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                              {action.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Review Documents</Label>
                    {(userRole === 'hr' || userRole === 'manager') && (
                      <Button size="sm" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {selectedReview.documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-sm text-gray-600">
                                {doc.size} • Uploaded {format(doc.uploadDate, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <Button size="sm" variant="outline">
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {selectedReview.documents.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}