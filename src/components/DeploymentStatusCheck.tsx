import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle2, XCircle, Loader2, Server } from 'lucide-react';
import { publicAnonKey } from '../utils/supabase/info';
import { buildFunctionsUrl } from '../lib/functions-base';

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  endpoints: string[];
}

export function DeploymentStatusCheck() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [healthData, setHealthData] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkDeployment = async () => {
      try {
        const response = await fetch(
          buildFunctionsUrl('/health'),
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setHealthData(data);
        setStatus('success');
      } catch (err) {
        console.error('Deployment check failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('error');
      }
    };

    checkDeployment();
  }, []);

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle>Supabase Deployment Status</CardTitle>
            <CardDescription>Edge Function Health Check</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {status === 'loading' && (
          <div className="flex items-center gap-3 text-gray-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking deployment status...</span>
          </div>
        )}

        {status === 'success' && healthData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="font-semibold">Deployment Successful!</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium text-gray-700">Status:</span>
                <span className="text-green-600 font-semibold">{healthData.status}</span>
                
                <span className="font-medium text-gray-700">Version:</span>
                <span className="text-gray-900">{healthData.version}</span>
                
                <span className="font-medium text-gray-700">Timestamp:</span>
                <span className="text-gray-600 text-xs">{new Date(healthData.timestamp).toLocaleString()}</span>
              </div>
              
              {healthData.endpoints && healthData.endpoints.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="font-medium text-gray-700 text-sm block mb-2">Active Endpoints:</span>
                  <ul className="space-y-1">
                    {healthData.endpoints.map((endpoint, idx) => (
                      <li key={idx} className="text-xs text-gray-600 font-mono bg-white rounded px-2 py-1">
                        /{endpoint}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-red-600">
              <XCircle className="h-6 w-6" />
              <span className="font-semibold">Deployment Check Failed</span>
            </div>
            
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-800 font-mono">{error}</p>
            </div>
            
            <p className="text-sm text-gray-600">
              This could be due to:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Edge function not yet deployed</li>
              <li>Network connectivity issues</li>
              <li>CORS configuration problems</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
