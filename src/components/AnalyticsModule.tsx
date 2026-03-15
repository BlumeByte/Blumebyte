import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { BarChart3, TrendingUp, TrendingDown, Calendar, Users, Clock, Download } from 'lucide-react';

interface LeaveAnalytics {
  month: string;
  year: number;
  totalDays: number;
  vacationDays: number;
  sickDays: number;
  wfhDays: number;
  personalDays: number;
}

interface DepartmentLeaveData {
  department: string;
  totalEmployees: number;
  averageDaysUsed: number;
  vacationDays: number;
  sickDays: number;
  wfhDays: number;
  utilizationRate: number;
}

interface EmployeeLeaveData {
  employeeId: string;
  employeeName: string;
  department: string;
  totalDaysUsed: number;
  vacationDays: number;
  sickDays: number;
  wfhDays: number;
  personalDays: number;
  remainingVacation: number;
  utilizationRate: number;
}

const mockMonthlyData: LeaveAnalytics[] = [
  { month: 'Jan', year: 2024, totalDays: 145, vacationDays: 89, sickDays: 32, wfhDays: 18, personalDays: 6 },
  { month: 'Feb', year: 2024, totalDays: 132, vacationDays: 76, sickDays: 28, wfhDays: 22, personalDays: 6 },
  { month: 'Mar', year: 2024, totalDays: 168, vacationDays: 95, sickDays: 35, wfhDays: 28, personalDays: 10 },
  { month: 'Apr', year: 2024, totalDays: 156, vacationDays: 88, sickDays: 31, wfhDays: 25, personalDays: 12 },
  { month: 'May', year: 2024, totalDays: 189, vacationDays: 112, sickDays: 29, wfhDays: 35, personalDays: 13 },
  { month: 'Jun', year: 2024, totalDays: 203, vacationDays: 134, sickDays: 22, wfhDays: 32, personalDays: 15 },
  { month: 'Jul', year: 2024, totalDays: 234, vacationDays: 178, sickDays: 18, wfhDays: 28, personalDays: 10 },
  { month: 'Aug', year: 2024, totalDays: 198, vacationDays: 145, sickDays: 25, wfhDays: 20, personalDays: 8 },
  { month: 'Sep', year: 2024, totalDays: 167, vacationDays: 98, sickDays: 33, wfhDays: 26, personalDays: 10 },
  { month: 'Oct', year: 2024, totalDays: 145, vacationDays: 82, sickDays: 28, wfhDays: 24, personalDays: 11 },
  { month: 'Nov', year: 2024, totalDays: 178, vacationDays: 123, sickDays: 24, wfhDays: 21, personalDays: 10 },
  { month: 'Dec', year: 2024, totalDays: 189, vacationDays: 142, sickDays: 19, wfhDays: 18, personalDays: 10 }
];

const mockDepartmentData: DepartmentLeaveData[] = [
  {
    department: 'Engineering',
    totalEmployees: 15,
    averageDaysUsed: 18.3,
    vacationDays: 165,
    sickDays: 42,
    wfhDays: 68,
    utilizationRate: 73
  },
  {
    department: 'Design',
    totalEmployees: 8,
    averageDaysUsed: 16.8,
    vacationDays: 89,
    sickDays: 18,
    wfhDays: 27,
    utilizationRate: 67
  },
  {
    department: 'Product',
    totalEmployees: 6,
    averageDaysUsed: 19.2,
    vacationDays: 76,
    sickDays: 15,
    wfhDays: 24,
    utilizationRate: 77
  },
  {
    department: 'Marketing',
    totalEmployees: 4,
    averageDaysUsed: 17.5,
    vacationDays: 48,
    sickDays: 12,
    wfhDays: 10,
    utilizationRate: 70
  },
  {
    department: 'Sales',
    totalEmployees: 8,
    averageDaysUsed: 15.9,
    vacationDays: 85,
    sickDays: 22,
    wfhDays: 20,
    utilizationRate: 64
  },
  {
    department: 'HR',
    totalEmployees: 3,
    averageDaysUsed: 20.1,
    vacationDays: 42,
    sickDays: 8,
    wfhDays: 10,
    utilizationRate: 80
  }
];

const mockEmployeeData: EmployeeLeaveData[] = [
  {
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    department: 'Engineering',
    totalDaysUsed: 22,
    vacationDays: 18,
    sickDays: 2,
    wfhDays: 2,
    personalDays: 0,
    remainingVacation: 3,
    utilizationRate: 88
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Mike Chen',
    department: 'Engineering',
    totalDaysUsed: 19,
    vacationDays: 15,
    sickDays: 3,
    wfhDays: 1,
    personalDays: 0,
    remainingVacation: 6,
    utilizationRate: 76
  },
  {
    employeeId: 'EMP003',
    employeeName: 'Emma Wilson',
    department: 'Design',
    totalDaysUsed: 16,
    vacationDays: 14,
    sickDays: 1,
    wfhDays: 1,
    personalDays: 0,
    remainingVacation: 4,
    utilizationRate: 80
  }
];

