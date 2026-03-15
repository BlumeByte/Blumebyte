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
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Plus, Edit, Eye, Download, Upload, Calendar, MapPin, Phone, Mail, Briefcase, Star } from 'lucide-react';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  birthday: string;
  startDate: string;
  role: string;
  cpfLevel: string;
  department: string;
  manager: string;
  salary: number;
  technologies: string[];
  projects: Project[];
  equipment: Equipment[];
  avatar?: string;
  status: 'active' | 'inactive' | 'on-leave';
}

interface Project {
  id: string;
  name: string;
  role: string;
  startDate: string;
  endDate?: string;
  status: 'current' | 'completed';
}

interface Equipment {
  id: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  assignedDate: string;
  status: 'assigned' | 'returned' | 'damaged';
}

interface ChangeHistory {
  id: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  changeDate: string;
  reason?: string;
}

const mockEmployees: Employee[] = [
  {
    id: 'EMP001',
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@blumebyte.com',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Street, San Francisco, CA 94105',
    emergencyContact: 'Michael Johnson (Spouse)',
    emergencyPhone: '+1 (555) 987-6543',
    birthday: '1990-03-15',
    startDate: '2022-01-15',
    role: 'Senior Frontend Developer',
    cpfLevel: 'L4 - Senior Engineer',
    department: 'Engineering',
    manager: 'Alex Rodriguez',
    salary: 95000,
    technologies: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    projects: [
      { id: 'P1', name: 'E-commerce Platform', role: 'Lead Developer', startDate: '2024-01-01', status: 'current' },
      { id: 'P2', name: 'Mobile App', role: 'Frontend Developer', startDate: '2023-06-01', endDate: '2023-12-31', status: 'completed' }
    ],
    equipment: [
      { id: 'EQ1', type: 'Laptop', brand: 'MacBook', model: 'Pro 14"', serialNumber: 'MB123456', assignedDate: '2022-01-15', status: 'assigned' },
      { id: 'EQ2', type: 'Monitor', brand: 'Dell', model: 'UltraSharp 27"', serialNumber: 'DL789012', assignedDate: '2022-01-15', status: 'assigned' }
    ],
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    status: 'active'
  },
  {
    id: 'EMP002',
    fullName: 'Mike Chen',
    email: 'mike.chen@blumebyte.com',
    phone: '+1 (555) 234-5678',
    address: '456 Innovation Blvd, Austin, TX 78701',
    emergencyContact: 'Lisa Chen (Sister)',
    emergencyPhone: '+1 (555) 876-5432',
    birthday: '1988-07-22',
    startDate: '2021-06-01',
    role: 'Backend Developer',
    cpfLevel: 'L3 - Mid-level Engineer',
    department: 'Engineering',
    manager: 'Alex Rodriguez',
    salary: 85000,
    technologies: ['Python', 'Django', 'PostgreSQL', 'Docker'],
    projects: [
      { id: 'P3', name: 'API Gateway', role: 'Backend Lead', startDate: '2024-02-01', status: 'current' }
    ],
    equipment: [
      { id: 'EQ3', type: 'Laptop', brand: 'MacBook', model: 'Air 13"', serialNumber: 'MB654321', assignedDate: '2021-06-01', status: 'assigned' }
    ],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    status: 'active'
  },
  {
    id: 'EMP003',
    fullName: 'Emma Wilson',
    email: 'emma.wilson@blumebyte.com',
    phone: '+1 (555) 345-6789',
    address: '789 Design Ave, Seattle, WA 98101',
    emergencyContact: 'David Wilson (Father)',
    emergencyPhone: '+1 (555) 765-4321',
    birthday: '1992-11-08',
    startDate: '2023-03-01',
    role: 'UX Designer',
    cpfLevel: 'L2 - Junior Designer',
    department: 'Design',
    manager: 'Sarah Creative',
    salary: 70000,
    technologies: ['Figma', 'Adobe XD', 'Sketch', 'InVision'],
    projects: [
      { id: 'P4', name: 'Design System', role: 'UX Designer', startDate: '2023-09-01', status: 'current' }
    ],
    equipment: [
      { id: 'EQ4', type: 'Laptop', brand: 'MacBook', model: 'Pro 16"', serialNumber: 'MB111222', assignedDate: '2023-03-01', status: 'assigned' }
    ],
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    status: 'active'
  }
];

const mockChangeHistory: ChangeHistory[] = [
  {
    id: '1',
    field: 'Salary',
    oldValue: '$85,000',
    newValue: '$95,000',
    changedBy: 'Alexandra HR',
    changeDate: '2024-01-01',
    reason: 'Annual raise and promotion'
  },
  {
    id: '2',
    field: 'CPF Level',
    oldValue: 'L3 - Mid-level Engineer',
    newValue: 'L4 - Senior Engineer',
    changedBy: 'Alexandra HR',
    changeDate: '2024-01-01',
    reason: 'Promotion to Senior level'
  }
];

