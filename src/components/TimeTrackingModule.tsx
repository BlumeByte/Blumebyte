import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Clock, Play, Pause, Download, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';

interface TimeEntry {
  id: string;
  employeeName: string;
  employeeId: string;
  date: Date;
  project: string;
  task: string;
  hours: number;
  description: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  billable: boolean;
  submittedDate?: Date;
  approvedBy?: string;
}

interface Project {
  id: string;
  name: string;
  client: string;
  status: 'active' | 'completed' | 'on-hold';
  requiresApproval: boolean;
}

const mockProjects: Project[] = [
  {
    id: 'PROJ001',
    name: 'E-commerce Platform',
    client: 'TechCorp Inc.',
    status: 'active',
    requiresApproval: true
  },
  {
    id: 'PROJ002',
    name: 'Mobile App Development',
    client: 'StartupXYZ',
    status: 'active',
    requiresApproval: true
  },
  {
    id: 'PROJ003',
    name: 'Internal Tools',
    client: 'Blumebyte',
    status: 'active',
    requiresApproval: false
  },
  {
    id: 'PROJ004',
    name: 'Code Review & Maintenance',
    client: 'Various',
    status: 'active',
    requiresApproval: false
  }
];

const mockTimeEntries: TimeEntry[] = [
  {
    id: 'TE001',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    date: new Date('2024-12-20'),
    project: 'E-commerce Platform',
    task: 'Frontend Development',
    hours: 8,
    description: 'Implemented product listing page with filters and pagination',
    status: 'approved',
    billable: true,
    submittedDate: new Date('2024-12-20'),
    approvedBy: 'Alex Rodriguez'
  },
  {
    id: 'TE002',
    employeeName: 'Mike Chen',
    employeeId: 'EMP002',
    date: new Date('2024-12-20'),
    project: 'Mobile App Development',
    task: 'API Integration',
    hours: 6,
    description: 'Integrated user authentication and profile management APIs',
    status: 'submitted',
    billable: true,
    submittedDate: new Date('2024-12-20')
  },
  {
    id: 'TE003',
    employeeName: 'Emma Wilson',
    employeeId: 'EMP003',
    date: new Date('2024-12-20'),
    project: 'Internal Tools',
    task: 'Design System Updates',
    hours: 4,
    description: 'Updated component library with new accessibility standards',
    status: 'approved',
    billable: false,
    submittedDate: new Date('2024-12-20'),
    approvedBy: 'Sarah Creative'
  },
  {
    id: 'TE004',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    date: new Date('2024-12-19'),
    project: 'E-commerce Platform',
    task: 'Code Review',
    hours: 2,
    description: 'Reviewed and approved pull requests from team members',
    status: 'draft',
    billable: true
  }
];

