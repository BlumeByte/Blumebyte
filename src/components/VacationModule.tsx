import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { NativeSelect } from './ui/native-select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarIcon, Plus, Check, X, Eye, Clock, Calendar as CalendarView, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { calculateBusinessDays, getNonBusinessDays, isBusinessDay, getHolidayName } from '../lib/business-days';
import { Alert, AlertDescription } from './ui/alert';

interface VacationRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'wfh' | 'personal';
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: Date;
  approvedBy?: string;
  approvedDate?: Date;
}

interface EmployeeBalance {
  employeeId: string;
  employeeName: string;
  vacationDays: number;
  sickDays: number;
  personalDays: number;
  usedVacation: number;
  usedSick: number;
  usedPersonal: number;
}

const mockRequests: VacationRequest[] = [
  {
    id: '1',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    type: 'vacation',
    startDate: new Date('2024-12-20'),
    endDate: new Date('2024-12-27'),
    days: 6,
    reason: 'Christmas holidays with family',
    status: 'pending',
    submittedDate: new Date('2024-12-15'),
  },
  {
    id: '2',
    employeeName: 'Mike Chen',
    employeeId: 'EMP002',
    type: 'sick',
    startDate: new Date('2024-12-10'),
    endDate: new Date('2024-12-12'),
    days: 3,
    reason: 'Flu symptoms',
    status: 'approved',
    submittedDate: new Date('2024-12-09'),
    approvedBy: 'Alexandra HR',
    approvedDate: new Date('2024-12-09'),
  },
  {
    id: '3',
    employeeName: 'Emma Wilson',
    employeeId: 'EMP003',
    type: 'wfh',
    startDate: new Date('2024-12-18'),
    endDate: new Date('2024-12-18'),
    days: 1,
    reason: 'Home maintenance appointment',
    status: 'approved',
    submittedDate: new Date('2024-12-16'),
    approvedBy: 'Alexandra HR',
    approvedDate: new Date('2024-12-16'),
  },
];

const mockBalances: EmployeeBalance[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    vacationDays: 25,
    sickDays: 10,
    personalDays: 5,
    usedVacation: 12,
    usedSick: 3,
    usedPersonal: 2,
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Mike Chen',
    vacationDays: 25,
    sickDays: 10,
    personalDays: 5,
    usedVacation: 18,
    usedSick: 6,
    usedPersonal: 1,
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Emma Wilson',
    vacationDays: 20,
    sickDays: 10,
    personalDays: 5,
    usedVacation: 15,
    usedSick: 2,
    usedPersonal: 3,
  },
];

const mockCalendarEvents = [
  { date: new Date('2024-12-20'), employee: 'Sarah Johnson', type: 'vacation', days: 6 },
  { date: new Date('2024-12-18'), employee: 'Emma Wilson', type: 'wfh', days: 1 },
  { date: new Date('2025-01-15'), employee: 'John Smith', type: 'vacation', days: 5 },
];

