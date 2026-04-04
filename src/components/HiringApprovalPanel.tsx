import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import {
  Loader2, RefreshCw, Search, CheckCircle, XCircle, Eye, UserCheck,
  Clock, FileText, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { useBranding } from '../lib/branding-context';
import { ListControls, exportToCSV, exportToPDF } from './ListControls';

export function HiringApprovalPanel() {
  const { accessToken } = useAuth();
  const { branding } = useBranding();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({
    status: 'all',
  });
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/job-applications', { token: accessToken });
      setApplications(Array.isArray(data) ? data : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: string) => {
    setProcessing(true);
    try {
      await api(`/job-applications/${id}`, {
        method: 'PUT',
        body: { status },
        token: accessToken,
      });
      toast.success(
        status === 'hired' ? 'Applicant hired! Profile updated & team notified.' :
        status === 'rejected' ? 'Application rejected. Applicant notified.' :
        `Status updated to ${status}`
      );
      load();
      setDetailOpen(false);
    } catch (e: any) { toast.error(e.message); }
    setProcessing(false);
  };

  const filtered = applications
    .filter(a => {
      if (filterValues.status !== 'all' && a.status !== filterValues.status) return false;
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (a.applicantName || '').toLowerCase().includes(s) ||
        (a.jobTitle || '').toLowerCase().includes(s) ||
        (a.applicantEmail || '').toLowerCase().includes(s);
    })
    .sort((a, b) => {
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : (aVal > bVal ? 1 : -1);
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const toggleSort = (col: string) => {
    if (sortField === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortField !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      reviewing: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      hired: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      'pending-approval': 'bg-orange-100 text-orange-800',
    };
    return <Badge className={map[status] || 'bg-gray-100 text-gray-800'}>{status === 'pending-approval' ? 'Awaiting SuperAdmin' : status}</Badge>;
  };

  const counts = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    reviewing: applications.filter(a => a.status === 'reviewing').length,
    hired: applications.filter(a => a.status === 'hired').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Total', count: counts.total, color: 'bg-gray-100 text-gray-800' },
          { label: 'Pending', count: counts.pending, color: 'bg-amber-100 text-amber-800' },
          { label: 'Reviewing', count: counts.reviewing, color: 'bg-blue-100 text-blue-800' },
          { label: 'Hired', count: counts.hired, color: 'bg-green-100 text-green-800' },
          { label: 'Rejected', count: counts.rejected, color: 'bg-red-100 text-red-800' },
        ].map(s => (
          <Card key={s.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterValues({ ...filterValues, status: s.label === 'Total' ? 'all' : s.label.toLowerCase() })}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{s.count}</p>
              <Badge className={`${s.color} mt-1`}>{s.label}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              <div>
                <CardTitle className="text-base">Job Applications & Hiring Approval</CardTitle>
                <p className="text-sm text-gray-500 mt-0.5">Review, approve or reject job applications. Hired applicants' profiles auto-update.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search by name, email, or job title..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterValues.status} onValueChange={v => setFilterValues({ ...filterValues, status: v })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No applications found</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('applicantName')}>
                      <div className="flex items-center">Applicant<SortIcon col="applicantName" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('jobTitle')}>
                      <div className="flex items-center">Position<SortIcon col="jobTitle" /></div>
                    </TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                      <div className="flex items-center">Applied<SortIcon col="createdAt" /></div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                      <div className="flex items-center">Status<SortIcon col="status" /></div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(app => (
                    <TableRow key={app.id} className="hover:bg-blue-50/40">
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{app.applicantName}</p>
                          <p className="text-[11px] text-gray-400">{app.applicantEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{app.jobTitle}</TableCell>
                      <TableCell className="text-sm text-gray-600">{app.jobDepartment || app.jobCompany || '\u2014'}</TableCell>
                      <TableCell className="text-sm text-green-600">{app.jobSalaryRange || '\u2014'}</TableCell>
                      <TableCell className="text-xs text-gray-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '\u2014'}</TableCell>
                      <TableCell>{statusBadge(app.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setSelected(app); setDetailOpen(true); }}>
                            <Eye className="w-3 h-3 mr-1" />View
                          </Button>
                          {app.status === 'pending' && (
                            <>
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, 'hired')} disabled={processing}>
                                <CheckCircle className="w-3 h-3 mr-1" />Hire
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateStatus(app.id, 'rejected')} disabled={processing}>
                                <XCircle className="w-3 h-3 mr-1" />Reject
                              </Button>
                            </>
                          )}
                          {app.status === 'reviewing' && (
                            <>
                              <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, 'hired')} disabled={processing}>
                                <CheckCircle className="w-3 h-3 mr-1" />Hire
                              </Button>
                              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => updateStatus(app.id, 'rejected')} disabled={processing}>
                                <XCircle className="w-3 h-3 mr-1" />Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{selected.applicantName}</h3>
                  {statusBadge(selected.status)}
                </div>
                <p className="text-sm text-gray-500">{selected.applicantEmail}</p>
                <p className="text-xs text-gray-400">Current: {selected.applicantCurrentPosition || selected.applicantCurrentRole || 'N/A'} &middot; {selected.applicantDepartment || 'N/A'}</p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Applied For</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Position', value: selected.jobTitle },
                    { label: 'Department', value: selected.jobDepartment },
                    { label: 'Company', value: selected.jobCompany },
                    { label: 'Salary Range', value: selected.jobSalaryRange },
                    { label: 'Type', value: selected.jobType },
                    { label: 'Applied', value: selected.createdAt ? new Date(selected.createdAt).toLocaleString() : 'N/A' },
                  ].map((f, i) => (
                    <div key={i} className="bg-gray-50 rounded p-2">
                      <p className="text-[10px] text-gray-400">{f.label}</p>
                      <p className="text-sm">{f.value || '\u2014'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selected.coverLetter && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Cover Letter</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded p-3 whitespace-pre-wrap">{selected.coverLetter}</p>
                  </div>
                </>
              )}

              {selected.status === 'hired' && (
                <div className="bg-green-50 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-700">This applicant has been hired. Their profile has been updated with the new role, department, and salary.</p>
                </div>
              )}

              {selected.status === 'rejected' && (
                <div className="bg-red-50 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">This application has been rejected. The applicant has been notified.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            {selected && !['hired', 'rejected'].includes(selected.status) && (
              <>
                <Button variant="outline" onClick={() => updateStatus(selected.id, 'reviewing')} disabled={processing || selected.status === 'reviewing'}>
                  <Clock className="w-4 h-4 mr-1" />Mark Reviewing
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(selected.id, 'hired')} disabled={processing}>
                  {processing && <Loader2 className="w-4 h-4 animate-spin mr-1" />}<CheckCircle className="w-4 h-4 mr-1" />Approve & Hire
                </Button>
                <Button variant="destructive" onClick={() => updateStatus(selected.id, 'rejected')} disabled={processing}>
                  <XCircle className="w-4 h-4 mr-1" />Reject
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}