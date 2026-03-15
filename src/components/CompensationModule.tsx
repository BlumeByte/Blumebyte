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
import { Plus, DollarSign, Award, TrendingUp, Calendar, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Bonus {
  id: string;
  employeeName: string;
  employeeId: string;
  type: 'team-lead' | 'project-estimation' | 'education' | 'content-creation' | 'performance' | 'one-time';
  amount: number;
  description: string;
  month: string;
  year: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approvedBy?: string;
  approvedDate?: Date;
  payoutDate?: Date;
  reason: string;
}

interface SalaryInfo {
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  currency: string;
  effectiveDate: Date;
  lastReviewDate: Date;
  nextReviewDate: Date;
}

const mockBonuses: Bonus[] = [
  {
    id: 'BON001',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    type: 'team-lead',
    amount: 500,
    description: 'Team Lead Bonus - December 2024',
    month: 'December',
    year: 2024,
    status: 'approved',
    approvedBy: 'Alexandra HR',
    approvedDate: new Date('2024-12-01'),
    payoutDate: new Date('2024-12-15'),
    reason: 'Leading the frontend team for Q4 deliverables'
  },
  {
    id: 'BON002',
    employeeName: 'Mike Chen',
    employeeId: 'EMP002',
    type: 'education',
    amount: 200,
    description: 'Education Bonus - Python Conference',
    month: 'November',
    year: 2024,
    status: 'paid',
    approvedBy: 'Alexandra HR',
    approvedDate: new Date('2024-11-05'),
    payoutDate: new Date('2024-11-30'),
    reason: 'Attended PyCon 2024 and shared learnings with team'
  },
  {
    id: 'BON003',
    employeeName: 'Emma Wilson',
    employeeId: 'EMP003',
    type: 'content-creation',
    amount: 300,
    description: 'Content Creation Bonus - UX Blog Posts',
    month: 'December',
    year: 2024,
    status: 'pending',
    reason: 'Created 3 detailed blog posts on UX best practices'
  },
  {
    id: 'BON004',
    employeeName: 'Alex Rodriguez',
    employeeId: 'EMP100',
    type: 'project-estimation',
    amount: 150,
    description: 'Project Estimation Accuracy Bonus',
    month: 'December',
    year: 2024,
    status: 'approved',
    approvedBy: 'Alexandra HR',
    approvedDate: new Date('2024-12-10'),
    reason: 'Consistently accurate project estimates in Q4'
  }
];

const mockSalaryInfo: SalaryInfo[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    baseSalary: 95000,
    currency: 'USD',
    effectiveDate: new Date('2024-01-01'),
    lastReviewDate: new Date('2024-01-01'),
    nextReviewDate: new Date('2025-01-01')
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Mike Chen',
    baseSalary: 85000,
    currency: 'USD',
    effectiveDate: new Date('2023-06-01'),
    lastReviewDate: new Date('2024-06-01'),
    nextReviewDate: new Date('2025-06-01')
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Emma Wilson',
    baseSalary: 70000,
    currency: 'USD',
    effectiveDate: new Date('2023-03-01'),
    lastReviewDate: new Date('2024-03-01'),
    nextReviewDate: new Date('2025-03-01')
  }
];

