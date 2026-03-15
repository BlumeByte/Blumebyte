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
import { Progress } from './ui/progress';
import { Plus, BookOpen, Award, Users, DollarSign, Upload, Download, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TrainingRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  title: string;
  type: 'internal' | 'external' | 'conference' | 'certification' | 'peer-to-peer';
  provider: string;
  startDate: Date;
  endDate?: Date;
  status: 'registered' | 'in-progress' | 'completed' | 'cancelled';
  cost: number;
  budgetCategory: string;
  certificateUrl?: string;
  notes: string;
  skills: string[];
}

interface BudgetAllocation {
  employeeId: string;
  employeeName: string;
  yearlyBudget: number;
  usedBudget: number;
  year: number;
}

const mockTrainingRecords: TrainingRecord[] = [
  {
    id: 'TR001',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    title: 'Advanced React Patterns',
    type: 'external',
    provider: 'Frontend Masters',
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-11-15'),
    status: 'completed',
    cost: 299,
    budgetCategory: 'Technical Training',
    certificateUrl: 'https://example.com/cert/react-advanced',
    notes: 'Excellent course on advanced React patterns and performance optimization',
    skills: ['React', 'Performance Optimization', 'Design Patterns']
  },
  {
    id: 'TR002',
    employeeName: 'Mike Chen',
    employeeId: 'EMP002',
    title: 'Python Conference 2024',
    type: 'conference',
    provider: 'PyCon',
    startDate: new Date('2024-10-15'),
    endDate: new Date('2024-10-17'),
    status: 'completed',
    cost: 1200,
    budgetCategory: 'Conference',
    notes: 'Great networking opportunity and learned about latest Python trends',
    skills: ['Python', 'Machine Learning', 'Networking']
  },
  {
    id: 'TR003',
    employeeName: 'Emma Wilson',
    employeeId: 'EMP003',
    title: 'UX Research Methods',
    type: 'internal',
    provider: 'Blumebyte Training',
    startDate: new Date('2024-12-01'),
    status: 'in-progress',
    cost: 0,
    budgetCategory: 'Internal Development',
    notes: 'Internal workshop conducted by senior UX team',
    skills: ['UX Research', 'User Testing', 'Data Analysis']
  },
  {
    id: 'TR004',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    title: 'Team Leadership Workshop',
    type: 'peer-to-peer',
    provider: 'Alex Rodriguez (Internal)',
    startDate: new Date('2024-11-20'),
    endDate: new Date('2024-11-20'),
    status: 'completed',
    cost: 0,
    budgetCategory: 'Peer Learning',
    notes: 'Peer-led session on leadership skills - eligible for incentive',
    skills: ['Leadership', 'Team Management', 'Communication']
  }
];

const mockBudgetAllocations: BudgetAllocation[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    yearlyBudget: 2000,
    usedBudget: 1299,
    year: 2024
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Mike Chen',
    yearlyBudget: 2000,
    usedBudget: 1200,
    year: 2024
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Emma Wilson',
    yearlyBudget: 1500,
    usedBudget: 0,
    year: 2024
  }
];

