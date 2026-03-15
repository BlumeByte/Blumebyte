import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Megaphone } from 'lucide-react';

export function AnnouncementsViewer() {
  const { accessToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const d = await api('/announcements', { token: accessToken });
      setItems(Array.isArray(d) ? d.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []);
    } catch (e) { console.log(e); }
    setLoading(false);
  }, [accessToken]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>No announcements</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-3xl">
      {items.map(i => (
        <Card key={i.id}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium">{i.title}</h3>
              <Badge className={
                i.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                i.priority === 'important' ? 'bg-amber-100 text-amber-800' :
                'bg-blue-100 text-blue-800'
              }>
                {i.priority}
              </Badge>
              {i.createdByRole === 'superadmin' && <Badge className="bg-purple-100 text-purple-800">Company</Badge>}
              {i.createdByRole === 'admin' && <Badge className="bg-indigo-100 text-indigo-800">Admin</Badge>}
              {i.targetDepartments?.length > 0 && i.targetAudience !== 'all' && (
                <Badge className="bg-green-100 text-green-800">{i.targetDepartments.length} Dept{i.targetDepartments.length > 1 ? 's' : ''}</Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{i.content}</p>
            <p className="text-xs text-gray-400 mt-2">
              {i.authorName} {'\u2022'} {new Date(i.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