export function VacationModule({ userRole }: { userRole: string }) {
  const [requests, setRequests] = useState<VacationRequest[]>(mockRequests);
  const [balances, setBalances] = useState<EmployeeBalance[]>(mockBalances);
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedEndDate, setSelectedEndDate] = useState<Date>();
  
  const [newRequest, setNewRequest] = useState({
    type: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const handleApproveRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'approved' as const, approvedBy: 'Alexandra HR', approvedDate: new Date() }
        : req
    ));
  };

  const handleRejectRequest = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'rejected' as const, approvedBy: 'Alexandra HR', approvedDate: new Date() }
        : req
    ));
  };

  const handleSubmitRequest = () => {
    if (!selectedDate || !selectedEndDate || !newRequest.type || !newRequest.reason) return;
    
    const daysDiff = Math.ceil((selectedEndDate.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const request: VacationRequest = {
      id: Date.now().toString(),
      employeeName: userRole === 'employee' ? 'Current User' : 'Sarah Johnson',
      employeeId: 'EMP001',
      type: newRequest.type as any,
      startDate: selectedDate,
      endDate: selectedEndDate,
      days: daysDiff,
      reason: newRequest.reason,
      status: 'pending',
      submittedDate: new Date(),
    };
    
    setRequests(prev => [request, ...prev]);
    setShowNewRequestDialog(false);
    setNewRequest({ type: '', startDate: '', endDate: '', reason: '' });
    setSelectedDate(undefined);
    setSelectedEndDate(undefined);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'wfh': return 'bg-green-100 text-green-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vacation Management</h2>
          <p className="text-gray-600">Manage leave requests and track balances</p>
        </div>
        <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Leave Type</Label>
                <NativeSelect value={newRequest.type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, type: value }))}>
                  <option value="">Select leave type</option>
                  <option value="vacation">Vacation</option>
                  <option value="sick">Sick Leave</option>
                  <option value="wfh">Work From Home</option>
                  <option value="personal">Personal Leave</option>
                </NativeSelect>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'Pick date'}
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
                
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedEndDate ? format(selectedEndDate, 'MMM dd, yyyy') : 'Pick date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedEndDate}
                        onSelect={setSelectedEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {/* Business Days Calculation */}
              {selectedDate && selectedEndDate && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Business Days:</strong> {calculateBusinessDays(selectedDate, selectedEndDate)} days
                    {getNonBusinessDays(selectedDate, selectedEndDate).length > 0 && (
                      <span className="block text-xs mt-1">
                        ({getNonBusinessDays(selectedDate, selectedEndDate).length} weekend/holiday days excluded)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              <div>
                <Label>Reason</Label>
                <Textarea
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Provide a reason for your leave request"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitRequest}>
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
          {userRole === 'hr' && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {(userRole === 'hr' || userRole === 'manager') && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.employeeName}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(request.type)}>
                          {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(request.startDate, 'MMM dd')} - {format(request.endDate, 'MMM dd')}
                      </TableCell>
                      <TableCell>{request.days}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {(userRole === 'hr' || userRole === 'manager') && (
                        <TableCell>
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveRequest(request.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectRequest(request.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances">
          <Card>
            <CardHeader>
              <CardTitle>Employee Leave Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Vacation Days</TableHead>
                    <TableHead>Sick Days</TableHead>
                    <TableHead>Personal Days</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map((balance) => (
                    <TableRow key={balance.employeeId}>
                      <TableCell>{balance.employeeName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Used: {balance.usedVacation}</span>
                            <span>Available: {balance.vacationDays - balance.usedVacation}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(balance.usedVacation / balance.vacationDays) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Used: {balance.usedSick}</span>
                            <span>Available: {balance.sickDays - balance.usedSick}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${(balance.usedSick / balance.sickDays) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>Used: {balance.usedPersonal}</span>
                            <span>Available: {balance.personalDays - balance.usedPersonal}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${(balance.usedPersonal / balance.personalDays) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Team Vacation Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Vacation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Sick Leave</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Work From Home</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm">Personal</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {mockCalendarEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          event.type === 'vacation' ? 'bg-blue-500' :
                          event.type === 'sick' ? 'bg-red-500' :
                          event.type === 'wfh' ? 'bg-green-500' : 'bg-purple-500'
                        }`}></div>
                        <div>
                          <p className="font-medium">{event.employee}</p>
                          <p className="text-sm text-gray-600">{format(event.date, 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{event.days} {event.days === 1 ? 'day' : 'days'}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'hr' && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Adjust Leave Balances</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Employee</Label>
                        <NativeSelect>
                          <option value="">Select employee</option>
                          {balances.map((balance) => (
                            <option key={balance.employeeId} value={balance.employeeId}>
                              {balance.employeeName}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                      <div>
                        <Label>Leave Type</Label>
                        <NativeSelect>
                          <option value="">Select type</option>
                          <option value="vacation">Vacation</option>
                          <option value="sick">Sick</option>
                          <option value="personal">Personal</option>
                        </NativeSelect>
                      </div>
                      <div>
                        <Label>New Balance</Label>
                        <Input type="number" placeholder="Enter new balance" />
                      </div>
                    </div>
                    <Button className="mt-4">Update Balance</Button>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Bulk Actions</h4>
                    <div className="flex space-x-2">
                      <Button variant="outline">Export Leave Data</Button>
                      <Button variant="outline">Send Reminders</Button>
                      <Button variant="outline">Year-end Rollover</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}