export function EmployeeProfiles({ userRole }: { userRole: string }) {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showNewEmployeeDialog, setShowNewEmployeeDialog] = useState(false);
  const [showEmployeeDetails, setShowEmployeeDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');

  const [newEmployee, setNewEmployee] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    startDate: '',
    manager: '',
    cpfLevel: '',
  });

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(employees.map(emp => emp.department))];

  const handleAddEmployee = () => {
    const employee: Employee = {
      id: `EMP${String(employees.length + 1).padStart(3, '0')}`,
      ...newEmployee,
      address: '',
      emergencyContact: '',
      emergencyPhone: '',
      birthday: '',
      salary: 0,
      technologies: [],
      projects: [],
      equipment: [],
      status: 'active'
    };
    
    setEmployees(prev => [...prev, employee]);
    setShowNewEmployeeDialog(false);
    setNewEmployee({
      fullName: '',
      email: '',
      phone: '',
      role: '',
      department: '',
      startDate: '',
      manager: '',
      cpfLevel: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'on-leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employee Profiles</h2>
          <p className="text-gray-600">Manage employee information and records</p>
        </div>
        {(userRole === 'hr') && (
          <Dialog open={showNewEmployeeDialog} onOpenChange={setShowNewEmployeeDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input
                    value={newEmployee.fullName}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Input
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, role: e.target.value }))}
                    placeholder="Enter job role"
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Select value={newEmployee.department} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, department: value }))}>
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
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={newEmployee.startDate}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Manager</Label>
                  <Input
                    value={newEmployee.manager}
                    onChange={(e) => setNewEmployee(prev => ({ ...prev, manager: e.target.value }))}
                    placeholder="Enter manager name"
                  />
                </div>
                <div>
                  <Label>CPF Level</Label>
                  <Select value={newEmployee.cpfLevel} onValueChange={(value) => setNewEmployee(prev => ({ ...prev, cpfLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select CPF level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L1 - Entry Level">L1 - Entry Level</SelectItem>
                      <SelectItem value="L2 - Junior">L2 - Junior</SelectItem>
                      <SelectItem value="L3 - Mid-level">L3 - Mid-level</SelectItem>
                      <SelectItem value="L4 - Senior">L4 - Senior</SelectItem>
                      <SelectItem value="L5 - Lead">L5 - Lead</SelectItem>
                      <SelectItem value="L6 - Principal">L6 - Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowNewEmployeeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEmployee}>
                  Add Employee
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>CPF Level</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={employee.avatar} />
                        <AvatarFallback>
                          {employee.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{employee.fullName}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.cpfLevel}</TableCell>
                  <TableCell>{new Date(employee.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setShowEmployeeDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {userRole === 'hr' && (
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
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

      {/* Employee Details Dialog */}
      <Dialog open={showEmployeeDetails} onOpenChange={setShowEmployeeDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedEmployee && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={selectedEmployee.avatar} />
                    <AvatarFallback className="text-xl">
                      {selectedEmployee.fullName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-2xl">{selectedEmployee.fullName}</DialogTitle>
                    <p className="text-gray-600">{selectedEmployee.role} • {selectedEmployee.department}</p>
                    <Badge className={getStatusColor(selectedEmployee.status)}>
                      {selectedEmployee.status.charAt(0).toUpperCase() + selectedEmployee.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="personal" className="mt-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment</TabsTrigger>
                  {userRole === 'hr' && <TabsTrigger value="history">History</TabsTrigger>}
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{selectedEmployee.email}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedEmployee.phone}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-500">Address</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{selectedEmployee.address}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Birthday</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(selectedEmployee.birthday).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Start Date</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span>{new Date(selectedEmployee.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                    <div className="mt-2 space-y-1">
                      <div>{selectedEmployee.emergencyContact}</div>
                      <div className="text-sm text-gray-600">{selectedEmployee.emergencyPhone}</div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="professional" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">CPF Level</Label>
                      <p className="mt-1">{selectedEmployee.cpfLevel}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Manager</Label>
                      <p className="mt-1">{selectedEmployee.manager}</p>
                    </div>
                    {userRole === 'hr' && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Salary</Label>
                        <p className="mt-1">${selectedEmployee.salary.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Technologies</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedEmployee.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download CV
                    </Button>
                    {userRole === 'hr' && (
                      <Button size="sm" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CV
                      </Button>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="projects" className="space-y-4">
                  {selectedEmployee.projects.map((project) => (
                    <Card key={project.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-gray-600">{project.role}</p>
                            <p className="text-xs text-gray-500">
                              {project.startDate} {project.endDate && `- ${project.endDate}`}
                            </p>
                          </div>
                          <Badge className={project.status === 'current' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="equipment" className="space-y-4">
                  {selectedEmployee.equipment.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{item.brand} {item.model}</h4>
                            <p className="text-sm text-gray-600">{item.type}</p>
                            <p className="text-xs text-gray-500">Serial: {item.serialNumber}</p>
                            <p className="text-xs text-gray-500">Assigned: {item.assignedDate}</p>
                          </div>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                {userRole === 'hr' && (
                  <TabsContent value="history" className="space-y-4">
                    <div className="space-y-3">
                      {mockChangeHistory.map((change) => (
                        <Card key={change.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{change.field} Changed</h4>
                                <p className="text-sm text-gray-600">
                                  {change.oldValue} → {change.newValue}
                                </p>
                                {change.reason && (
                                  <p className="text-xs text-gray-500 mt-1">{change.reason}</p>
                                )}
                              </div>
                              <div className="text-right text-xs text-gray-500">
                                <p>{change.changedBy}</p>
                                <p>{change.changeDate}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}