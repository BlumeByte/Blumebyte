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
import { Plus, TrendingUp, Users, Award, Eye, Send } from 'lucide-react';
import { format } from 'date-fns';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract';
  cpfLevel: string;
  description: string;
  requirements: string[];
  postedDate: Date;
  deadline: Date;
  status: 'active' | 'closed' | 'draft';
  applications: number;
}

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  applicantName: string;
  applicantId: string;
  currentRole: string;
  currentCpfLevel: string;
  appliedDate: Date;
  status: 'submitted' | 'under-review' | 'interview' | 'accepted' | 'rejected';
  coverLetter: string;
  motivation: string;
}

interface Promotion {
  id: string;
  employeeName: string;
  employeeId: string;
  fromRole: string;
  toRole: string;
  fromCpfLevel: string;
  toCpfLevel: string;
  effectiveDate: Date;
  reason: string;
  approvedBy: string;
  salaryIncrease?: number;
  notes: string;
}

const mockJobPostings: JobPosting[] = [
  {
    id: 'JOB001',
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    type: 'full-time',
    cpfLevel: 'L4 - Senior Engineer',
    description: 'We are looking for a Senior Frontend Developer to join our team and lead frontend initiatives.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'Leadership experience'],
    postedDate: new Date('2024-12-01'),
    deadline: new Date('2024-12-31'),
    status: 'active',
    applications: 3
  },
  {
    id: 'JOB002',
    title: 'Product Manager',
    department: 'Product',
    location: 'Remote',
    type: 'full-time',
    cpfLevel: 'L5 - Lead',
    description: 'Looking for an experienced Product Manager to drive product strategy and development.',
    requirements: ['3+ years PM experience', 'Technical background', 'Stakeholder management'],
    postedDate: new Date('2024-11-15'),
    deadline: new Date('2024-12-25'),
    status: 'active',
    applications: 5
  }
];

const mockApplications: Application[] = [
  {
    id: 'APP001',
    jobId: 'JOB001',
    jobTitle: 'Senior Frontend Developer',
    applicantName: 'Mike Chen',
    applicantId: 'EMP002',
    currentRole: 'Backend Developer',
    currentCpfLevel: 'L3 - Mid-level Engineer',
    appliedDate: new Date('2024-12-05'),
    status: 'under-review',
    coverLetter: 'I am excited about the opportunity to transition to frontend development and lead initiatives.',
    motivation: 'I have been working on expanding my frontend skills and would love to take on more responsibility.'
  },
  {
    id: 'APP002',
    jobId: 'JOB002',
    jobTitle: 'Product Manager',
    applicantName: 'Emma Wilson',
    applicantId: 'EMP003',
    currentRole: 'UX Designer',
    currentCpfLevel: 'L2 - Junior Designer',
    appliedDate: new Date('2024-11-20'),
    status: 'interview',
    coverLetter: 'My design background gives me unique insights into product development.',
    motivation: 'I want to move into product management to have a broader impact on our products.'
  }
];

const mockPromotions: Promotion[] = [
  {
    id: 'PROM001',
    employeeName: 'Sarah Johnson',
    employeeId: 'EMP001',
    fromRole: 'Frontend Developer',
    toRole: 'Senior Frontend Developer',
    fromCpfLevel: 'L3 - Mid-level Engineer',
    toCpfLevel: 'L4 - Senior Engineer',
    effectiveDate: new Date('2024-01-01'),
    reason: 'Exceptional performance and leadership demonstrated in Q4 2023',
    approvedBy: 'Alexandra HR',
    salaryIncrease: 10000,
    notes: 'Promoted based on consistent high performance and taking on additional responsibilities'
  }
];

