import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner@2.0.3';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api-client';

export function SyncStatsButton() {
  const { accessToken } = useAuth();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await api('/admin/sync-company-stats', {
        method: 'POST',
        token: accessToken,
      });
      
      if (result.success) {
        toast.success('Company stats synchronized successfully');
      }
    } catch (e: any) {
      console.error('Error syncing stats:', e);
      toast.error(e.message || 'Failed to sync stats');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={handleSync}
      disabled={syncing}
    >
      {syncing ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-2" />
          Sync Stats
        </>
      )}
    </Button>
  );
}