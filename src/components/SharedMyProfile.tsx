import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { api, apiUpload } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import {
  User, Pencil, RefreshCw, Loader2, FileText, Download, Eye, CalendarDays,
  DollarSign, Phone, Mail, MapPin, Building2, Briefcase, Shield,
  Camera, Upload, Trash2, Image, File, AlertCircle, Printer, ArrowUpDown, ArrowUp, ArrowDown, Clock, Star
} from 'lucide-react';
import { useBranding } from '../lib/branding-context';
import { useCurrency } from '../lib/currency-context';

function exportToPDFDoc(title: string, content: string, companyName = 'Blumebyte') {
  const w = window.open('', '_blank');
  if (!w) { toast.error('Popup blocked'); return; }
  w.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;margin:40px;color:#333;} h1{font-size:20px;margin-bottom:4px;} .sub{font-size:12px;color:#888;margin-bottom:20px;} .section{margin:20px 0;padding:16px;border:1px solid #eee;border-radius:8px;} .section h3{font-size:14px;font-weight:600;margin-bottom:12px;color:#1e40af;} .row{display:flex;gap:24px;margin-bottom:8px;} .field{flex:1;} .field label{font-size:11px;color:#888;display:block;} .field p{font-size:13px;margin:2px 0 0;} .footer{margin-top:30px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:12px;}
  </style></head><body>${content}<div class="footer">Generated from ${companyName} HRIS on ${new Date().toLocaleString()}</div><script>window.onload=function(){window.print();}</script></body></html>`);
  w.document.close();
}

export function SharedMyProfile() {
  const { user, accessToken, refreshProfile } = useAuth();
  const { branding } = useBranding();
  const { currencySymbol } = useCurrency();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'payslips' | 'leave-history' | 'documents'>('profile');
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [payslipSort, setPayslipSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'period', dir: 'desc' });
  const [leaveSort, setLeaveSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'startDate', dir: 'desc' });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [myFiles, setMyFiles] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const profileImageRef = useRef<HTMLInputElement>(null);
  const docUploadRef = useRef<HTMLInputElement>(null);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const MAX_PROFILE_IMAGE_KB = 150;
  const MAX_FILE_MB = 1;
  const MAX_FILES = 5;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await api('/profile', { token: accessToken });
      setProfile(p);
      const [pay, lv, files] = await Promise.all([
        api('/my-payslips', { token: accessToken }).catch(() => []),
        api('/leave-requests', { token: accessToken }).catch(() => []),
        api('/files', { token: accessToken }).catch(() => []),
      ]);
      setPayslips(Array.isArray(pay) ? pay : []);
      setLeaves(Array.isArray(lv) ? lv.filter((l: any) => l.userId === p.id) : []);
      setMyFiles(Array.isArray(files) ? files : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, []);
  // Increase refresh interval to 60 seconds to reduce unnecessary reloads
  useEffect(() => { const iv = setInterval(load, 60000); return () => clearInterval(iv); }, [load]);

  const handleEditSave = async () => {
    setSaving(true);
    try {
      const result = await api('/employee/profile', { method: 'PUT', body: editData, token: accessToken });
      if (result.pendingApproval) {
        toast.success('Profile changes submitted for HR approval');
      } else {
        toast.success('Profile updated');
      }
      setEditOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const isPrivilegedRole = profile?.role && ['superadmin', 'admin', 'manager'].includes(profile.role);

  const openEditDialog = () => {
    const data: any = {
      phone: profile?.phone || '',
      personalEmail: profile?.personalEmail || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      dateOfBirth: profile?.dateOfBirth || '',
      gender: profile?.gender || '',
      maritalStatus: profile?.maritalStatus || '',
      nationality: profile?.nationality || '',
      emergencyContact: profile?.emergencyContact || '',
      emergencyPhone: profile?.emergencyPhone || '',
    };
    // Admin/SuperAdmin/Manager can also edit their own employment details
    if (isPrivilegedRole) {
      data.name = profile?.name || '';
      data.position = profile?.position || '';
      data.department = profile?.department || '';
      data.company = profile?.company || '';
      data.salary = profile?.salary || '';
    }
    setEditData(data);
    setEditOpen(true);
  };

  const generateDocument = (docType: string) => {
    if (!profile) return;
    const roleLabel = profile.role === 'superadmin' ? 'Super Administrator' : profile.role === 'admin' ? 'Administrator' : profile.role === 'manager' ? 'Manager' : 'Employee';
    const currentYear = new Date().getFullYear();
    const joinDate = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—';

    let extraContent = '';
    if (docType === 'Tax Forms') {
      extraContent = `<div class="section"><h3>Tax Information — ${currentYear}</h3>
        <div class="row"><div class="field"><label>Tax Year</label><p>${currentYear}</p></div><div class="field"><label>Taxable Income</label><p>${profile.salary || '—'}</p></div><div class="field"><label>Company</label><p>${profile.company || '—'}</p></div></div>
        <div class="row"><div class="field"><label>Employee ID</label><p>${profile.userId?.slice(0,8).toUpperCase() || 'N/A'}</p></div><div class="field"><label>Department</label><p>${profile.department || '—'}</p></div></div>
      </div>`;
    } else if (docType === 'Benefits Enrollment') {
      extraContent = `<div class="section"><h3>Benefits Information</h3>
        <div class="row"><div class="field"><label>Enrollment Date</label><p>${joinDate}</p></div><div class="field"><label>Status</label><p>Active</p></div></div>
      </div>`;
    } else if (docType.includes('Performance Review')) {
      extraContent = `<div class="section"><h3>Review Details</h3>
        <div class="row"><div class="field"><label>Review Period</label><p>${docType.replace('Performance Review ', '')}</p></div><div class="field"><label>Employee</label><p>${profile.name}</p></div></div>
      </div>`;
    }

    const content = `<h1>${branding.companyName} HR - ${docType}</h1><p class="sub">Employee: ${profile.name} | ID: ${profile.userId?.slice(0,8).toUpperCase() || 'N/A'}</p>
      <div class="section"><h3>Employee Details</h3>
        <div class="row"><div class="field"><label>Full Name</label><p>${profile.name}</p></div><div class="field"><label>Role</label><p>${roleLabel}</p></div><div class="field"><label>Position</label><p>${profile.position || '—'}</p></div></div>
        <div class="row"><div class="field"><label>Department</label><p>${profile.department || '—'}</p></div><div class="field"><label>Company</label><p>${profile.company || '—'}</p></div><div class="field"><label>Email</label><p>${profile.email}</p></div></div>
        <div class="row"><div class="field"><label>Salary</label><p>${profile.salary || '—'}</p></div><div class="field"><label>Status</label><p>${profile.status || 'active'}</p></div><div class="field"><label>Join Date</label><p>${joinDate}</p></div></div>
      </div>${extraContent}`;
    exportToPDFDoc(docType, content, branding.companyName);
  };

  // Profile image upload handler
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('Only image files (JPG, PNG, GIF, WEBP) are allowed');
      return;
    }
    // Read file and open crop dialog
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropPosition({ x: 0, y: 0 });
      setCropZoom(1);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
    if (profileImageRef.current) profileImageRef.current.value = '';
  };

  // Perform the crop and upload
  const handleCropAndUpload = async () => {
    if (!cropImageSrc) return;
    setUploadingImage(true);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = cropImageSrc;
      });

      const CROP_SIZE = 200;
      const canvas = document.createElement('canvas');
      canvas.width = CROP_SIZE;
      canvas.height = CROP_SIZE;
      const ctx = canvas.getContext('2d')!;

      // Calculate source dimensions — match CSS positioning logic
      // CSS: image width/height = 100% * cropZoom of container, positioned at (50 + cropPosition.x)%, (50 + cropPosition.y)% with translate(-50%, -50%)
      // Container is 224px (w-56), image is displayed at 224 * cropZoom px
      const containerSize = 224; // matches w-56 = 14rem = 224px
      const imgDisplaySize = containerSize * cropZoom;
      // Image center in container coordinates:
      const imgCenterX = (containerSize * (50 + cropPosition.x)) / 100;
      const imgCenterY = (containerSize * (50 + cropPosition.y)) / 100;
      // Visible window in image display coordinates:
      // Container shows from (0,0) to (containerSize, containerSize)
      // Image goes from (imgCenterX - imgDisplaySize/2) to (imgCenterX + imgDisplaySize/2)
      const visibleLeft = -imgCenterX + imgDisplaySize / 2;
      const visibleTop = -imgCenterY + imgDisplaySize / 2;
      // Convert to source image coordinates
      const scaleX = img.width / imgDisplaySize;
      const scaleY = img.height / imgDisplaySize;
      const srcX = visibleLeft * scaleX;
      const srcY = visibleTop * scaleY;
      const srcW = containerSize * scaleX;
      const srcH = containerSize * scaleY;

      // Draw circular clip
      ctx.beginPath();
      ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, CROP_SIZE, CROP_SIZE);

      // Try progressively lower quality to stay under the size limit
      let blob: Blob | null = null;
      for (let quality = 0.8; quality >= 0.1; quality -= 0.1) {
        blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= MAX_PROFILE_IMAGE_KB * 1024) break;
      }
      if (!blob) {
        toast.error('Could not compress image enough. Try a smaller image.');
        setUploadingImage(false);
        return;
      }
      if (blob.size > MAX_PROFILE_IMAGE_KB * 1024) {
        toast.error(`Cropped image is ${Math.round(blob.size / 1024)}KB. Max is ${MAX_PROFILE_IMAGE_KB}KB. Try zooming out or using a smaller image.`);
        setUploadingImage(false);
        return;
      }

      const fd = new FormData();
      fd.append('file', blob, 'profile.jpg');
      console.log(`Uploading cropped profile image: size=${blob.size}, type=${blob.type}`);
      const result = await apiUpload('/upload/profile-image', fd, accessToken);
      console.log('Profile image upload result:', result);
      toast.success('Profile image updated');
      setCropDialogOpen(false);
      setCropImageSrc(null);
      setTimeout(() => { load(); refreshProfile(); }, 500);
    } catch (err: any) {
      console.error('Profile image upload error:', err);
      toast.error(err.message || 'Profile image upload failed');
    }
    setUploadingImage(false);
  };

  // Crop drag handlers — position is in percentage units for the CSS
  const handleCropMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    dragStart.current = {
      x: e.clientX - (cropPosition.x / 100) * containerSize,
      y: e.clientY - (cropPosition.y / 100) * containerSize
    };
  };
  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    setCropPosition({
      x: ((e.clientX - dragStart.current.x) / containerSize) * 100,
      y: ((e.clientY - dragStart.current.y) / containerSize) * 100,
    });
  };
  const handleCropMouseUp = () => { isDragging.current = false; };
  const handleCropTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    const t = e.touches[0];
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    dragStart.current = {
      x: t.clientX - (cropPosition.x / 100) * containerSize,
      y: t.clientY - (cropPosition.y / 100) * containerSize
    };
  };
  const handleCropTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const t = e.touches[0];
    const rect = cropContainerRef.current?.getBoundingClientRect();
    const containerSize = rect?.width || 224;
    setCropPosition({
      x: ((t.clientX - dragStart.current.x) / containerSize) * 100,
      y: ((t.clientY - dragStart.current.y) / containerSize) * 100,
    });
  };
  const handleCropTouchEnd = () => { isDragging.current = false; };

  // Document upload handler
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File must be less than ${MAX_FILE_MB}MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    const docFiles = myFiles.filter(f => f.type !== 'profile-image');
    if (docFiles.length >= MAX_FILES) {
      toast.error(`Upload limit reached (${MAX_FILES} files). Delete some files before uploading more.`);
      return;
    }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', 'general');
      await apiUpload('/upload/document', fd, accessToken);
      toast.success('Document uploaded');
      load();
    } catch (err: any) { toast.error(err.message); }
    setUploadingDoc(false);
    if (docUploadRef.current) docUploadRef.current.value = '';
  };

  // Delete file handler
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Delete this file? This action cannot be undone.')) return;
    try {
      await api(`/files/${user?.id}/${fileId}`, { method: 'DELETE', token: accessToken });
      toast.success('File deleted');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  // Remove profile image
  const handleRemoveProfileImage = async () => {
    if (!confirm('Remove your profile image?')) return;
    try {
      await api(`/files/${user?.id}/profile-image`, { method: 'DELETE', token: accessToken });
      toast.success('Profile image removed');
      load();
      refreshProfile();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;

  const tabs = [
    { id: 'profile', label: 'Full Profile' },
    { id: 'payslips', label: 'My Payslips' },
    { id: 'leave-history', label: `Leave History`, count: leaves.length },
    { id: 'documents', label: 'Documents & Reports' },
  ];

  const roleLabel = profile?.role === 'superadmin' ? 'Super Admin' : profile?.role === 'admin' ? 'Admin' : profile?.role === 'manager' ? 'Manager' : 'Employee';
  const rolePosition = profile?.role === 'superadmin' ? 'Super Administrator' : profile?.role === 'admin' ? 'Administrator' : profile?.role === 'manager' ? 'Manager' : 'Employee';

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
        <div>
          <h1 className="text-xl font-bold">My Profile</h1>
          <p className="text-sm text-gray-500">View your employment details, payslips, documents & reports</p>
        </div>
      </div>

      <div className="flex gap-1 mt-4 border-b">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label} {t.count !== undefined && t.count > 0 && <Badge className="ml-1 bg-blue-100 text-blue-700 text-[10px]">{t.count}</Badge>}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div><CardTitle className="text-base">My Full Profile</CardTitle><p className="text-sm text-muted-foreground mt-0.5">All HR-entered details about your employment</p></div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={openEditDialog}><Pencil className="w-4 h-4 mr-1" />{isPrivilegedRole ? 'Edit Profile' : 'Edit Contact Info'}</Button>
                  <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" />Refresh</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Profile Header */}
              <div className="bg-accent rounded-xl p-5 mb-6 flex items-center gap-4">
                <div className="relative group">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-card shadow-sm" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">{profile?.name?.[0] || 'U'}</div>
                  )}
                  <button
                    onClick={() => profileImageRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {uploadingImage ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                  </button>
                  <input ref={profileImageRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleProfileImageUpload} />
                  {profile?.profileImageUrl && (
                    <button onClick={handleRemoveProfileImage} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600" title="Remove photo">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold">{profile?.name}</h2>
                  <p className="text-sm text-gray-600">{rolePosition} {profile?.department ? `\u00b7 ${profile.department}` : ''}</p>
                  <div className="flex gap-2 mt-1.5">
                    <Badge className="bg-green-100 text-green-700">{profile?.status || 'active'}</Badge>
                    <Badge variant="outline">ID: {profile?.userId?.slice(0, 13).toUpperCase() || 'N/A'}</Badge>
                    <Badge className="bg-blue-100 text-blue-700">{roleLabel}</Badge>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Hover avatar to change photo (max {MAX_PROFILE_IMAGE_KB}KB)</p>
                </div>
              </div>

              {/* Personal Information */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><User className="w-4 h-4 text-blue-500" /><h3 className="font-semibold text-sm">Personal Information</h3></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Full Name', value: profile?.name },
                    { label: 'Work Email', value: profile?.email },
                    { label: 'Date of Birth', value: profile?.dateOfBirth },
                    { label: 'Gender', value: profile?.gender },
                    { label: 'Marital Status', value: profile?.maritalStatus },
                    { label: 'Nationality', value: profile?.nationality },
                  ].map((f, i) => (
                    <div key={i} className="bg-accent rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium mt-0.5">{f.value || '\u2014'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact & Address */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Phone className="w-4 h-4 text-green-500" /><h3 className="font-semibold text-sm">Contact & Address</h3></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Mobile Phone', value: profile?.phone },
                    { label: 'Personal Email', value: profile?.personalEmail },
                    { label: 'Street Address', value: profile?.address },
                    { label: 'City / Town', value: profile?.city },
                    { label: 'Region / State', value: profile?.state },
                    { label: 'Country', value: profile?.country },
                  ].map((f, i) => (
                    <div key={i} className="bg-accent rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium mt-0.5">{f.value || '\u2014'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Details */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3"><Briefcase className="w-4 h-4 text-purple-500" /><h3 className="font-semibold text-sm">Employment Details</h3></div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Position', value: profile?.position },
                    { label: 'Department', value: profile?.department },
                    { label: 'Company', value: profile?.company },
                    { label: 'Role', value: roleLabel },
                    { label: 'Salary', value: profile?.salary },
                    { label: 'Joined', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : null },
                  ].map((f, i) => (
                    <div key={i} className="bg-accent rounded-lg p-3">
                      <p className="text-[11px] text-muted-foreground">{f.label}</p>
                      <p className="text-sm font-medium mt-0.5">{f.value || '\u2014'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <div className="flex items-center gap-2 mb-3"><Shield className="w-4 h-4 text-red-500" /><h3 className="font-semibold text-sm">Emergency Contact</h3></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-accent rounded-lg p-3"><p className="text-[11px] text-muted-foreground">Emergency Contact Name</p><p className="text-sm font-medium mt-0.5">{profile?.emergencyContact || '\u2014'}</p></div>
                  <div className="bg-accent rounded-lg p-3"><p className="text-[11px] text-muted-foreground">Emergency Phone</p><p className="text-sm font-medium mt-0.5">{profile?.emergencyPhone || '\u2014'}</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'payslips' && (() => {
          const sorted = [...payslips].sort((a, b) => { const av = a[payslipSort.key]||'', bv = b[payslipSort.key]||''; return payslipSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
          const toggleSort = (k: string) => setPayslipSort(p => p.key === k ? { key: k, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'desc' });
          const SI = ({ c }: { c: string }) => payslipSort.key === c ? (payslipSort.dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />) : <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
          const printAll = () => { if (!profile) return; const rows = sorted.map(p => { const net = (parseFloat(p.basicSalary||0)+parseFloat(p.allowances||0)-parseFloat(p.deductions||0)).toFixed(2); return `<tr><td>${p.period||'—'}</td><td>${p.payDate||'—'}</td><td>${currencySymbol} ${parseFloat(p.basicSalary||0).toLocaleString()}</td><td>${currencySymbol} ${parseFloat(p.allowances||0).toLocaleString()}</td><td>${currencySymbol} ${parseFloat(p.deductions||0).toLocaleString()}</td><td><strong>${currencySymbol} ${parseFloat(net).toLocaleString()}</strong></td><td>${p.status||'pending'}</td></tr>`; }).join(''); exportToPDFDoc('Payslip Report', `<h1>${branding.companyName} — Payslip Report</h1><p class="sub">Employee: ${profile.name} | Generated: ${new Date().toLocaleString()}</p><table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f3f4f6;"><th>Period</th><th>Pay Date</th><th>Basic</th><th>Allowances</th><th>Deductions</th><th>Net Pay</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`, branding.companyName); };
          return (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">My Payslips</CardTitle>{payslips.length > 0 && <div className="flex gap-2"><Button variant="outline" size="sm" onClick={printAll}><Printer className="w-3.5 h-3.5 mr-1" />Print All</Button><Button variant="outline" size="sm" onClick={() => { const csv = ['Period,Pay Date,Basic,Allowances,Deductions,Net,Status',...sorted.map(p => { const net=(parseFloat(p.basicSalary||0)+parseFloat(p.allowances||0)-parseFloat(p.deductions||0)).toFixed(2); return `${p.period||''},${p.payDate||''},${p.basicSalary||0},${p.allowances||0},${p.deductions||0},${net},${p.status||'pending'}`; })].join('\n'); const b=new Blob([csv],{type:'text/csv'}); const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='payslips.csv'; a.click(); URL.revokeObjectURL(u); toast.success('Exported'); }}><Download className="w-3.5 h-3.5 mr-1" />CSV</Button></div>}</div></CardHeader>
            <CardContent>
              {payslips.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No payslip records found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('period')}>Period<SI c="period" /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('payDate')}>Pay Date<SI c="payDate" /></TableHead>
                      <TableHead>Basic Salary</TableHead><TableHead>Allowances</TableHead><TableHead>Deductions</TableHead>
                      <TableHead>Net Pay</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>Status<SI c="status" /></TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((p, idx) => {
                      const net = (parseFloat(p.basicSalary || 0) + parseFloat(p.allowances || 0) - parseFloat(p.deductions || 0)).toFixed(2);
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{p.period || '\u2014'}</TableCell>
                          <TableCell>{p.payDate || '\u2014'}</TableCell>
                          <TableCell>{currencySymbol} {parseFloat(p.basicSalary || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-green-600">+{parseFloat(p.allowances || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-red-600">-{parseFloat(p.deductions || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-semibold">{currencySymbol} {parseFloat(net).toLocaleString()}</TableCell>
                          <TableCell><Badge className={p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{p.status || 'pending'}</Badge></TableCell>
                          <TableCell><Button variant="outline" size="sm" onClick={() => generateDocument(`Payslip - ${p.period || 'N/A'}`)}><Download className="w-3 h-3 mr-1" />PDF</Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>); })()}

        {activeTab === 'leave-history' && (() => {
          const sorted = [...leaves].sort((a, b) => { const av = a[leaveSort.key]||'', bv = b[leaveSort.key]||''; return leaveSort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av)); });
          const toggleSort = (k: string) => setLeaveSort(p => p.key === k ? { key: k, dir: p.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'desc' });
          const SI = ({ c }: { c: string }) => leaveSort.key === c ? (leaveSort.dir === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline" /> : <ArrowDown className="w-3 h-3 ml-1 inline" />) : <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-30" />;
          const printLeave = () => { if (!profile) return; const rows = sorted.map(l => `<tr><td>${l.leaveType||l.type||'—'}</td><td>${l.startDate||'—'}</td><td>${l.endDate||'—'}</td><td>${l.reason||'—'}</td><td>${l.status}</td></tr>`).join(''); exportToPDFDoc('Leave History', `<h1>${branding.companyName} — Leave History</h1><p class="sub">Employee: ${profile.name} | Generated: ${new Date().toLocaleString()}</p><table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:12px;"><thead><tr style="background:#f3f4f6;"><th>Type</th><th>Start</th><th>End</th><th>Reason</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`, branding.companyName); };
          return (
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="text-base">Leave History</CardTitle>{leaves.length > 0 && <Button variant="outline" size="sm" onClick={printLeave}><Printer className="w-3.5 h-3.5 mr-1" />Print</Button>}</div></CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No leave records found</p></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('leaveType')}>Type<SI c="leaveType" /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('startDate')}>Start Date<SI c="startDate" /></TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('endDate')}>End Date<SI c="endDate" /></TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>Status<SI c="status" /></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((l, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{l.leaveType || l.type || '\u2014'}</TableCell>
                        <TableCell>{l.startDate || '\u2014'}</TableCell>
                        <TableCell>{l.endDate || '\u2014'}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{l.reason || '\u2014'}</TableCell>
                        <TableCell><Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}>{l.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>); })()}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* File Upload Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base">My Uploaded Files</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5">Upload contracts, documents, and files (max {MAX_FILE_MB}MB each, {MAX_FILES} files total)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{myFiles.filter(f => f.type !== 'profile-image').length} / {MAX_FILES} files</Badge>
                    <Button size="sm" onClick={() => docUploadRef.current?.click()} disabled={uploadingDoc || myFiles.filter(f => f.type !== 'profile-image').length >= MAX_FILES}>
                      {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}
                      Upload File
                    </Button>
                    <input ref={docUploadRef} type="file" className="hidden" onChange={handleDocUpload} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {myFiles.filter(f => f.type !== 'profile-image').length >= MAX_FILES && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800">Upload limit reached ({MAX_FILES} files). Delete existing files to upload more.</p>
                  </div>
                )}
                {myFiles.filter(f => f.type !== 'profile-image').length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p>No files uploaded yet</p>
                    <p className="text-xs mt-1">Upload contracts, documents, or other files (max {MAX_FILE_MB}MB)</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {myFiles.filter(f => f.type !== 'profile-image').map(f => (
                      <div key={f.id} className="flex items-center justify-between p-3 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center border text-blue-500">
                            {f.mimeType?.startsWith('image/') ? <Image className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{f.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {(f.fileSize / 1024).toFixed(1)}KB &middot; {f.type || 'general'} &middot; {new Date(f.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {f.signedUrl && (
                            <Button variant="outline" size="sm" className="h-7" onClick={() => window.open(f.signedUrl, '_blank')}>
                              <Download className="w-3 h-3 mr-1" />View
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteFile(f.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Documents */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><div><CardTitle className="text-base">Employment Documents & Certificates</CardTitle><p className="text-sm text-muted-foreground mt-0.5">Official documents generated from your employee record</p></div></div>
                  <Button variant="outline" size="sm" onClick={() => { 
                    const csv = `Document,Date,Type\nEmployment Contract,${new Date().toLocaleDateString()},PDF\nAppointment Letter,${new Date().toLocaleDateString()},PDF\nTax Forms,${new Date().toLocaleDateString()},PDF\nBenefits Enrollment,${new Date().toLocaleDateString()},PDF`;
                    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = 'documents-list.csv'; a.click(); URL.revokeObjectURL(url);
                    toast.success('Exported document list');
                  }}><FileText className="w-4 h-4 mr-1 text-green-600" />Export List (Excel)</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const joinDate = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                  const docList = [
                    { name: 'Employment Contract', date: joinDate, color: 'text-red-500' },
                    { name: 'Appointment Letter', date: joinDate, color: 'text-red-500' },
                    { name: 'Tax Forms', date: `Jan 01, ${currentYear}`, color: 'text-blue-500' },
                    { name: 'Benefits Enrollment', date: joinDate, color: 'text-green-500' },
                    { name: `Performance Review Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${currentYear}`, date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), color: 'text-purple-500' },
                  ];
                  return docList.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-card flex items-center justify-center border ${doc.color}`}><FileText className="w-5 h-5" /></div>
                      <div><p className="text-sm font-medium">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.date} &middot; PDF</p></div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => generateDocument(doc.name)}><Eye className="w-3.5 h-3.5 mr-1" />Preview</Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => generateDocument(doc.name)}><Download className="w-3.5 h-3.5 mr-1" />Download PDF</Button>
                    </div>
                  </div>
                  ));
                })()}
                </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Edit Contact Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Profile Details</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {/* Employment Details — only for admin/superadmin/manager */}
            {isPrivilegedRole && (
              <>
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Employment Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Full Name</Label><Input value={editData.name || ''} onChange={e => setEditData({ ...editData, name: e.target.value })} /></div>
                  <div><Label>Position</Label><Input value={editData.position || ''} onChange={e => setEditData({ ...editData, position: e.target.value })} placeholder="e.g., HR Manager" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Department</Label><Input value={editData.department || ''} onChange={e => setEditData({ ...editData, department: e.target.value })} placeholder="e.g., Human Resources" /></div>
                  <div><Label>Company</Label><Input value={editData.company || ''} onChange={e => setEditData({ ...editData, company: e.target.value })} placeholder="e.g., Blumebyte" /></div>
                  <div><Label>Salary</Label><Input value={editData.salary || ''} onChange={e => setEditData({ ...editData, salary: e.target.value })} placeholder={`e.g., ${currencySymbol} 5,000`} /></div>
                </div>
                <Separator />
              </>
            )}

            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Personal Information</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mobile Phone</Label><Input value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} /></div>
              <div><Label>Personal Email</Label><Input type="email" value={editData.personalEmail || ''} onChange={e => setEditData({ ...editData, personalEmail: e.target.value })} /></div>
            </div>
            <div><Label>Street Address</Label><Input value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>City</Label><Input value={editData.city || ''} onChange={e => setEditData({ ...editData, city: e.target.value })} /></div>
              <div><Label>Region/State</Label><Input value={editData.state || ''} onChange={e => setEditData({ ...editData, state: e.target.value })} /></div>
              <div><Label>Country</Label><Input value={editData.country || ''} onChange={e => setEditData({ ...editData, country: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date of Birth</Label><Input type="date" value={editData.dateOfBirth || ''} onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })} /></div>
              <div><Label>Gender</Label>
                <Select value={['male','female','other'].includes(editData.gender) ? editData.gender : (editData.gender ? 'other' : '')} onValueChange={v => {
                  if (v === 'other') {
                    setEditData({ ...editData, gender: 'other' });
                  } else {
                    setEditData({ ...editData, gender: v });
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
                {(editData.gender === 'other' || (editData.gender && !['male','female'].includes(editData.gender))) && (
                  <Input className="mt-2" placeholder="Specify gender..." value={editData.gender !== 'other' ? editData.gender : ''} onChange={e => setEditData({ ...editData, gender: e.target.value || 'other' })} autoFocus />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marital Status</Label>
                <Select value={['single','married','divorced','widowed','other'].includes(editData.maritalStatus) ? editData.maritalStatus : (editData.maritalStatus ? 'other' : '')} onValueChange={v => {
                  if (v === 'other') {
                    setEditData({ ...editData, maritalStatus: 'other' });
                  } else {
                    setEditData({ ...editData, maritalStatus: v });
                  }
                }}>
                  <SelectTrigger><SelectValue placeholder="Select marital status" /></SelectTrigger>
                  <SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem><SelectItem value="divorced">Divorced</SelectItem><SelectItem value="widowed">Widowed</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                </Select>
                {(editData.maritalStatus === 'other' || (editData.maritalStatus && !['single','married','divorced','widowed'].includes(editData.maritalStatus))) && (
                  <Input className="mt-2" placeholder="Specify marital status..." value={editData.maritalStatus !== 'other' ? editData.maritalStatus : ''} onChange={e => setEditData({ ...editData, maritalStatus: e.target.value || 'other' })} autoFocus />
                )}
              </div>
              <div><Label>Nationality</Label><Input value={editData.nationality || ''} onChange={e => setEditData({ ...editData, nationality: e.target.value })} placeholder="e.g., Ghanaian" /></div>
            </div>
            <Separator />
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Emergency Contact</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Emergency Contact</Label><Input value={editData.emergencyContact || ''} onChange={e => setEditData({ ...editData, emergencyContact: e.target.value })} /></div>
              <div><Label>Emergency Phone</Label><Input value={editData.emergencyPhone || ''} onChange={e => setEditData({ ...editData, emergencyPhone: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            {!isPrivilegedRole && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 mr-auto">Changes require HR approval</Badge>}
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}{!isPrivilegedRole ? 'Submit for Approval' : 'Save Changes'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => { if (!open && !uploadingImage) { setCropDialogOpen(false); setCropImageSrc(null); } }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Crop Profile Image</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">Drag the image to reposition. Use the slider to zoom in/out.</p>
          <div className="flex flex-col items-center gap-4 py-2">
            {/* Circular crop preview */}
            <div
              ref={cropContainerRef}
              className="relative w-56 h-56 rounded-full overflow-hidden border-4 border-blue-200 cursor-move select-none bg-gray-100"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
              onTouchStart={handleCropTouchStart}
              onTouchMove={handleCropTouchMove}
              onTouchEnd={handleCropTouchEnd}
            >
              {cropImageSrc && (
                <img
                  src={cropImageSrc}
                  alt="Crop preview"
                  className="absolute pointer-events-none"
                  draggable={false}
                  style={{
                    width: `${100 * cropZoom}%`,
                    height: `${100 * cropZoom}%`,
                    objectFit: 'cover',
                    left: `${50 + cropPosition.x}%`,
                    top: `${50 + cropPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )}
            </div>
            {/* Zoom slider */}
            <div className="flex items-center gap-3 w-full max-w-xs">
              <span className="text-xs text-gray-500">-</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={cropZoom}
                onChange={e => setCropZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-gray-500">+</span>
            </div>
            <p className="text-[11px] text-gray-400">Image will be auto-compressed to fit under {MAX_PROFILE_IMAGE_KB}KB</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCropDialogOpen(false); setCropImageSrc(null); }}>Cancel</Button>
            <Button onClick={handleCropAndUpload} disabled={uploadingImage}>
              {uploadingImage && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Crop & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}