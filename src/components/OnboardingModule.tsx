import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { NativeSelect } from './ui/native-select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { Plus, UserPlus, UserMinus, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  responsible: 'hr' | 'it' | 'manager' | 'employee';
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  status: 'todo' | 'in-progress' | 'completed';
  notes?: string;
}

interface OnboardingProcess {
  id: string;
  employeeName: string;
  employeeId: string;
  type: 'onboarding' | 'offboarding';
  startDate: Date;
  expectedCompletionDate: Date;
  actualCompletionDate?: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  checklist: ChecklistItem[];
  assignedTo: string;
  notes: string;
}

const defaultOnboardingChecklist: Omit<ChecklistItem, 'id' | 'status'>[] = [
  {
    title: 'Send welcome email',
    description: 'Send welcome email with first day information and company handbook',
    responsible: 'hr',
    priority: 'high',
  },
  {
    title: 'Prepare workspace',
    description: 'Set up desk, chair, and basic office supplies',
    responsible: 'hr',
    priority: 'medium',
  },
  {
    title: 'IT equipment setup',
    description: 'Provision laptop, accounts, and software access',
    responsible: 'it',
    priority: 'high',
  },
  {
    title: 'Create email account',
    description: 'Set up company email and add to distribution lists',
    responsible: 'it',
    priority: 'high',
  },
  {
    title: 'Security access',
    description: 'Issue building access card and set up security clearances',
    responsible: 'it',
    priority: 'high',
  },
  {
    title: 'HR orientation',
    description: 'Complete HR orientation including policies and benefits',
    responsible: 'hr',
    priority: 'high',
  },
  {
    title: 'Team introduction',
    description: 'Introduce to team members and set up informal meet & greets',
    responsible: 'manager',
    priority: 'medium',
  },
  {
    title: 'Role-specific training',
    description: 'Complete job-specific training and certification requirements',
    responsible: 'manager',
    priority: 'high',
  },
  {
    title: 'Documentation review',
    description: 'Review and sign employment contracts and company policies',
    responsible: 'employee',
    priority: 'high',
  },
  {
    title: '30-day check-in',
    description: 'Schedule and complete 30-day feedback session',
    responsible: 'manager',
    priority: 'medium',
  }
];

const defaultOffboardingChecklist: Omit<ChecklistItem, 'id' | 'status'>[] = [
  {
    title: 'Return equipment',
    description: 'Collect laptop, monitors, and other company equipment',
    responsible: 'it',
    priority: 'high',
  },
  {
    title: 'Revoke access',
    description: 'Disable email, system access, and building access',
    responsible: 'it',
    priority: 'high',
  },
  {
    title: 'Exit interview',
    description: 'Conduct exit interview and gather feedback',
    responsible: 'hr',
    priority: 'medium',
  },
  {
    title: 'Final payroll',
    description: 'Process final paycheck and benefits termination',
    responsible: 'hr',
    priority: 'high',
  },
  {
    title: 'Knowledge transfer',
    description: 'Complete handover of projects and responsibilities',
    responsible: 'manager',
    priority: 'high',
  },
  {
    title: 'Return company property',
    description: 'Collect access cards, keys, and any company materials',
    responsible: 'hr',
    priority: 'high',
  },
  {
    title: 'Update documentation',
    description: 'Update org chart, contact lists, and project assignments',
    responsible: 'hr',
    priority: 'medium',
  }
];

const mockProcesses: OnboardingProcess[] = [
  {
    id: 'ONB001',
    employeeName: 'Alex Rivera',
    employeeId: 'EMP004',
    type: 'onboarding',
    startDate: new Date('2025-01-02'),
    expectedCompletionDate: new Date('2025-01-15'),
    status: 'in-progress',
    checklist: defaultOnboardingChecklist.map((item, index) => ({
      ...item,
      id: `ONB001-${index}`,
      status: index < 3 ? 'completed' : index < 5 ? 'in-progress' : 'todo'
    })),
    assignedTo: 'Alexandra HR',
    notes: 'New Software Engineer joining the backend team'
  },
  {
    id: 'OFF001',
    employeeName: 'Tom Wilson',
    employeeId: 'EMP005',
    type: 'offboarding',
    startDate: new Date('2024-12-15'),
    expectedCompletionDate: new Date('2024-12-30'),
    status: 'in-progress',
    checklist: defaultOffboardingChecklist.map((item, index) => ({
      ...item,
      id: `OFF001-${index}`,
      status: index < 4 ? 'completed' : 'todo'
    })),
    assignedTo: 'Alexandra HR',
    notes: 'Senior Developer moving to another company'
  }
];

