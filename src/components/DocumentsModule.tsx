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
import { Plus, Upload, Download, FileText, Clock, Shield, Eye, CheckCircle } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

interface Document {
  id: string;
  name: string;
  category: 'contract' | 'policy' | 'handbook' | 'form' | 'certificate' | 'agreement' | 'other';
  employeeId?: string;
  employeeName?: string;
  uploadDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'pending-signature' | 'signed' | 'archived';
  visibility: 'public' | 'hr-only' | 'manager-and-hr' | 'employee-specific';
  fileSize: string;
  fileType: string;
  uploadedBy: string;
  version: number;
  description: string;
  requiresSignature: boolean;
  signedDate?: Date;
  signedBy?: string;
}

const mockDocuments: Document[] = [
  {
    id: 'DOC001',
    name: 'Employee Handbook 2024',
    category: 'handbook',
    uploadDate: new Date('2024-01-01'),
    status: 'active',
    visibility: 'public',
    fileSize: '2.3 MB',
    fileType: 'PDF',
    uploadedBy: 'Alexandra HR',
    version: 3,
    description: 'Updated employee handbook with new policies and procedures',
    requiresSignature: false
  },
  {
    id: 'DOC002',
    name: 'Employment Contract - Sarah Johnson',
    category: 'contract',
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    uploadDate: new Date('2022-01-15'),
    status: 'signed',
    visibility: 'employee-specific',
    fileSize: '856 KB',
    fileType: 'PDF',
    uploadedBy: 'Alexandra HR',
    version: 1,
    description: 'Full-time employment contract',
    requiresSignature: true,
    signedDate: new Date('2022-01-15'),
    signedBy: 'Sarah Johnson'
  },
  {
    id: 'DOC003',
    name: 'NDA Agreement - Mike Chen',
    category: 'agreement',
    employeeId: 'EMP002',
    employeeName: 'Mike Chen',
    uploadDate: new Date('2021-06-01'),
    expiryDate: new Date('2025-06-01'),
    status: 'signed',
    visibility: 'hr-only',
    fileSize: '423 KB',
    fileType: 'PDF',
    uploadedBy: 'Alexandra HR',
    version: 1,
    description: 'Non-disclosure agreement',
    requiresSignature: true,
    signedDate: new Date('2021-06-01'),
    signedBy: 'Mike Chen'
  },
  {
    id: 'DOC004',
    name: 'React Certification - Sarah Johnson',
    category: 'certificate',
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    uploadDate: new Date('2024-11-15'),
    expiryDate: new Date('2026-11-15'),
    status: 'active',
    visibility: 'manager-and-hr',
    fileSize: '1.2 MB',
    fileType: 'PDF',
    uploadedBy: 'Sarah Johnson',
    version: 1,
    description: 'Advanced React certification from Frontend Masters',
    requiresSignature: false
  },
  {
    id: 'DOC005',
    name: 'Remote Work Policy Update',
    category: 'policy',
    uploadDate: new Date('2024-12-01'),
    expiryDate: new Date('2025-12-01'),
    status: 'pending-signature',
    visibility: 'public',
    fileSize: '634 KB',
    fileType: 'PDF',
    uploadedBy: 'Alexandra HR',
    version: 2,
    description: 'Updated remote work policy requiring acknowledgment',
    requiresSignature: true
  }
];

