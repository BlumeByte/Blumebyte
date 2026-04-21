import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Building, Users, Search, Filter, Mail, Phone, MapPin } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  cpfLevel: string;
  email: string;
  phone: string;
  location: string;
  managerId?: string;
  directReports: string[];
  avatar?: string;
  startDate: string;
  team?: string;
}

const mockEmployees: Employee[] = [
  {
    id: 'EMP001',
    name: 'Alexandra Rodriguez',
    role: 'CEO',
    department: 'Executive',
    cpfLevel: 'Executive',
    email: 'alexandra@example.com',
    phone: '+1 (555) 100-0001',
    location: 'San Francisco, CA',
    directReports: ['EMP002', 'EMP003', 'EMP004'],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    startDate: '2020-01-01'
  },
  {
    id: 'EMP002',
    name: 'Alex Rodriguez',
    role: 'Engineering Manager',
    department: 'Engineering',
    cpfLevel: 'L5 - Lead',
    email: 'alex.rodriguez@example.com',
    phone: '+1 (555) 100-0002',
    location: 'San Francisco, CA',
    managerId: 'EMP001',
    directReports: ['EMP005', 'EMP006', 'EMP007'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    startDate: '2020-06-01',
    team: 'Backend Team'
  },
  {
    id: 'EMP003',
    name: 'Sarah Creative',
    role: 'Design Manager',
    department: 'Design',
    cpfLevel: 'L5 - Lead',
    email: 'sarah.creative@example.com',
    phone: '+1 (555) 100-0003',
    location: 'Seattle, WA',
    managerId: 'EMP001',
    directReports: ['EMP008', 'EMP009'],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    startDate: '2020-08-15',
    team: 'Design Team'
  },
  {
    id: 'EMP004',
    name: 'HR Director',
    role: 'HR Director',
    department: 'Human Resources',
    cpfLevel: 'L5 - Lead',
    email: 'hr@example.com',
    phone: '+1 (555) 100-0004',
    location: 'San Francisco, CA',
    managerId: 'EMP001',
    directReports: ['EMP010'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    startDate: '2020-03-01'
  },
  {
    id: 'EMP005',
    name: 'Sarah Johnson',
    role: 'Senior Frontend Developer',
    department: 'Engineering',
    cpfLevel: 'L4 - Senior Engineer',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 100-0005',
    location: 'San Francisco, CA',
    managerId: 'EMP002',
    directReports: [],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    startDate: '2022-01-15',
    team: 'Frontend Team'
  },
  {
    id: 'EMP006',
    name: 'Mike Chen',
    role: 'Backend Developer',
    department: 'Engineering',
    cpfLevel: 'L3 - Mid-level Engineer',
    email: 'mike.chen@example.com',
    phone: '+1 (555) 100-0006',
    location: 'Austin, TX',
    managerId: 'EMP002',
    directReports: [],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    startDate: '2021-06-01',
    team: 'Backend Team'
  },
  {
    id: 'EMP007',
    name: 'David Kim',
    role: 'DevOps Engineer',
    department: 'Engineering',
    cpfLevel: 'L3 - Mid-level Engineer',
    email: 'david.kim@example.com',
    phone: '+1 (555) 100-0007',
    location: 'Remote',
    managerId: 'EMP002',
    directReports: [],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    startDate: '2021-09-01',
    team: 'DevOps Team'
  },
  {
    id: 'EMP008',
    name: 'Emma Wilson',
    role: 'UX Designer',
    department: 'Design',
    cpfLevel: 'L2 - Junior Designer',
    email: 'emma.wilson@example.com',
    phone: '+1 (555) 100-0008',
    location: 'Seattle, WA',
    managerId: 'EMP003',
    directReports: [],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    startDate: '2023-03-01',
    team: 'UX Team'
  },
  {
    id: 'EMP009',
    name: 'Lisa Zhang',
    role: 'Product Designer',
    department: 'Design',
    cpfLevel: 'L3 - Mid-level Designer',
    email: 'lisa.zhang@example.com',
    phone: '+1 (555) 100-0009',
    location: 'Remote',
    managerId: 'EMP003',
    directReports: [],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    startDate: '2022-07-01',
    team: 'Product Design Team'
  },
  {
    id: 'EMP010',
    name: 'Alexandra HR',
    role: 'HR Specialist',
    department: 'Human Resources',
    cpfLevel: 'L3 - Mid-level',
    email: 'alexandra.hr@example.com',
    phone: '+1 (555) 100-0010',
    location: 'San Francisco, CA',
    managerId: 'EMP004',
    directReports: [],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    startDate: '2021-02-01'
  }
];

export function OrgChartModule({ userRole }: { userRole: string }) {
  const [employees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree');

  const departments = [...new Set(employees.map(emp => emp.department))];
  const teams = [...new Set(employees.map(emp => emp.team).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getDirectReports = (managerId: string): Employee[] => {
    return employees.filter(emp => emp.managerId === managerId);
  };

  const renderTreeNode = (employee: Employee, level = 0) => {
    const directReports = getDirectReports(employee.id);
    
    return (
      <div key={employee.id} className={`${level > 0 ? 'ml-8' : ''}`}>
        <Card 
          className={`mb-4 cursor-pointer transition-colors hover:bg-gray-50 ${
            selectedEmployee?.id === employee.id ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => setSelectedEmployee(employee)}
        >
          <CardContent className="pt-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={employee.avatar} />
                <AvatarFallback>
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h4 className="font-medium">{employee.name}</h4>
                <p className="text-sm text-gray-600">{employee.role}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {employee.department}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {employee.cpfLevel}
                  </Badge>
                  {employee.team && (
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      {employee.team}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{employee.location}</span>
                </div>
                {directReports.length > 0 && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Users className="w-3 h-3" />
                    <span>{directReports.length} reports</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {directReports.length > 0 && (
          <div className="border-l-2 border-gray-200 ml-6">
            {directReports.map(report => renderTreeNode(report, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card 
            key={employee.id}
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${
              selectedEmployee?.id === employee.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedEmployee(employee)}
          >
            <CardContent className="pt-4">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={employee.avatar} />
                  <AvatarFallback>
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium">{employee.name}</h4>
                  <p className="text-sm text-gray-600">{employee.role}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {employee.department}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {employee.cpfLevel}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{employee.location}</span>
                </div>
                {employee.team && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Users className="w-3 h-3" />
                    <span>{employee.team}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const ceoEmployee = employees.find(emp => emp.role === 'CEO');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Organization Chart</h2>
          <p className="text-gray-600">Visualize team structure and reporting relationships</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'tree' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('tree')}
          >
            Tree View
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid View
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locations</CardTitle>
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...new Set(employees.map(emp => emp.location))].length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterDepartment} onValueChange={setFilterDepartment}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {viewMode === 'tree' ? 'Organizational Structure' : 'Employee Directory'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'tree' ? (
                <div className="space-y-4">
                  {ceoEmployee && renderTreeNode(ceoEmployee)}
                </div>
              ) : (
                renderGridView()
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={selectedEmployee.avatar} />
                      <AvatarFallback className="text-xl">
                        {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-bold text-lg">{selectedEmployee.name}</h3>
                    <p className="text-gray-600">{selectedEmployee.role}</p>
                    <div className="flex justify-center space-x-2 mt-2">
                      <Badge>{selectedEmployee.department}</Badge>
                      <Badge variant="outline">{selectedEmployee.cpfLevel}</Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedEmployee.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedEmployee.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedEmployee.location}</span>
                    </div>
                    {selectedEmployee.team && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{selectedEmployee.team}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Reporting Structure</h4>
                    {selectedEmployee.managerId && (
                      <div className="mb-2">
                        <span className="text-sm text-gray-600">Reports to:</span>
                        <p className="text-sm font-medium">
                          {employees.find(emp => emp.id === selectedEmployee.managerId)?.name}
                        </p>
                      </div>
                    )}
                    {selectedEmployee.directReports.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-600">Direct Reports ({selectedEmployee.directReports.length}):</span>
                        <div className="mt-1 space-y-1">
                          {selectedEmployee.directReports.map(reportId => {
                            const report = employees.find(emp => emp.id === reportId);
                            return report ? (
                              <p key={reportId} className="text-sm">{report.name}</p>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <span className="text-sm text-gray-600">Start Date:</span>
                    <p className="text-sm">{new Date(selectedEmployee.startDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an employee to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="departments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="departments">By Department</TabsTrigger>
          <TabsTrigger value="teams">By Team</TabsTrigger>
          <TabsTrigger value="locations">By Location</TabsTrigger>
          <TabsTrigger value="levels">By CPF Level</TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((department) => {
              const deptEmployees = employees.filter(emp => emp.department === department);
              return (
                <Card key={department}>
                  <CardHeader>
                    <CardTitle className="text-lg">{department}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Employees:</span>
                        <span className="font-medium">{deptEmployees.length}</span>
                      </div>
                      <div className="space-y-1">
                        {deptEmployees.slice(0, 3).map((emp) => (
                          <div key={emp.id} className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={emp.avatar} />
                              <AvatarFallback className="text-xs">
                                {emp.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{emp.name}</span>
                          </div>
                        ))}
                        {deptEmployees.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{deptEmployees.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => {
              const teamEmployees = employees.filter(emp => emp.team === team);
              return (
                <Card key={team}>
                  <CardHeader>
                    <CardTitle className="text-lg">{team}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Team Size:</span>
                        <span className="font-medium">{teamEmployees.length}</span>
                      </div>
                      <div className="space-y-1">
                        {teamEmployees.map((emp) => (
                          <div key={emp.id} className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={emp.avatar} />
                              <AvatarFallback className="text-xs">
                                {emp.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{emp.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...new Set(employees.map(emp => emp.location))].map((location) => {
              const locationEmployees = employees.filter(emp => emp.location === location);
              return (
                <Card key={location}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="w-5 h-5 mr-2" />
                      {location}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Employees:</span>
                        <span className="font-medium">{locationEmployees.length}</span>
                      </div>
                      <div className="space-y-1">
                        {locationEmployees.slice(0, 4).map((emp) => (
                          <div key={emp.id} className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={emp.avatar} />
                              <AvatarFallback className="text-xs">
                                {emp.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{emp.name}</span>
                          </div>
                        ))}
                        {locationEmployees.length > 4 && (
                          <p className="text-xs text-gray-500">
                            +{locationEmployees.length - 4} more
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="levels">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...new Set(employees.map(emp => emp.cpfLevel))].map((level) => {
              const levelEmployees = employees.filter(emp => emp.cpfLevel === level);
              return (
                <Card key={level}>
                  <CardHeader>
                    <CardTitle className="text-lg">{level}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Count:</span>
                        <span className="font-medium">{levelEmployees.length}</span>
                      </div>
                      <div className="space-y-1">
                        {levelEmployees.slice(0, 3).map((emp) => (
                          <div key={emp.id} className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={emp.avatar} />
                              <AvatarFallback className="text-xs">
                                {emp.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm">{emp.name}</div>
                              <div className="text-xs text-gray-500">{emp.department}</div>
                            </div>
                          </div>
                        ))}
                        {levelEmployees.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{levelEmployees.length - 3} more
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}