export function OnboardingModule({ userRole }: { userRole: string }) {
  const [processes, setProcesses] = useState<OnboardingProcess[]>(mockProcesses);
  const [selectedProcess, setSelectedProcess] = useState<OnboardingProcess | null>(null);
  const [showNewProcessDialog, setShowNewProcessDialog] = useState(false);
  const [showProcessDetails, setShowProcessDetails] = useState(false);
  
  const [newProcess, setNewProcess] = useState({
    employeeName: '',
    employeeId: '',
    type: '' as 'onboarding' | 'offboarding' | '',
    startDate: '',
    expectedCompletionDate: '',
    assignedTo: '',
    notes: ''
  });

  const createNewProcess = () => {
    if (!newProcess.employeeName || !newProcess.type || !newProcess.startDate) return;
    
    const checklist = newProcess.type === 'onboarding' 
      ? defaultOnboardingChecklist 
      : defaultOffboardingChecklist;
    
    const process: OnboardingProcess = {
      id: `${newProcess.type.toUpperCase()}${String(processes.length + 1).padStart(3, '0')}`,
      employeeName: newProcess.employeeName,
      employeeId: newProcess.employeeId,
      type: newProcess.type,
      startDate: new Date(newProcess.startDate),
      expectedCompletionDate: new Date(newProcess.expectedCompletionDate),
      status: 'not-started',
      checklist: checklist.map((item, index) => ({
        ...item,
        id: `${newProcess.type.toUpperCase()}${String(processes.length + 1).padStart(3, '0')}-${index}`,
        status: 'todo' as const
      })),
      assignedTo: newProcess.assignedTo,
      notes: newProcess.notes
    };
    
    setProcesses(prev => [process, ...prev]);
    setShowNewProcessDialog(false);
    setNewProcess({
      employeeName: '',
      employeeId: '',
      type: '',
      startDate: '',
      expectedCompletionDate: '',
      assignedTo: '',
      notes: ''
    });
  };

  const updateChecklistItem = (processId: string, itemId: string, status: ChecklistItem['status']) => {
    setProcesses(prev => prev.map(process => {
      if (process.id === processId) {
        const updatedChecklist = process.checklist.map(item => 
          item.id === itemId ? { ...item, status } : item
        );
        
        const completedItems = updatedChecklist.filter(item => item.status === 'completed').length;
        const totalItems = updatedChecklist.length;
        const isCompleted = completedItems === totalItems;
        
        return {
          ...process,
          checklist: updatedChecklist,
          status: isCompleted ? 'completed' : completedItems > 0 ? 'in-progress' : 'not-started',
          actualCompletionDate: isCompleted ? new Date() : undefined
        };
      }
      return process;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'not-started': return 'bg-gray-100 text-gray-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'todo': return 'text-gray-600';
      default: return 'text-gray-600';
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

  const getResponsibleLabel = (responsible: string) => {
    switch (responsible) {
      case 'hr': return 'HR';
      case 'it': return 'IT';
      case 'manager': return 'Manager';
      case 'employee': return 'Employee';
      default: return responsible;
    }
  };

  const calculateProgress = (checklist: ChecklistItem[]) => {
    const completed = checklist.filter(item => item.status === 'completed').length;
    return Math.round((completed / checklist.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Onboarding/Offboarding Tracker</h2>
          <p className="text-gray-600">Manage employee transitions and track progress</p>
        </div>
        {userRole === 'hr' && (
          <Dialog open={showNewProcessDialog} onOpenChange={setShowNewProcessDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Process
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Process</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Process Type</Label>
                  <NativeSelect value={newProcess.type} onValueChange={(value) => setNewProcess(prev => ({ ...prev, type: value as any }))}>
                    <option value="">Select process type</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="offboarding">Offboarding</option>
                  </NativeSelect>
                </div>
                
                <div>
                  <Label>Employee Name</Label>
                  <Input
                    value={newProcess.employeeName}
                    onChange={(e) => setNewProcess(prev => ({ ...prev, employeeName: e.target.value }))}
                    placeholder="Enter employee name"
                  />
                </div>
                
                <div>
                  <Label>Employee ID</Label>
                  <Input
                    value={newProcess.employeeId}
                    onChange={(e) => setNewProcess(prev => ({ ...prev, employeeId: e.target.value }))}
                    placeholder="Enter employee ID"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newProcess.startDate}
                      onChange={(e) => setNewProcess(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Expected Completion</Label>
                    <Input
                      type="date"
                      value={newProcess.expectedCompletionDate}
                      onChange={(e) => setNewProcess(prev => ({ ...prev, expectedCompletionDate: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Assigned To</Label>
                  <Input
                    value={newProcess.assignedTo}
                    onChange={(e) => setNewProcess(prev => ({ ...prev, assignedTo: e.target.value }))}
                    placeholder="Enter assignee name"
                  />
                </div>
                
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={newProcess.notes}
                    onChange={(e) => setNewProcess(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter any additional notes"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewProcessDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createNewProcess}>
                    Create Process
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
            <CardTitle className="text-sm font-medium">Active Onboarding</CardTitle>
            <UserPlus className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes.filter(p => p.type === 'onboarding' && p.status !== 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offboarding</CardTitle>
            <UserMinus className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes.filter(p => p.type === 'offboarding' && p.status !== 'completed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes.filter(p => p.status === 'overdue').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {processes.filter(p => p.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Processes</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processes.filter(p => p.status !== 'completed').map((process) => (
                  <Card key={process.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="font-medium">{process.employeeName}</h4>
                          <p className="text-sm text-gray-600">
                            {process.type.charAt(0).toUpperCase() + process.type.slice(1)} • {process.employeeId}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(process.status)}>
                            {process.status.replace('-', ' ')}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProcess(process);
                              setShowProcessDetails(true);
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{calculateProgress(process.checklist)}%</span>
                        </div>
                        <Progress value={calculateProgress(process.checklist)} className="h-2" />
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <span className="ml-1">{process.startDate.toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Expected Completion:</span>
                          <span className="ml-1">{process.expectedCompletionDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Processes</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Completed Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processes.filter(p => p.status === 'completed').map((process) => (
                    <TableRow key={process.id}>
                      <TableCell>{process.employeeName}</TableCell>
                      <TableCell>
                        <Badge className={process.type === 'onboarding' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {process.type.charAt(0).toUpperCase() + process.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {process.actualCompletionDate?.toLocaleDateString() || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {process.actualCompletionDate 
                          ? Math.ceil((process.actualCompletionDate.getTime() - process.startDate.getTime()) / (1000 * 60 * 60 * 24))
                          : 'N/A'
                        } days
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedProcess(process);
                            setShowProcessDetails(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Onboarding Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {defaultOnboardingChecklist.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getResponsibleLabel(item.responsible)}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)} variant="outline">
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserMinus className="w-5 h-5 mr-2" />
                  Offboarding Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {defaultOffboardingChecklist.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getResponsibleLabel(item.responsible)}
                      </Badge>
                      <Badge className={getPriorityColor(item.priority)} variant="outline">
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Process Details Dialog */}
      <Dialog open={showProcessDetails} onOpenChange={setShowProcessDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedProcess && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedProcess.type.charAt(0).toUpperCase() + selectedProcess.type.slice(1)} - {selectedProcess.employeeName}
                </DialogTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedProcess.status)}>
                    {selectedProcess.status.replace('-', ' ')}
                  </Badge>
                  <Badge variant="outline">
                    {calculateProgress(selectedProcess.checklist)}% Complete
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                    <p>{selectedProcess.startDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Expected Completion</Label>
                    <p>{selectedProcess.expectedCompletionDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Assigned To</Label>
                    <p>{selectedProcess.assignedTo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Employee ID</Label>
                    <p>{selectedProcess.employeeId}</p>
                  </div>
                </div>

                {selectedProcess.notes && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Notes</Label>
                    <p className="mt-1 p-3 bg-gray-50 rounded">{selectedProcess.notes}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-4">Checklist Progress</h4>
                  <div className="space-y-3">
                    {selectedProcess.checklist.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={item.status === 'completed'}
                              onCheckedChange={(checked) => {
                                if (userRole === 'hr' || userRole === 'manager') {
                                  updateChecklistItem(
                                    selectedProcess.id,
                                    item.id,
                                    checked ? 'completed' : 'todo'
                                  );
                                }
                              }}
                              disabled={userRole === 'employee' && item.responsible !== 'employee'}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">{item.title}</h5>
                                <div className="flex space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {getResponsibleLabel(item.responsible)}
                                  </Badge>
                                  <Badge className={getPriorityColor(item.priority)} variant="outline">
                                    {item.priority}
                                  </Badge>
                                  <Badge className={item.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                                  item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                                                  'bg-gray-100 text-gray-800'}>
                                    {item.status.replace('-', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              {item.dueDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Due: {item.dueDate.toLocaleDateString()}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-blue-600 mt-1 italic">{item.notes}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}