export function MobilityModule({ userRole }: { userRole: string }) {
  const [jobPostings, setJobPostings] = useState<JobPosting[]>(mockJobPostings);
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [promotions] = useState<Promotion[]>(mockPromotions);
  const [showNewJobDialog, setShowNewJobDialog] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  const [newJob, setNewJob] = useState({
    title: '',
    department: '',
    location: '',
    type: 'full-time' as JobPosting['type'],
    cpfLevel: '',
    description: '',
    requirements: '',
    deadline: ''
  });

  const [newApplication, setNewApplication] = useState({
    jobId: '',
    coverLetter: '',
    motivation: ''
  });

  const handleCreateJob = () => {
    if (!newJob.title || !newJob.department || !newJob.description) return;

    const job: JobPosting = {
      id: `JOB${String(jobPostings.length + 1).padStart(3, '0')}`,
      title: newJob.title,
      department: newJob.department,
      location: newJob.location,
      type: newJob.type,
      cpfLevel: newJob.cpfLevel,
      description: newJob.description,
      requirements: newJob.requirements.split('\n').filter(r => r.trim()),
      postedDate: new Date(),
      deadline: new Date(newJob.deadline),
      status: 'draft',
      applications: 0
    };

    setJobPostings(prev => [job, ...prev]);
    setShowNewJobDialog(false);
    setNewJob({
      title: '',
      department: '',
      location: '',
      type: 'full-time',
      cpfLevel: '',
      description: '',
      requirements: '',
      deadline: ''
    });
  };

  const handleSubmitApplication = () => {
    if (!newApplication.jobId || !newApplication.coverLetter) return;

    const job = jobPostings.find(j => j.id === newApplication.jobId);
    if (!job) return;

    const application: Application = {
      id: `APP${String(applications.length + 1).padStart(3, '0')}`,
      jobId: newApplication.jobId,
      jobTitle: job.title,
      applicantName: 'Current User',
      applicantId: 'EMP001',
      currentRole: 'Current Role',
      currentCpfLevel: 'L3 - Mid-level',
      appliedDate: new Date(),
      status: 'submitted',
      coverLetter: newApplication.coverLetter,
      motivation: newApplication.motivation
    };

    setApplications(prev => [application, ...prev]);
    setJobPostings(prev => prev.map(job => 
      job.id === newApplication.jobId 
        ? { ...job, applications: job.applications + 1 }
        : job
    ));
    
    setShowApplicationDialog(false);
    setNewApplication({
      jobId: '',
      coverLetter: '',
      motivation: ''
    });
  };

  const updateJobStatus = (jobId: string, status: JobPosting['status']) => {
    setJobPostings(prev => prev.map(job => 
      job.id === jobId ? { ...job, status } : job
    ));
  };

  const updateApplicationStatus = (applicationId: string, status: Application['status']) => {
    setApplications(prev => prev.map(app => 
      app.id === applicationId ? { ...app, status } : app
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'interview': return 'bg-blue-100 text-blue-800';
      case 'under-review': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Internal Mobility & Promotions</h2>
          <p className="text-gray-600">Manage internal opportunities and career advancement</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="w-4 h-4 mr-2" />
                Apply for Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Apply for Internal Position</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Position</Label>
                  <Select value={newApplication.jobId} onValueChange={(value) => setNewApplication(prev => ({ ...prev, jobId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobPostings.filter(job => job.status === 'active').map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cover Letter</Label>
                  <Textarea
                    value={newApplication.coverLetter}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, coverLetter: e.target.value }))}
                    placeholder="Explain why you're interested in this role and what qualifies you..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Motivation</Label>
                  <Textarea
                    value={newApplication.motivation}
                    onChange={(e) => setNewApplication(prev => ({ ...prev, motivation: e.target.value }))}
                    placeholder="What motivates you to make this career move?"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitApplication}>
                    Submit Application
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {userRole === 'hr' && (
            <Dialog open={showNewJobDialog} onOpenChange={setShowNewJobDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Post Internal Job Opening</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Job Title</Label>
                      <Input
                        value={newJob.title}
                        onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Senior Developer"
                      />
                    </div>
                    <div>
                      <Label>Department</Label>
                      <Select value={newJob.department} onValueChange={(value) => setNewJob(prev => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Product">Product</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="HR">Human Resources</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={newJob.location}
                        onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., San Francisco, CA"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={newJob.type} onValueChange={(value) => setNewJob(prev => ({ ...prev, type: value as any }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>CPF Level</Label>
                      <Select value={newJob.cpfLevel} onValueChange={(value) => setNewJob(prev => ({ ...prev, cpfLevel: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="L2 - Junior">L2 - Junior</SelectItem>
                          <SelectItem value="L3 - Mid-level">L3 - Mid-level</SelectItem>
                          <SelectItem value="L4 - Senior">L4 - Senior</SelectItem>
                          <SelectItem value="L5 - Lead">L5 - Lead</SelectItem>
                          <SelectItem value="L6 - Principal">L6 - Principal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Job Description</Label>
                    <Textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed job description..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label>Requirements (one per line)</Label>
                    <Textarea
                      value={newJob.requirements}
                      onChange={(e) => setNewJob(prev => ({ ...prev, requirements: e.target.value }))}
                      placeholder="5+ years experience&#10;Leadership skills&#10;Technical expertise"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label>Application Deadline</Label>
                    <Input
                      type="date"
                      value={newJob.deadline}
                      onChange={(e) => setNewJob(prev => ({ ...prev, deadline: e.target.value }))}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowNewJobDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateJob}>
                      Create Job Posting
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Openings</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {jobPostings.filter(job => job.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Send className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
            <p className="text-xs text-muted-foreground">
              {applications.filter(app => app.status === 'submitted').length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotions YTD</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{promotions.length}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fill Rate</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">Internal positions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="openings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="openings">Job Openings</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
          {(userRole === 'hr' || userRole === 'manager') && <TabsTrigger value="manage">Manage Applications</TabsTrigger>}
          <TabsTrigger value="promotions">Promotion History</TabsTrigger>
          <TabsTrigger value="cpf">CPF Framework</TabsTrigger>
        </TabsList>

        <TabsContent value="openings">
          <Card>
            <CardHeader>
              <CardTitle>Internal Job Openings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {jobPostings.filter(job => job.status === 'active').map((job) => (
                  <Card key={job.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-lg">{job.title}</h4>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{job.department}</span>
                            <span>{job.location}</span>
                            <span>{job.cpfLevel}</span>
                          </div>
                          <p className="text-gray-700 mt-2">{job.description}</p>
                          <div className="mt-3">
                            <Label className="text-sm font-medium text-gray-500">Requirements:</Label>
                            <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                              {job.requirements.map((req, index) => (
                                <li key={index}>{req}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                            <span>Posted {format(job.postedDate, 'MMM dd, yyyy')}</span>
                            <span>Deadline {format(job.deadline, 'MMM dd, yyyy')}</span>
                            <span>{job.applications} applications</span>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Badge className={getStatusColor(job.status)}>
                            {job.status}
                          </Badge>
                          <Badge variant="outline">
                            {job.type}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => {
                              setNewApplication(prev => ({ ...prev, jobId: job.id }));
                              setShowApplicationDialog(true);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.filter(app => app.applicantId === 'EMP001').map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>{application.jobTitle}</TableCell>
                      <TableCell>
                        {jobPostings.find(job => job.id === application.jobId)?.department}
                      </TableCell>
                      <TableCell>{format(application.appliedDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace('-', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {(userRole === 'hr' || userRole === 'manager') && (
          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle>Manage Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>{application.applicantName}</TableCell>
                        <TableCell>{application.jobTitle}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{application.currentRole}</div>
                            <div className="text-sm text-gray-600">{application.currentCpfLevel}</div>
                          </div>
                        </TableCell>
                        <TableCell>{format(application.appliedDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              Review
                            </Button>
                            {application.status === 'submitted' && (
                              <Select onValueChange={(value) => updateApplicationStatus(application.id, value as any)}>
                                <SelectTrigger className="w-24">
                                  <SelectValue placeholder="Update" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="under-review">Review</SelectItem>
                                  <SelectItem value="interview">Interview</SelectItem>
                                  <SelectItem value="accepted">Accept</SelectItem>
                                  <SelectItem value="rejected">Reject</SelectItem>
                                </SelectContent>
                              </Select>
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
        )}

        <TabsContent value="promotions">
          <Card>
            <CardHeader>
              <CardTitle>Promotion History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotions.map((promotion) => (
                  <Card key={promotion.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{promotion.employeeName}</h4>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Role:</span>
                              <span className="text-sm">{promotion.fromRole}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-sm font-medium">{promotion.toRole}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">CPF Level:</span>
                              <span className="text-sm">{promotion.fromCpfLevel}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-sm font-medium">{promotion.toCpfLevel}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700 mt-2">{promotion.reason}</p>
                          {promotion.notes && (
                            <p className="text-xs text-gray-600 mt-1">{promotion.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {format(promotion.effectiveDate, 'MMM dd, yyyy')}
                          </div>
                          {promotion.salaryIncrease && (
                            <div className="text-sm font-medium text-green-600">
                              +${promotion.salaryIncrease.toLocaleString()}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            Approved by {promotion.approvedBy}
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

        <TabsContent value="cpf">
          <Card>
            <CardHeader>
              <CardTitle>Career Progression Framework (CPF)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { level: 'L1', title: 'Entry Level', description: 'New graduates and career changers' },
                    { level: 'L2', title: 'Junior', description: '1-2 years experience, learning fundamentals' },
                    { level: 'L3', title: 'Mid-level', description: '3-5 years experience, independent contributor' },
                    { level: 'L4', title: 'Senior', description: '5+ years experience, mentors others' },
                    { level: 'L5', title: 'Lead', description: 'Technical/team leadership, drives initiatives' },
                    { level: 'L6', title: 'Principal', description: 'Strategic influence, company-wide impact' }
                  ].map((level) => (
                    <Card key={level.level} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <h4 className="font-medium">{level.level} - {level.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium mb-4">Advancement Guidelines</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Performance:</strong> Consistent high performance ratings over multiple review cycles
                    </div>
                    <div>
                      <strong>Impact:</strong> Demonstrated impact on projects, team, and company goals
                    </div>
                    <div>
                      <strong>Skills:</strong> Technical and soft skills appropriate for the target level
                    </div>
                    <div>
                      <strong>Leadership:</strong> Evidence of mentoring, initiative-taking, and influence
                    </div>
                    <div>
                      <strong>Tenure:</strong> Minimum time in current level (varies by level)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}