export function DocumentsModule({ userRole }: { userRole: string }) {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [newDocument, setNewDocument] = useState({
    name: '',
    category: '',
    employeeId: '',
    expiryDate: '',
    visibility: 'public',
    description: '',
    requiresSignature: false
  });
  const [otherCategory, setOtherCategory] = useState('');

  const handleUploadDocument = () => {
    if (!newDocument.name || !newDocument.category) return;

    const document: Document = {
      id: `DOC${String(documents.length + 1).padStart(3, '0')}`,
      name: newDocument.name,
      category: newDocument.category as any,
      employeeId: newDocument.employeeId || undefined,
      employeeName: newDocument.employeeId ? 'Selected Employee' : undefined,
      uploadDate: new Date(),
      expiryDate: newDocument.expiryDate ? new Date(newDocument.expiryDate) : undefined,
      status: newDocument.requiresSignature ? 'pending-signature' : 'active',
      visibility: newDocument.visibility as any,
      fileSize: '1.0 MB',
      fileType: 'PDF',
      uploadedBy: userRole === 'hr' ? 'Alexandra HR' : 'Current User',
      version: 1,
      description: newDocument.description,
      requiresSignature: newDocument.requiresSignature
    };

    setDocuments(prev => [document, ...prev]);
    setShowUploadDialog(false);
    setNewDocument({
      name: '',
      category: '',
      employeeId: '',
      expiryDate: '',
      visibility: 'public',
      description: '',
      requiresSignature: false
    });
  };

  const signDocument = (documentId: string) => {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId 
        ? { 
            ...doc, 
            status: 'signed',
            signedDate: new Date(),
            signedBy: 'Current User'
          }
        : doc
    ));
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by user role permissions
    if (userRole === 'employee') {
      return matchesCategory && matchesSearch && 
             (doc.visibility === 'public' || doc.employeeId === 'EMP001');
    }
    if (userRole === 'manager') {
      return matchesCategory && matchesSearch && 
             doc.visibility !== 'hr-only';
    }
    // HR sees all documents
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'signed': return 'bg-blue-100 text-blue-800';
      case 'pending-signature': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'contract': return 'bg-purple-100 text-purple-800';
      case 'policy': return 'bg-blue-100 text-blue-800';
      case 'handbook': return 'bg-green-100 text-green-800';
      case 'form': return 'bg-yellow-100 text-yellow-800';
      case 'certificate': return 'bg-orange-100 text-orange-800';
      case 'agreement': return 'bg-red-100 text-red-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="w-4 h-4" />;
      case 'hr-only': return <Shield className="w-4 h-4" />;
      case 'manager-and-hr': return <Shield className="w-4 h-4" />;
      case 'employee-specific': return <Eye className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const getExpiryStatus = (expiryDate?: Date) => {
    if (!expiryDate) return null;
    
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    if (daysUntilExpiry < 0) return { status: 'expired', text: 'Expired' };
    if (daysUntilExpiry <= 30) return { status: 'warning', text: `Expires in ${daysUntilExpiry} days` };
    return { status: 'valid', text: `Expires ${format(expiryDate, 'MMM dd, yyyy')}` };
  };

  const expiringDocuments = documents.filter(doc => {
    if (!doc.expiryDate) return false;
    const daysUntilExpiry = differenceInDays(doc.expiryDate, new Date());
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });

  const pendingSignatures = documents.filter(doc => doc.status === 'pending-signature');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Documents & Agreements</h2>
          <p className="text-gray-600">Manage employee documents and digital signatures</p>
        </div>
        {(userRole === 'hr' || userRole === 'manager') && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Document Name</Label>
                  <Input
                    value={newDocument.name}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter document name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={['contract','policy','handbook','form','certificate','agreement','other'].includes(newDocument.category) ? newDocument.category : (newDocument.category ? 'other' : '')} onValueChange={(value) => {
                      if (value === 'other') {
                        setNewDocument(prev => ({ ...prev, category: otherCategory || 'other' }));
                      } else {
                        setNewDocument(prev => ({ ...prev, category: value }));
                        setOtherCategory('');
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="handbook">Handbook</SelectItem>
                        <SelectItem value="form">Form</SelectItem>
                        <SelectItem value="certificate">Certificate</SelectItem>
                        <SelectItem value="agreement">Agreement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {(newDocument.category === 'other' || (newDocument.category && !['contract','policy','handbook','form','certificate','agreement'].includes(newDocument.category))) && (
                      <Input
                        className="mt-2"
                        placeholder="Specify category..."
                        value={otherCategory || (newDocument.category !== 'other' ? newDocument.category : '')}
                        onChange={e => {
                          setOtherCategory(e.target.value);
                          setNewDocument(prev => ({ ...prev, category: e.target.value || 'other' }));
                        }}
                        autoFocus
                      />
                    )}
                  </div>
                  <div>
                    <Label>Visibility</Label>
                    <Select value={newDocument.visibility} onValueChange={(value) => setNewDocument(prev => ({ ...prev, visibility: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">All Employees</SelectItem>
                        <SelectItem value="manager-and-hr">Managers & HR</SelectItem>
                        <SelectItem value="hr-only">HR Only</SelectItem>
                        <SelectItem value="employee-specific">Specific Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {newDocument.visibility === 'employee-specific' && (
                  <div>
                    <Label>Employee</Label>
                    <Select value={newDocument.employeeId} onValueChange={(value) => setNewDocument(prev => ({ ...prev, employeeId: value }))}>
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
                )}

                <div>
                  <Label>Description</Label>
                  <Input
                    value={newDocument.description}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the document"
                  />
                </div>

                <div>
                  <Label>Expiry Date (Optional)</Label>
                  <Input
                    type="date"
                    value={newDocument.expiryDate}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, expiryDate: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiresSignature"
                    checked={newDocument.requiresSignature}
                    onChange={(e) => setNewDocument(prev => ({ ...prev, requiresSignature: e.target.checked }))}
                  />
                  <Label htmlFor="requiresSignature">Requires digital signature</Label>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadDocument}>
                    Upload Document
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
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Signatures</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSignatures.length}</div>
            <p className="text-xs text-muted-foreground">Require action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringDocuments.length}</div>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground">Documents signed</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="contract">Contracts</SelectItem>
            <SelectItem value="policy">Policies</SelectItem>
            <SelectItem value="handbook">Handbooks</SelectItem>
            <SelectItem value="form">Forms</SelectItem>
            <SelectItem value="certificate">Certificates</SelectItem>
            <SelectItem value="agreement">Agreements</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="signatures">Pending Signatures</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="personal">My Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => {
                    const expiryStatus = getExpiryStatus(document.expiryDate);
                    
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{document.name}</p>
                              <p className="text-sm text-gray-600">{document.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-gray-500">{document.fileSize}</span>
                                <span className="text-xs text-gray-500">v{document.version}</span>
                                {getVisibilityIcon(document.visibility)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(document.category)}>
                            {document.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {document.employeeName || 'All Employees'}
                        </TableCell>
                        <TableCell>
                          {format(document.uploadDate, 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(document.status)}>
                            {document.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {expiryStatus ? (
                            <Badge 
                              variant="outline" 
                              className={
                                expiryStatus.status === 'expired' ? 'bg-red-100 text-red-800' :
                                expiryStatus.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }
                            >
                              {expiryStatus.text}
                            </Badge>
                          ) : (
                            <span className="text-gray-500">No expiry</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {document.status === 'pending-signature' && 
                             (document.employeeId === 'EMP001' || !document.employeeId) && (
                              <Button
                                size="sm"
                                onClick={() => signDocument(document.id)}
                              >
                                Sign
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signatures">
          <Card>
            <CardHeader>
              <CardTitle>Documents Requiring Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingSignatures.map((document) => (
                  <Card key={document.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{document.name}</h4>
                          <p className="text-sm text-gray-600">{document.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Uploaded {format(document.uploadDate, 'MMM dd, yyyy')}</span>
                            <span>by {document.uploadedBy}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(document.category)}>
                            {document.category}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => signDocument(document.id)}
                          >
                            Sign Document
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {pendingSignatures.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No documents pending signature
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle>Documents Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expiringDocuments.map((document) => {
                  const expiryStatus = getExpiryStatus(document.expiryDate);
                  
                  return (
                    <Card key={document.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{document.name}</h4>
                            <p className="text-sm text-gray-600">{document.description}</p>
                            {document.employeeName && (
                              <p className="text-sm text-gray-500">Employee: {document.employeeName}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge className={getCategoryColor(document.category)}>
                              {document.category}
                            </Badge>
                            {expiryStatus && (
                              <div className="mt-2">
                                <Badge 
                                  variant="outline" 
                                  className="bg-yellow-100 text-yellow-800"
                                >
                                  {expiryStatus.text}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {expiringDocuments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No documents expiring in the next 30 days
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>My Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documents.filter(doc => doc.employeeId === 'EMP001').map((document) => (
                  <Card key={document.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{document.name}</h4>
                          <p className="text-sm text-gray-600">{document.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Uploaded {format(document.uploadDate, 'MMM dd, yyyy')}</span>
                            <span>{document.fileSize}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getCategoryColor(document.category)}>
                            {document.category}
                          </Badge>
                          <Badge className={getStatusColor(document.status)}>
                            {document.status.replace('-', ' ')}
                          </Badge>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4" />
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
      </Tabs>
    </div>
  );
}