export function CompensationModule({ userRole }: { userRole: string }) {
  const [bonuses, setBonuses] = useState<Bonus[]>(mockBonuses);
  const [salaryInfo] = useState<SalaryInfo[]>(mockSalaryInfo);
  const [showNewBonusDialog, setShowNewBonusDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('December');
  const [selectedYear, setSelectedYear] = useState(2024);

  const [newBonus, setNewBonus] = useState({
    employeeId: '',
    type: '',
    amount: '',
    description: '',
    month: 'December',
    year: 2024,
    reason: ''
  });

  const handleAddBonus = () => {
    if (!newBonus.employeeId || !newBonus.type || !newBonus.amount) return;

    const bonus: Bonus = {
      id: `BON${String(bonuses.length + 1).padStart(3, '0')}`,
      employeeName: 'Selected Employee',
      employeeId: newBonus.employeeId,
      type: newBonus.type as any,
      amount: parseFloat(newBonus.amount),
      description: newBonus.description,
      month: newBonus.month,
      year: newBonus.year,
      status: 'pending',
      reason: newBonus.reason
    };

    setBonuses(prev => [bonus, ...prev]);
    setShowNewBonusDialog(false);
    setNewBonus({
      employeeId: '',
      type: '',
      amount: '',
      description: '',
      month: 'December',
      year: 2024,
      reason: ''
    });
  };

  const updateBonusStatus = (bonusId: string, status: Bonus['status']) => {
    setBonuses(prev => prev.map(bonus => {
      if (bonus.id === bonusId) {
        const updates: Partial<Bonus> = { status };
        if (status === 'approved') {
          updates.approvedBy = 'Alexandra HR';
          updates.approvedDate = new Date();
        } else if (status === 'paid') {
          updates.payoutDate = new Date();
        }
        return { ...bonus, ...updates };
      }
      return bonus;
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'team-lead': return 'bg-purple-100 text-purple-800';
      case 'project-estimation': return 'bg-blue-100 text-blue-800';
      case 'education': return 'bg-green-100 text-green-800';
      case 'content-creation': return 'bg-orange-100 text-orange-800';
      case 'performance': return 'bg-yellow-100 text-yellow-800';
      case 'one-time': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'team-lead': return 'Team Lead';
      case 'project-estimation': return 'Project Estimation';
      case 'education': return 'Education';
      case 'content-creation': return 'Content Creation';
      case 'performance': return 'Performance';
      case 'one-time': return 'One-time';
      default: return type;
    }
  };

  const filteredBonuses = bonuses.filter(bonus => 
    bonus.month === selectedMonth && bonus.year === selectedYear
  );

  const totalBonuses = filteredBonuses.reduce((sum, bonus) => sum + bonus.amount, 0);
  const approvedBonuses = filteredBonuses.filter(b => b.status === 'approved' || b.status === 'paid');
  const pendingBonuses = filteredBonuses.filter(b => b.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compensation & Incentives</h2>
          <p className="text-gray-600">Manage bonuses and track compensation data</p>
        </div>
        {userRole === 'hr' && (
          <Dialog open={showNewBonusDialog} onOpenChange={setShowNewBonusDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Bonus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bonus</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select value={newBonus.employeeId} onValueChange={(value) => setNewBonus(prev => ({ ...prev, employeeId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMP001">Sarah Johnson</SelectItem>
                      <SelectItem value="EMP002">Mike Chen</SelectItem>
                      <SelectItem value="EMP003">Emma Wilson</SelectItem>
                      <SelectItem value="EMP100">Alex Rodriguez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Bonus Type</Label>
                  <Select value={newBonus.type} onValueChange={(value) => setNewBonus(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bonus type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team-lead">Team Lead Bonus</SelectItem>
                      <SelectItem value="project-estimation">Project Estimation Bonus</SelectItem>
                      <SelectItem value="education">Education Bonus</SelectItem>
                      <SelectItem value="content-creation">Content Creation Bonus</SelectItem>
                      <SelectItem value="performance">Performance Bonus</SelectItem>
                      <SelectItem value="one-time">One-time Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      value={newBonus.amount}
                      onChange={(e) => setNewBonus(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Month</Label>
                    <Select value={newBonus.month} onValueChange={(value) => setNewBonus(prev => ({ ...prev, month: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="January">January</SelectItem>
                        <SelectItem value="February">February</SelectItem>
                        <SelectItem value="March">March</SelectItem>
                        <SelectItem value="April">April</SelectItem>
                        <SelectItem value="May">May</SelectItem>
                        <SelectItem value="June">June</SelectItem>
                        <SelectItem value="July">July</SelectItem>
                        <SelectItem value="August">August</SelectItem>
                        <SelectItem value="September">September</SelectItem>
                        <SelectItem value="October">October</SelectItem>
                        <SelectItem value="November">November</SelectItem>
                        <SelectItem value="December">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <Select value={newBonus.year.toString()} onValueChange={(value) => setNewBonus(prev => ({ ...prev, year: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={newBonus.description}
                    onChange={(e) => setNewBonus(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the bonus"
                  />
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={newBonus.reason}
                    onChange={(e) => setNewBonus(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Detailed reason for the bonus"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowNewBonusDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddBonus}>
                    Add Bonus
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Period Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Label>Period:</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="January">January</SelectItem>
              <SelectItem value="February">February</SelectItem>
              <SelectItem value="March">March</SelectItem>
              <SelectItem value="April">April</SelectItem>
              <SelectItem value="May">May</SelectItem>
              <SelectItem value="June">June</SelectItem>
              <SelectItem value="July">July</SelectItem>
              <SelectItem value="August">August</SelectItem>
              <SelectItem value="September">September</SelectItem>
              <SelectItem value="October">October</SelectItem>
              <SelectItem value="November">November</SelectItem>
              <SelectItem value="December">December</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBonuses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{selectedMonth} {selectedYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Bonuses</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBonuses.length}</div>
            <p className="text-xs text-muted-foreground">Ready for payout</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBonuses.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Bonus</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredBonuses.length > 0 ? Math.round(totalBonuses / filteredBonuses.length) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per employee</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bonuses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bonuses">Monthly Bonuses</TabsTrigger>
          <TabsTrigger value="history">Bonus History</TabsTrigger>
          {userRole === 'hr' && <TabsTrigger value="salary">Salary Overview</TabsTrigger>}
        </TabsList>

        <TabsContent value="bonuses">
          <Card>
            <CardHeader>
              <CardTitle>{selectedMonth} {selectedYear} Bonuses</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    {userRole === 'hr' && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonuses.map((bonus) => (
                    <TableRow key={bonus.id}>
                      <TableCell>{bonus.employeeName}</TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(bonus.type)}>
                          {getTypeLabel(bonus.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>${bonus.amount}</TableCell>
                      <TableCell>{bonus.description}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(bonus.status)}>
                          {bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {userRole === 'hr' && (
                        <TableCell>
                          {bonus.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => updateBonusStatus(bonus.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBonusStatus(bonus.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                          {bonus.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateBonusStatus(bonus.id, 'paid')}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredBonuses.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No bonuses for {selectedMonth} {selectedYear}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Bonus History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bonuses.map((bonus) => (
                  <Card key={bonus.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{bonus.employeeName}</h4>
                          <p className="text-sm text-gray-600">{bonus.description}</p>
                          <p className="text-xs text-gray-500">{bonus.month} {bonus.year}</p>
                          {bonus.reason && (
                            <p className="text-sm text-gray-700 mt-1">{bonus.reason}</p>
                          )}
                          {bonus.payoutDate && (
                            <p className="text-xs text-green-600 mt-1">
                              Paid on {format(bonus.payoutDate, 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">${bonus.amount}</div>
                          <Badge className={getTypeColor(bonus.type)}>
                            {getTypeLabel(bonus.type)}
                          </Badge>
                          <div className="mt-1">
                            <Badge className={getStatusColor(bonus.status)}>
                              {bonus.status.charAt(0).toUpperCase() + bonus.status.slice(1)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {userRole === 'hr' && (
          <TabsContent value="salary">
            <Card>
              <CardHeader>
                <CardTitle>Salary Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Base Salary</TableHead>
                      <TableHead>Effective Date</TableHead>
                      <TableHead>Last Review</TableHead>
                      <TableHead>Next Review</TableHead>
                      <TableHead>YTD Bonuses</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salaryInfo.map((salary) => {
                      const ytdBonuses = bonuses
                        .filter(b => b.employeeId === salary.employeeId && b.year === 2024 && (b.status === 'approved' || b.status === 'paid'))
                        .reduce((sum, b) => sum + b.amount, 0);
                      
                      return (
                        <TableRow key={salary.employeeId}>
                          <TableCell>{salary.employeeName}</TableCell>
                          <TableCell>${salary.baseSalary.toLocaleString()}</TableCell>
                          <TableCell>{format(salary.effectiveDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{format(salary.lastReviewDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>{format(salary.nextReviewDate, 'MMM dd, yyyy')}</TableCell>
                          <TableCell>${ytdBonuses.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}