export function TimeTrackingModule({ userRole }: { userRole: string }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>(mockTimeEntries);
  const [projects] = useState<Project[]>(mockProjects);
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [isTracking, setIsTracking] = useState(false);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);

  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    project: '',
    task: '',
    hours: '',
    description: '',
    billable: true
  });

  const handleAddTimeEntry = () => {
    if (!newEntry.project || !newEntry.task || !newEntry.hours) return;

    const entry: TimeEntry = {
      id: `TE${String(timeEntries.length + 1).padStart(3, '0')}`,
      employeeName: userRole === 'employee' ? 'Current User' : 'Sarah Johnson',
      employeeId: 'EMP001',
      date: new Date(newEntry.date),
      project: newEntry.project,
      task: newEntry.task,
      hours: parseFloat(newEntry.hours),
      description: newEntry.description,
      status: 'draft',
      billable: newEntry.billable
    };

    setTimeEntries(prev => [entry, ...prev]);
    setShowNewEntryDialog(false);
    setNewEntry({
      date: format(new Date(), 'yyyy-MM-dd'),
      project: '',
      task: '',
      hours: '',
      description: '',
      billable: true
    });
  };

  const startTimeTracking = () => {
    setIsTracking(true);
    setCurrentSessionStart(new Date());
  };

  const stopTimeTracking = () => {
    if (!currentSessionStart) return;
    
    const endTime = new Date();
    const hoursWorked = (endTime.getTime() - currentSessionStart.getTime()) / (1000 * 60 * 60);
    
    setNewEntry(prev => ({
      ...prev,
      hours: hoursWorked.toFixed(2)
    }));
    
    setIsTracking(false);
    setCurrentSessionStart(null);
    setShowNewEntryDialog(true);
  };

  const submitTimesheet = (employeeId: string, weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart);
    setTimeEntries(prev => prev.map(entry => {
      if (entry.employeeId === employeeId && 
          entry.date >= weekStart && 
          entry.date <= weekEnd && 
          entry.status === 'draft') {
        return { ...entry, status: 'submitted', submittedDate: new Date() };
      }
      return entry;
    }));
  };

  const approveTimeEntry = (entryId: string) => {
    setTimeEntries(prev => prev.map(entry => 
      entry.id === entryId 
        ? { ...entry, status: 'approved', approvedBy: 'Current Manager' }
        : entry
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const currentUserEntries = timeEntries.filter(entry => 
    entry.employeeId === 'EMP001' && 
    entry.date >= weekStart && 
    entry.date <= weekEnd
  );

  const totalHours = currentUserEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const billableHours = currentUserEntries.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Time Tracking</h2>
          <p className="text-gray-600">Track work hours and manage timesheets</p>
        </div>
        <div className="flex space-x-2">
          {!isTracking ? (
            <Button onClick={startTimeTracking} className="bg-green-600 hover:bg-green-700">
              <Play className="w-4 h-4 mr-2" />
              Start Timer
            </Button>
          ) : (
            <Button onClick={stopTimeTracking} className="bg-red-600 hover:bg-red-700">
              <Pause className="w-4 h-4 mr-2" />
              Stop Timer
              {currentSessionStart && (
                <span className="ml-2 font-mono">
                  {Math.floor((new Date().getTime() - currentSessionStart.getTime()) / (1000 * 60))}m
                </span>
              )}
            </Button>
          )}
          
          <Dialog open={showNewEntryDialog} onOpenChange={setShowNewEntryDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Time Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      step="0.25"
                      value={newEntry.hours}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, hours: e.target.value }))}
                      placeholder="8.00"
                    />
                  </div>
                </div>

                <div>
                  <Label>Project</Label>
                  <Select value={newEntry.project} onValueChange={(value) => setNewEntry(prev => ({ ...prev, project: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.filter(p => p.status === 'active').map((project) => (
                        <SelectItem key={project.id} value={project.name}>
                          {project.name} - {project.client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Task</Label>
                  <Input
                    value={newEntry.task}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, task: e.target.value }))}
                    placeholder="e.g., Frontend Development, API Integration"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of work performed"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={newEntry.billable}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, billable: e.target.checked }))}
                  />
                  <Label htmlFor="billable">Billable hours</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewEntryDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTimeEntry}>
                    Add Entry
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Total hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billableHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Entries</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentUserEntries.filter(e => e.status === 'draft').length}
            </div>
            <p className="text-xs text-muted-foreground">Need submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Daily Hours</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalHours > 0 ? (totalHours / 7).toFixed(1) : 0}h
            </div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timesheet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="timesheet">My Timesheet</TabsTrigger>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          {(userRole === 'hr' || userRole === 'manager') && <TabsTrigger value="approvals">Approvals</TabsTrigger>}
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="timesheet">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Weekly Timesheet</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() - 7 * 24 * 60 * 60 * 1000))}
                  >
                    Previous Week
                  </Button>
                  <span className="text-sm">
                    {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWeek(new Date(selectedWeek.getTime() + 7 * 24 * 60 * 60 * 1000))}
                  >
                    Next Week
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weekDays.map((day) => {
                  const dayEntries = currentUserEntries.filter(entry => 
                    format(entry.date, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
                  );
                  const dayTotal = dayEntries.reduce((sum, entry) => sum + entry.hours, 0);

                  return (
                    <div key={day.toISOString()} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">
                          {format(day, 'EEEE, MMM dd')}
                        </h4>
                        <Badge variant="outline">
                          {dayTotal.toFixed(1)}h
                        </Badge>
                      </div>
                      
                      {dayEntries.length > 0 ? (
                        <div className="space-y-2">
                          {dayEntries.map((entry) => (
                            <div key={entry.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium">{entry.project}</span>
                                <span className="text-gray-600 ml-2">• {entry.task}</span>
                                {entry.billable && <Badge variant="outline" className="ml-2 text-xs">Billable</Badge>}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span>{entry.hours}h</span>
                                <Badge className={getStatusColor(entry.status)}>
                                  {entry.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No entries for this day</p>
                      )}
                    </div>
                  );
                })}

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-gray-600">
                      Total: {totalHours.toFixed(1)}h • Billable: {billableHours.toFixed(1)}h
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    {currentUserEntries.some(e => e.status === 'draft') && (
                      <Button
                        size="sm"
                        onClick={() => submitTimesheet('EMP001', weekStart)}
                      >
                        Submit Timesheet
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>All Time Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Billable</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.slice(0, 10).map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(entry.date, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{entry.project}</TableCell>
                      <TableCell>{entry.task}</TableCell>
                      <TableCell>{entry.hours}h</TableCell>
                      <TableCell>
                        {entry.billable ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          {entry.status === 'draft' && (
                            <Button size="sm">
                              Submit
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

        {(userRole === 'hr' || userRole === 'manager') && (
          <TabsContent value="approvals">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeEntries.filter(e => e.status === 'submitted').map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.employeeName}</TableCell>
                        <TableCell>{format(entry.date, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{entry.project}</TableCell>
                        <TableCell>{entry.hours}h</TableCell>
                        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => approveTimeEntry(entry.id)}
                            >
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Hours Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.map((project) => {
                    const projectHours = timeEntries
                      .filter(e => e.project === project.name)
                      .reduce((sum, e) => sum + e.hours, 0);
                    
                    return (
                      <div key={project.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-sm text-gray-600">{project.client}</p>
                        </div>
                        <Badge variant="outline">{projectHours.toFixed(1)}h</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <Input type="date" />
                      <Input type="date" />
                    </div>
                  </div>
                  <div>
                    <Label>Format</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Timesheet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}