export function AnalyticsModule({ userRole }: { userRole: string }) {
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedPeriod, setSelectedPeriod] = useState('year');

  const currentYearData = mockMonthlyData.filter(data => data.year === parseInt(selectedYear));
  const totalDaysThisYear = currentYearData.reduce((sum, month) => sum + month.totalDays, 0);
  const totalVacationDays = currentYearData.reduce((sum, month) => sum + month.vacationDays, 0);
  const totalSickDays = currentYearData.reduce((sum, month) => sum + month.sickDays, 0);
  const totalWfhDays = currentYearData.reduce((sum, month) => sum + month.wfhDays, 0);

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'vacation': return 'bg-blue-500';
      case 'sick': return 'bg-red-500';
      case 'wfh': return 'bg-green-500';
      case 'personal': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leave Analytics & History</h2>
          <p className="text-gray-600">Analyze leave patterns and generate insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leave Days</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDaysThisYear}</div>
            <p className="text-xs text-muted-foreground">
              {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vacation Days</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVacationDays}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((totalVacationDays / totalDaysThisYear) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sick Days</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSickDays}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((totalSickDays / totalDaysThisYear) * 100)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WFH Days</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWfhDays}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((totalWfhDays / totalDaysThisYear) * 100)}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="employees">By Employee</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Leave Trends ({selectedYear})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="h-64 w-full">
                  {/* Chart placeholder - in a real app, you'd use a charting library like Recharts */}
                  <div className="flex items-end justify-between h-full bg-gray-50 rounded p-4">
                    {currentYearData.map((month, index) => (
                      <div key={index} className="flex flex-col items-center space-y-1">
                        <div className="flex flex-col-reverse space-y-reverse space-y-px">
                          <div 
                            className={`w-8 ${getLeaveTypeColor('vacation')}`}
                            style={{ height: `${(month.vacationDays / 250) * 180}px` }}
                          ></div>
                          <div 
                            className={`w-8 ${getLeaveTypeColor('sick')}`}
                            style={{ height: `${(month.sickDays / 250) * 180}px` }}
                          ></div>
                          <div 
                            className={`w-8 ${getLeaveTypeColor('wfh')}`}
                            style={{ height: `${(month.wfhDays / 250) * 180}px` }}
                          ></div>
                          <div 
                            className={`w-8 ${getLeaveTypeColor('personal')}`}
                            style={{ height: `${(month.personalDays / 250) * 180}px` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{month.month}</span>
                        <span className="text-xs font-medium">{month.totalDays}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm">Vacation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Sick</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">WFH</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span className="text-sm">Personal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Leave Usage by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockDepartmentData.map((dept) => (
                  <div key={dept.department} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{dept.department}</h4>
                        <p className="text-sm text-gray-600">
                          {dept.totalEmployees} employees • {dept.averageDaysUsed} avg days
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getUtilizationColor(dept.utilizationRate)}`}>
                          {dept.utilizationRate}% utilization
                        </div>
                        <Badge variant="outline">{dept.vacationDays + dept.sickDays + dept.wfhDays} total days</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="flex justify-between">
                          <span>Vacation:</span>
                          <span className="font-medium">{dept.vacationDays}</span>
                        </div>
                        <Progress value={(dept.vacationDays / (dept.vacationDays + dept.sickDays + dept.wfhDays)) * 100} className="h-2 mt-1" />
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>Sick:</span>
                          <span className="font-medium">{dept.sickDays}</span>
                        </div>
                        <Progress value={(dept.sickDays / (dept.vacationDays + dept.sickDays + dept.wfhDays)) * 100} className="h-2 mt-1" />
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <span>WFH:</span>
                          <span className="font-medium">{dept.wfhDays}</span>
                        </div>
                        <Progress value={(dept.wfhDays / (dept.vacationDays + dept.sickDays + dept.wfhDays)) * 100} className="h-2 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Individual Employee Leave Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockEmployeeData.map((emp) => (
                  <Card key={emp.employeeId}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-medium">{emp.employeeName}</h4>
                          <p className="text-sm text-gray-600">{emp.department}</p>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${getUtilizationColor(emp.utilizationRate)}`}>
                            {emp.utilizationRate}% utilization
                          </div>
                          <p className="text-sm text-gray-600">{emp.totalDaysUsed} days used</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="flex justify-between">
                            <span>Vacation:</span>
                            <span className="font-medium">{emp.vacationDays}</span>
                          </div>
                          <div className="text-xs text-gray-500">{emp.remainingVacation} remaining</div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>Sick:</span>
                            <span className="font-medium">{emp.sickDays}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>WFH:</span>
                            <span className="font-medium">{emp.wfhDays}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between">
                            <span>Personal:</span>
                            <span className="font-medium">{emp.personalDays}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Usage Progress</span>
                          <span>{emp.utilizationRate}%</span>
                        </div>
                        <Progress value={emp.utilizationRate} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Peak vacation months</h4>
                      <p className="text-sm text-gray-600">July and August show highest vacation usage, with 234 and 198 days respectively.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <TrendingDown className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Low utilization alert</h4>
                      <p className="text-sm text-gray-600">Sales department has 64% utilization rate - employees may need encouragement to take time off.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <BarChart3 className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Work from home trends</h4>
                      <p className="text-sm text-gray-600">WFH usage peaked in May (35 days) and has been steady around 20-30 days per month.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Clock className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Sick leave patterns</h4>
                      <p className="text-sm text-gray-600">Sick leave usage was highest in winter months (Jan-Mar) and lowest in summer (Jul-Aug).</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900">Encourage balanced leave usage</h4>
                    <p className="text-sm text-blue-800 mt-1">Consider implementing "use it or lose it" policies or reminders for employees with low utilization rates.</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900">Plan for peak periods</h4>
                    <p className="text-sm text-green-800 mt-1">Prepare staffing plans for July-August peak vacation periods to maintain productivity.</p>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-yellow-900">Winter wellness initiatives</h4>
                    <p className="text-sm text-yellow-800 mt-1">Consider additional wellness programs during winter months when sick leave usage is higher.</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900">WFH policy optimization</h4>
                    <p className="text-sm text-purple-800 mt-1">Current WFH usage is consistent - consider if current policies meet employee needs.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}