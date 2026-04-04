import React, { useState, useEffect } from 'react';
import { api } from '../lib/api-client';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Building2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  size?: string;
  industry?: string;
  status?: string;
  licenses?: number;
  usedLicenses?: number;
}

interface CompanySwitcherProps {
  accessToken: string;
  currentCompanyId?: string;
  onCompanySwitch?: (companyId: string, companyName: string) => void;
}

export function CompanySwitcher({ 
  accessToken, 
  currentCompanyId,
  onCompanySwitch 
}: CompanySwitcherProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(currentCompanyId || 'all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompanies();
  }, [accessToken]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await api('/superadmin/company', { token: accessToken });
      const companiesList = Array.isArray(data) ? data : [];
      setCompanies(companiesList);
      
      // Set initial selection
      if (!currentCompanyId && companiesList.length > 0) {
        setSelectedCompanyId('all');
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    
    if (companyId === 'all') {
      toast.success('Viewing all companies');
      onCompanySwitch?.(companyId, 'All Companies');
    } else {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        toast.success(`Switched to ${company.name}`);
        onCompanySwitch?.(companyId, company.name);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>Loading companies...</span>
      </div>
    );
  }

  if (companies.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedCompanyId} onValueChange={handleCompanyChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Select company..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="font-semibold">All Companies</span>
              <span className="text-xs text-muted-foreground">({companies.length})</span>
            </div>
          </SelectItem>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              <div className="flex flex-col">
                <span className="font-medium">{typeof company.name === 'string' ? company.name : String(company.name || company.id)}</span>
                <span className="text-xs text-muted-foreground">
                  {company.industry} • {company.usedLicenses || 0}/{company.licenses || 0} licenses
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="sm"
        onClick={loadCompanies}
        title="Refresh companies"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}
