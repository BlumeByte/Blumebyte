import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth-context';
import { useBranding } from '../lib/branding-context';
import { api, apiUpload } from '../lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner@2.0.3';
import { Upload, Loader2, Trash2, Save, Building2, Palette, ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';

const PRESET_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
  '#14b8a6', '#6366f1', '#a855f7', '#ef4444', '#f97316',
  '#84cc16', '#06b6d4', '#d946ef', '#dc2626', '#eab308',
];

export function CompanyBrandingSettings() {
  const { accessToken, user } = useAuth();
  const { branding, refresh: refreshBranding } = useBranding();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  
  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropZoom, setCropZoom] = useState(1);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    api('/company-settings', { token: accessToken })
      .then(data => setSettings(data || {}))
      .catch(() => setSettings({}))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api('/superadmin/company-branding', { 
        method: 'PUT', 
        body: settings, 
        token: accessToken 
      });
      toast.success('✅ Company branding updated successfully. Reloading...');
      refreshBranding();
      window.dispatchEvent(new Event('branding-updated'));
      
      // Reload page after 1 second to apply changes everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save branding');
      setSaving(false);
    }
  };

  // Step 1: File selected → open crop dialog
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setCropImageSrc(dataUrl);
      setCropPosition({ x: 0, y: 0 });
      setCropZoom(1);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Step 2: Crop & Upload
  const handleCropAndUpload = async () => {
    if (!cropImageSrc) return;

    setUploading(true);
    try {
      // Create canvas to render the circular crop
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');

      const size = 400; // Output size
      canvas.width = size;
      canvas.height = size;

      const img = new Image();
      img.src = cropImageSrc;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Draw circular clipped image
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const scale = cropZoom;
      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;
      const offsetX = cropPosition.x * scale;
      const offsetY = cropPosition.y * scale;

      ctx.drawImage(
        img,
        0, 0, img.width, img.height,
        size / 2 - drawWidth / 2 + offsetX,
        size / 2 - drawHeight / 2 + offsetY,
        drawWidth,
        drawHeight
      );
      ctx.restore();

      // Convert canvas to blob
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/png');
      });

      // Upload to server
      const formData = new FormData();
      formData.append('file', blob, 'logo.png');

      const result = await apiUpload('/upload/company-logo', formData, accessToken);

      setSettings({ ...settings, logoUrl: result.logoUrl });
      toast.success('✅ Logo uploaded successfully');
      setCropDialogOpen(false);
      setCropImageSrc(null);
      refreshBranding();
      window.dispatchEvent(new Event('branding-updated'));
    } catch (e: any) {
      toast.error(e.message || 'Logo upload failed');
    }
    setUploading(false);
  };

  const handleRemoveLogo = async () => {
    if (!confirm('Remove company logo?')) return;
    setRemovingLogo(true);
    try {
      await api('/superadmin/remove-company-logo', { method: 'DELETE', token: accessToken });
      setSettings({ ...settings, logoUrl: '' });
      toast.success('Logo removed');
      refreshBranding();
      window.dispatchEvent(new Event('branding-updated'));
    } catch (e: any) {
      toast.error(e.message || 'Failed to remove logo');
    }
    setRemovingLogo(false);
  };

  // Crop handlers
  const handleCropMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y };
  };

  const handleCropMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    setCropPosition({ x: newX, y: newY });
  };

  const handleCropMouseUp = () => {
    isDragging.current = false;
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCropZoom(parseFloat(e.target.value));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Company Branding</CardTitle>
              <CardDescription>
                Customize your company's name, logo, and colors. Changes apply to all users in your company only.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Company Logo</Label>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 mr-1" />
                  )}
                  Upload Logo
                </Button>
                {settings.logoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                    onClick={handleRemoveLogo}
                    disabled={removingLogo}
                  >
                    {removingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                    )}
                    Remove
                  </Button>
                )}
                <p className="text-[10px] text-gray-400">
                  Max 5MB. JPG, PNG, GIF, WEBP. Image will be cropped to a circle.
                </p>
              </div>
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input
              value={settings.companyName || ''}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              placeholder="Enter your company name"
            />
            <p className="text-[10px] text-gray-400">
              This will replace "Blumebyte" in PDFs, emails, and all user interfaces for your company.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Tagline / Description</Label>
            <Textarea
              value={settings.description || ''}
              onChange={(e) => setSettings({ ...settings, description: e.target.value })}
              placeholder="e.g., Human Resource Information System"
              rows={2}
            />
          </div>

          {/* Primary Color */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Primary Brand Color
            </Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 ${
                    settings.primaryColor === color
                      ? 'border-gray-900 scale-110 shadow-lg'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSettings({ ...settings, primaryColor: color })}
                  title={color}
                />
              ))}
            </div>
            <Input
              type="text"
              value={settings.primaryColor || '#10b981'}
              onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
              placeholder="#10b981"
              className="mt-2 font-mono text-sm"
            />
          </div>

          {/* Dark Mode */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Dark Mode
            </Label>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
              <div>
                <p className="text-sm font-medium">Enable Dark Mode for All Users</p>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, all users in your company will see a dark interface
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg border">
            <p className="text-xs text-gray-500 mb-3">Preview:</p>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-3">
                {settings.logoUrl && (
                  <img src={settings.logoUrl} alt="Logo" className="w-12 h-12 rounded-full object-cover" />
                )}
                <div>
                  <h3 className="font-bold text-lg" style={{ color: settings.primaryColor || '#10b981' }}>
                    {settings.companyName || 'Your Company Name'}
                  </h3>
                  <p className="text-sm text-gray-600">{settings.description || 'Your tagline'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tenant Isolation Notice */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>🔒 Tenant Isolation:</strong> These branding changes only affect users in your company.
              Other companies maintain their own separate branding settings.
            </p>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Branding Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={(open) => !uploading && setCropDialogOpen(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Logo (Circular)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              ref={cropContainerRef}
              className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden cursor-move"
              onMouseDown={handleCropMouseDown}
              onMouseMove={handleCropMouseMove}
              onMouseUp={handleCropMouseUp}
              onMouseLeave={handleCropMouseUp}
            >
              {cropImageSrc && (
                <>
                  <img
                    src={cropImageSrc}
                    alt="Crop"
                    className="absolute top-1/2 left-1/2 pointer-events-none"
                    style={{
                      transform: `translate(-50%, -50%) translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropZoom})`,
                      maxWidth: 'none',
                    }}
                  />
                  {/* Circular overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg width="100%" height="100%" className="absolute inset-0">
                      <defs>
                        <mask id="circleMask">
                          <rect width="100%" height="100%" fill="white" />
                          <circle cx="50%" cy="50%" r="45%" fill="black" />
                        </mask>
                      </defs>
                      <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#circleMask)" />
                      <circle cx="50%" cy="50%" r="45%" fill="none" stroke="white" strokeWidth="2" />
                    </svg>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label>Zoom</Label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={cropZoom}
                onChange={handleZoomChange}
                className="w-full"
              />
              <p className="text-xs text-gray-500">Drag to reposition, use slider to zoom</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCropDialogOpen(false)} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleCropAndUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                'Crop & Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}