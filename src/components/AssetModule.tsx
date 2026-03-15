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
import { Plus, Laptop, Monitor, Smartphone, Headphones, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { format } from 'date-fns';

interface Asset {
  id: string;
  assetId: string;
  name: string;
  type: 'laptop' | 'monitor' | 'keyboard' | 'mouse' | 'headphones' | 'phone' | 'tablet' | 'other';
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: Date;
  warrantyExpiry?: Date;
  cost: number;
  assignedTo?: string;
  assignedDate?: Date;
  status: 'available' | 'assigned' | 'damaged' | 'lost' | 'retired';
  location: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string;
}

interface AssetAssignment {
  id: string;
  assetId: string;
  assetName: string;
  employeeId: string;
  employeeName: string;
  assignedDate: Date;
  returnedDate?: Date;
  status: 'active' | 'returned' | 'damaged-return';
  returnCondition?: string;
  notes: string;
}

const mockAssets: Asset[] = [
  {
    id: 'AST001',
    assetId: 'BT-LP-001',
    name: 'MacBook Pro 14"',
    type: 'laptop',
    brand: 'Apple',
    model: 'MacBook Pro 14" M2',
    serialNumber: 'C02YX1GJMD6R',
    purchaseDate: new Date('2024-01-15'),
    warrantyExpiry: new Date('2027-01-15'),
    cost: 2499,
    assignedTo: 'Sarah Johnson',
    assignedDate: new Date('2024-01-16'),
    status: 'assigned',
    location: 'San Francisco Office',
    condition: 'excellent',
    notes: 'Primary development machine'
  },
  {
    id: 'AST002',
    assetId: 'BT-MN-001',
    name: 'Dell UltraSharp 27"',
    type: 'monitor',
    brand: 'Dell',
    model: 'U2720Q',
    serialNumber: 'CN-0P2KLV-74261',
    purchaseDate: new Date('2023-08-10'),
    warrantyExpiry: new Date('2026-08-10'),
    cost: 649,
    assignedTo: 'Sarah Johnson',
    assignedDate: new Date('2023-08-11'),
    status: 'assigned',
    location: 'San Francisco Office',
    condition: 'good',
    notes: 'Secondary monitor for development'
  },
  {
    id: 'AST003',
    assetId: 'BT-LP-002',
    name: 'MacBook Air 13"',
    type: 'laptop',
    brand: 'Apple',
    model: 'MacBook Air 13" M2',
    serialNumber: 'C02ZX1HJMD6T',
    purchaseDate: new Date('2023-06-01'),
    warrantyExpiry: new Date('2026-06-01'),
    cost: 1199,
    assignedTo: 'Mike Chen',
    assignedDate: new Date('2023-06-02'),
    status: 'assigned',
    location: 'Austin Office',
    condition: 'good',
    notes: 'Standard development laptop'
  },
  {
    id: 'AST004',
    assetId: 'BT-PH-001',
    name: 'iPhone 14 Pro',
    type: 'phone',
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    serialNumber: 'G6VRC5M2Q4',
    purchaseDate: new Date('2024-03-15'),
    warrantyExpiry: new Date('2025-03-15'),
    cost: 999,
    status: 'available',
    location: 'IT Storage',
    condition: 'excellent',
    notes: 'Available for assignment'
  },
  {
    id: 'AST005',
    assetId: 'BT-LP-003',
    name: 'ThinkPad X1 Carbon',
    type: 'laptop',
    brand: 'Lenovo',
    model: 'ThinkPad X1 Carbon Gen 10',
    serialNumber: 'PC-123456',
    purchaseDate: new Date('2022-12-01'),
    cost: 1899,
    status: 'damaged',
    location: 'IT Repair',
    condition: 'poor',
    notes: 'Screen damage, needs repair or replacement'
  }
];

const mockAssignments: AssetAssignment[] = [
  {
    id: 'ASGN001',
    assetId: 'BT-LP-001',
    assetName: 'MacBook Pro 14"',
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    assignedDate: new Date('2024-01-16'),
    status: 'active',
    notes: 'Primary development machine assignment'
  },
  {
    id: 'ASGN002',
    assetId: 'BT-MN-001',
    assetName: 'Dell UltraSharp 27"',
    employeeId: 'EMP001',
    employeeName: 'Sarah Johnson',
    assignedDate: new Date('2023-08-11'),
    status: 'active',
    notes: 'Secondary monitor setup'
  },
  {
    id: 'ASGN003',
    assetId: 'BT-LP-002',
    assetName: 'MacBook Air 13"',
    employeeId: 'EMP002',
    employeeName: 'Mike Chen',
    assignedDate: new Date('2023-06-02'),
    status: 'active',
    notes: 'Standard development setup'
  }
];

export function AssetModule({ userRole }: { userRole: string }) {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [assignments, setAssignments] = useState<AssetAssignment[]>(mockAssignments);
  const [showNewAssetDialog, setShowNewAssetDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const [newAsset, setNewAsset] = useState({
    name: '',
    type: '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    cost: '',
    location: '',
    condition: 'excellent',
    notes: ''
  });
  const [otherType, setOtherType] = useState('');

  const [assignmentForm, setAssignmentForm] = useState({
    assetId: '',
    employeeId: '',
    notes: ''
  });

  const handleAddAsset = () => {
    if (!newAsset.name || !newAsset.type || !newAsset.serialNumber) return;

    const asset: Asset = {
      id: `AST${String(assets.length + 1).padStart(3, '0')}`,
      assetId: `BT-${newAsset.type.substring(0, 2).toUpperCase()}-${String(assets.length + 1).padStart(3, '0')}`,
      name: newAsset.name,
      type: newAsset.type as any,
      brand: newAsset.brand,
      model: newAsset.model,
      serialNumber: newAsset.serialNumber,
      purchaseDate: new Date(newAsset.purchaseDate),
      warrantyExpiry: newAsset.warrantyExpiry ? new Date(newAsset.warrantyExpiry) : undefined,
      cost: parseFloat(newAsset.cost) || 0,
      status: 'available',
      location: newAsset.location,
      condition: newAsset.condition as any,
      notes: newAsset.notes
    };

    setAssets(prev => [asset, ...prev]);
    setShowNewAssetDialog(false);
    setNewAsset({
      name: '',
      type: '',
      brand: '',
      model: '',
      serialNumber: '',
      purchaseDate: '',
      warrantyExpiry: '',
      cost: '',
      location: '',
      condition: 'excellent',
      notes: ''
    });
  };

  const handleAssignAsset = () => {
    if (!assignmentForm.assetId || !assignmentForm.employeeId) return;

    const asset = assets.find(a => a.id === assignmentForm.assetId);
    if (!asset) return;

    // Update asset status
    setAssets(prev => prev.map(a => 
      a.id === assignmentForm.assetId 
        ? { 
            ...a, 
            status: 'assigned', 
            assignedTo: 'Selected Employee',
            assignedDate: new Date()
          }
        : a
    ));

    // Create assignment record
    const assignment: AssetAssignment = {
      id: `ASGN${String(assignments.length + 1).padStart(3, '0')}`,
      assetId: asset.assetId,
      assetName: asset.name,
      employeeId: assignmentForm.employeeId,
      employeeName: 'Selected Employee',
      assignedDate: new Date(),
      status: 'active',
      notes: assignmentForm.notes
    };

    setAssignments(prev => [assignment, ...prev]);
    setShowAssignDialog(false);
    setAssignmentForm({
      assetId: '',
      employeeId: '',
      notes: ''
    });
  };

  const returnAsset = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Update assignment
    setAssignments(prev => prev.map(a => 
      a.id === assignmentId 
        ? { 
            ...a, 
            status: 'returned',
            returnedDate: new Date(),
            returnCondition: 'good'
          }
        : a
    ));

    // Update asset
    setAssets(prev => prev.map(a => 
      a.assetId === assignment.assetId 
        ? { 
            ...a, 
            status: 'available',
            assignedTo: undefined,
            assignedDate: undefined
          }
        : a
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'damaged': return 'bg-red-100 text-red-800';
      case 'lost': return 'bg-gray-100 text-gray-800';
      case 'retired': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'laptop': return <Laptop className="w-5 h-5" />;
      case 'monitor': return <Monitor className="w-5 h-5" />;
      case 'phone': return <Smartphone className="w-5 h-5" />;
      case 'headphones': return <Headphones className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const totalAssetValue = assets.reduce((sum, asset) => sum + asset.cost, 0);
  const assignedAssets = assets.filter(asset => asset.status === 'assigned');
  const availableAssets = assets.filter(asset => asset.status === 'available');
  const damagedAssets = assets.filter(asset => asset.status === 'damaged' || asset.status === 'lost');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asset Management</h2>
          <p className="text-gray-600">Track and manage company equipment and devices</p>
        </div>
        <div className="flex space-x-2">
          {(userRole === 'hr' || userRole === 'manager') && (
            <>
              <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    Assign Asset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Asset to Employee</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Available Asset</Label>
                      <Select value={assignmentForm.assetId} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, assetId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset" />
                        </SelectTrigger>
                        <SelectContent>
                          {assets.filter(asset => asset.status === 'available').map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name} ({asset.assetId})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Employee</Label>
                      <Select value={assignmentForm.employeeId} onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, employeeId: value }))}>
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
                      <Label>Assignment Notes</Label>
                      <Input
                        value={assignmentForm.notes}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Optional notes about the assignment"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAssignAsset}>
                        Assign Asset
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showNewAssetDialog} onOpenChange={setShowNewAssetDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Asset Name</Label>
                      <Input
                        value={newAsset.name}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., MacBook Pro 14'"
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={['laptop','monitor','keyboard','mouse','headphones','phone','tablet','other'].includes(newAsset.type) ? newAsset.type : (newAsset.type ? 'other' : '')} onValueChange={(value) => {
                        if (value === 'other') {
                          setNewAsset(prev => ({ ...prev, type: otherType || 'other' }));
                        } else {
                          setNewAsset(prev => ({ ...prev, type: value }));
                          setOtherType('');
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="laptop">Laptop</SelectItem>
                          <SelectItem value="monitor">Monitor</SelectItem>
                          <SelectItem value="keyboard">Keyboard</SelectItem>
                          <SelectItem value="mouse">Mouse</SelectItem>
                          <SelectItem value="headphones">Headphones</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="tablet">Tablet</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {(newAsset.type === 'other' || (newAsset.type && !['laptop','monitor','keyboard','mouse','headphones','phone','tablet'].includes(newAsset.type))) && (
                        <Input
                          className="mt-2"
                          placeholder="Specify asset type..."
                          value={otherType || (newAsset.type !== 'other' ? newAsset.type : '')}
                          onChange={e => {
                            setOtherType(e.target.value);
                            setNewAsset(prev => ({ ...prev, type: e.target.value || 'other' }));
                          }}
                          autoFocus
                        />
                      )}
                    </div>
                    <div>
                      <Label>Brand</Label>
                      <Input
                        value={newAsset.brand}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, brand: e.target.value }))}
                        placeholder="e.g., Apple, Dell, Lenovo"
                      />
                    </div>
                    <div>
                      <Label>Model</Label>
                      <Input
                        value={newAsset.model}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="Specific model number"
                      />
                    </div>
                    <div>
                      <Label>Serial Number</Label>
                      <Input
                        value={newAsset.serialNumber}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, serialNumber: e.target.value }))}
                        placeholder="Unique serial number"
                      />
                    </div>
                    <div>
                      <Label>Purchase Date</Label>
                      <Input
                        type="date"
                        value={newAsset.purchaseDate}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, purchaseDate: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Warranty Expiry</Label>
                      <Input
                        type="date"
                        value={newAsset.warrantyExpiry}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, warrantyExpiry: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Cost ($)</Label>
                      <Input
                        type="number"
                        value={newAsset.cost}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, cost: e.target.value }))}
                        placeholder="Purchase price"
                      />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input
                        value={newAsset.location}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., San Francisco Office"
                      />
                    </div>
                    <div>
                      <Label>Condition</Label>
                      <Select value={newAsset.condition} onValueChange={(value) => setNewAsset(prev => ({ ...prev, condition: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Notes</Label>
                      <Input
                        value={newAsset.notes}
                        onChange={(e) => setNewAsset(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Additional notes about the asset"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setShowNewAssetDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddAsset}>
                      Add Asset
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              ${totalAssetValue.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedAssets.length}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableAssets.length}</div>
            <p className="text-xs text-muted-foreground">Ready to assign</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{damagedAssets.length}</div>
            <p className="text-xs text-muted-foreground">Damaged/Lost</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">All Assets</TabsTrigger>
          <TabsTrigger value="assignments">Active Assignments</TabsTrigger>
          <TabsTrigger value="returns">Return Process</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          <Card>
            <CardHeader>
              <CardTitle>Asset Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getAssetIcon(asset.type)}
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-gray-600">{asset.brand} {asset.model}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {asset.assetId}
                        </code>
                      </TableCell>
                      <TableCell>{asset.serialNumber}</TableCell>
                      <TableCell>
                        {asset.assignedTo || <span className="text-gray-500">Unassigned</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(asset.status)}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getConditionColor(asset.condition)}>
                          {asset.condition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          {userRole === 'hr' && (
                            <Button size="sm" variant="outline">
                              Edit
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

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Active Asset Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.filter(assignment => assignment.status === 'active').map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>{assignment.employeeName}</TableCell>
                      <TableCell>{assignment.assetName}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {assignment.assetId}
                        </code>
                      </TableCell>
                      <TableCell>{format(assignment.assignedDate, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          {(userRole === 'hr' || userRole === 'manager') && (
                            <Button
                              size="sm"
                              onClick={() => returnAsset(assignment.id)}
                            >
                              Return
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

        <TabsContent value="returns">
          <Card>
            <CardHeader>
              <CardTitle>Asset Return Process</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Return Checklist</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Backup any personal data</li>
                    <li>• Clean the device physically</li>
                    <li>• Include all accessories (charger, cables, etc.)</li>
                    <li>• Report any damage or issues</li>
                    <li>• Get return confirmation from IT/HR</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Recent Returns</h4>
                  <div className="space-y-3">
                    {assignments.filter(assignment => assignment.status === 'returned').map((assignment) => (
                      <Card key={assignment.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{assignment.assetName}</p>
                              <p className="text-sm text-gray-600">
                                Returned by {assignment.employeeName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {assignment.returnedDate && format(assignment.returnedDate, 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <Badge className={getStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Asset Maintenance & Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-4">Assets Requiring Attention</h4>
                  <div className="space-y-3">
                    {assets.filter(asset => asset.status === 'damaged' || asset.condition === 'poor').map((asset) => (
                      <Card key={asset.id} className="border-l-4 border-l-red-500">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{asset.name}</p>
                              <p className="text-sm text-gray-600">{asset.assetId}</p>
                              <p className="text-sm text-gray-700 mt-1">{asset.notes}</p>
                            </div>
                            <div className="flex space-x-2">
                              <Badge className={getStatusColor(asset.status)}>
                                {asset.status}
                              </Badge>
                              <Badge className={getConditionColor(asset.condition)}>
                                {asset.condition}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-4">Warranty Expiration</h4>
                  <div className="space-y-3">
                    {assets
                      .filter(asset => asset.warrantyExpiry && asset.warrantyExpiry > new Date())
                      .sort((a, b) => (a.warrantyExpiry?.getTime() || 0) - (b.warrantyExpiry?.getTime() || 0))
                      .slice(0, 5)
                      .map((asset) => (
                        <div key={asset.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-gray-600">{asset.assetId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              Expires {asset.warrantyExpiry && format(asset.warrantyExpiry, 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      ))}
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