export function TrainingModule({ userRole }: { userRole: string }) {
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>(mockTrainingRecords);
  const [budgetAllocations, setBudgetAllocations] = useState<BudgetAllocation[]>(mockBudgetAllocations);
  const [showNewTrainingDialog, setShowNewTrainingDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);
  const [showRecordDetails, setShowRecordDetails] = useState(false);

  const [newTraining, setNewTraining] = useState({
    employeeId: '',
    title: '',
    type: '',
    provider: '',
    startDate: '',
    endDate: '',
    cost: '',
    budgetCategory: '',
    notes: '',
    skills: ''
  });

  const handleAddTraining = () => {
    if (!newTraining.employeeId || !newTraining.title || !newTraining.type) return;

    const record: TrainingRecord = {
      id: `TR${String(trainingRecords.length + 1).padStart(3, '0')}`,
      employeeName: 'Selected Employee',
      employeeId: newTraining.employeeId,
      title: newTraining.title,
      type: newTraining.type as any,
      provider: newTraining.provider,
      startDate: new Date(newTraining.startDate),
      endDate: newTraining.endDate ? new Date(newTraining.endDate) : undefined,
      status: 'registered',
      cost: parseFloat(newTraining.cost) || 0,
      budgetCategory: newTraining.budgetCategory,
      notes: newTraining.notes,
      skills: newTraining.skills.split(',').map(s => s.trim()).filter(s => s)
    };

    setTrainingRecords(prev => [record, ...prev]);
    
    // Update budget
    if (record.cost > 0) {
      setBudgetAllocations(prev => prev.map(budget => 
        budget.employeeId === newTraining.employeeId 
          ? { ...budget, usedBudget: budget.usedBudget + record.cost }
          : budget
      ));
    }

    setShowNewTrainingDialog(false);
    setNewTraining({
      employeeId: '',
      title: '',
      type: '',
      provider: '',
      startDate: '',
      endDate: '',
      cost: '',
      budgetCategory: '',
      notes: '',
      skills: ''
    });
  };

  const updateTrainingStatus = (recordId: string, status: TrainingRecord['status']) => {
    setTrainingRecords(prev => prev.map(record => 
      record.id === recordId ? { ...record, status } : record
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'registered': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internal': return 'bg-blue-100 text-blue-800';
      case 'external': return 'bg-purple-100 text-purple-800';
      case 'conference': return 'bg-green-100 text-green-800';
      case 'certification': return 'bg-yellow-100 text-yellow-800';
      case 'peer-to-peer': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Training & Development</h2>
          <p className="text-gray-600">Track learning initiatives and manage training budgets</p>
        </div>
        <Dialog open={showNewTrainingDialog} onOpenChange={setShowNewTrainingDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Training
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Training Record</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Employee</Label>
                <Select value={newTraining.employeeId} onValueChange={(value) => setNewTraining(prev => ({ ...prev, employeeId: value }))}>
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
                <Label>Training Title</Label>
                <Input
                  value={newTraining.title}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter training title"
                />
              </div>
              
              <div>
                <Label>Type</Label>
                <Select value={newTraining.type} onValueChange={(value) => setNewTraining(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="certification">Certification</SelectItem>
                    <SelectItem value="peer-to-peer">Peer-to-Peer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Provider</Label>
                <Input
                  value={newTraining.provider}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, provider: e.target.value }))}
                  placeholder="Training provider"
                />
              </div>
              
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={newTraining.startDate}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={newTraining.endDate}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label>Cost ($)</Label>
                <Input
                  type="number"
                  value={newTraining.cost}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, cost: e.target.value }))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label>Budget Category</Label>
                <Select value={newTraining.budgetCategory} onValueChange={(value) => setNewTraining(prev => ({ ...prev, budgetCategory: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technical Training">Technical Training</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Certification">Certification</SelectItem>
                    <SelectItem value="Leadership Development">Leadership Development</SelectItem>
                    <SelectItem value="Internal Development">Internal Development</SelectItem>
                    <SelectItem value="Peer Learning">Peer Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <Label>Skills/Technologies (comma separated)</Label>
                <Input
                  value={newTraining.skills}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="React, TypeScript, Leadership"
                />
              </div>
              
              <div className="col-span-2">
                <Label>Notes</Label>
                <Textarea
                  value={newTraining.notes}
                  onChange={(e) => setNewTraining(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the training"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowNewTrainingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTraining}>
                Add Training
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Training Hours</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Used</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${budgetAllocations.reduce((sum, b) => sum + b.usedBudget, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              of ${budgetAllocations.reduce((sum, b) => sum + b.yearlyBudget, 0).toLocaleString()} allocated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trainings</CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainingRecords.filter(r => r.status === 'in-progress' || r.status === 'registered').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certifications</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trainingRecords.filter(r => r.type === 'certification' && r.status === 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="records" className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">Training Records</TabsTrigger>
          <TabsTrigger value="budget">Budget Tracking</TabsTrigger>
          <TabsTrigger value="peer-sessions">Peer Sessions</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle>Training History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Training</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trainingRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.employeeName}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{record.title}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {record.skills.slice(0, 2).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {record.skills.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{record.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(record.type)}>
                          {record.type.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.provider}</TableCell>
                      <TableCell>
                        {format(record.startDate, 'MMM dd, yyyy')}
                        {record.endDate && ` - ${format(record.endDate, 'MMM dd, yyyy')}`}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>${record.cost}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowRecordDetails(true);
                            }}
                          >
                            View
                          </Button>
                          {record.status === 'registered' && userRole === 'hr' && (
                            <Button
                              size="sm"
                              onClick={() => updateTrainingStatus(record.id, 'in-progress')}
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
        </TabsContent>

        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Training Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {budgetAllocations.map((budget) => (
                  <div key={budget.employeeId}>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{budget.employeeName}</h4>
                      <div className="text-sm text-gray-600">
                        ${budget.usedBudget} / ${budget.yearlyBudget}
                      </div>
                    </div>
                    <Progress 
                      value={(budget.usedBudget / budget.yearlyBudget) * 100} 
                      className="h-3"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Used: {Math.round((budget.usedBudget / budget.yearlyBudget) * 100)}%</span>
                      <span>Remaining: ${budget.yearlyBudget - budget.usedBudget}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peer-sessions">
          <Card>
            <CardHeader>
              <CardTitle>Peer-to-Peer Learning Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingRecords.filter(r => r.type === 'peer-to-peer').map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{record.title}</h4>
                          <p className="text-sm text-gray-600">
                            Led by: {record.provider} • {format(record.startDate, 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-gray-600">Attendee: {record.employeeName}</p>
                          {record.notes && (
                            <p className="text-sm text-gray-500 mt-2">{record.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(record.status)}>
                            {record.status}
                          </Badge>
                          {record.status === 'completed' && (
                            <Badge className="bg-green-100 text-green-800">
                              Incentive Eligible
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle>Certificates & Proof of Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingRecords.filter(r => r.status === 'completed').map((record) => (
                  <Card key={record.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{record.title}</h4>
                          <p className="text-sm text-gray-600">
                            {record.employeeName} • Completed {format(record.endDate || record.startDate, 'MMM dd, yyyy')}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {record.skills.map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          {userRole === 'hr' && (
                            <Button size="sm" variant="outline">
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Certificate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Training Record Details Dialog */}
      <Dialog open={showRecordDetails} onOpenChange={setShowRecordDetails}>
        <DialogContent className="max-w-2xl">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRecord.title}</DialogTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getTypeColor(selectedRecord.type)}>
                    {selectedRecord.type.replace('-', ' ')}
                  </Badge>
                  <Badge className={getStatusColor(selectedRecord.status)}>
                    {selectedRecord.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Employee</Label>
                    <p>{selectedRecord.employeeName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Provider</Label>
                    <p>{selectedRecord.provider}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                    <p>{format(selectedRecord.startDate, 'MMM dd, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">End Date</Label>
                    <p>{selectedRecord.endDate ? format(selectedRecord.endDate, 'MMM dd, yyyy') : 'Ongoing'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Cost</Label>
                    <p>${selectedRecord.cost}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Budget Category</Label>
                    <p>{selectedRecord.budgetCategory}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-500">Skills/Technologies</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedRecord.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedRecord.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Notes</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded">{selectedRecord.notes}</p>
                  </div>
                )}

                {selectedRecord.certificateUrl && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Certificate</Label>
                    <div className="mt-1">
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  </div>
                )}

                {selectedRecord.status === 'in-progress' && userRole === 'hr' && (
                  <div className="flex justify-end">
                    <Button onClick={() => updateTrainingStatus(selectedRecord.id, 'completed')}>
                      Mark as Completed
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}