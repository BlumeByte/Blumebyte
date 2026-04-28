import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Users, AlertTriangle, Search, CheckCircle2, 
  XCircle, User, Shield, Briefcase 
} from 'lucide-react';

interface UserLicenseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: any[];
  maxLicenses: number;       // total licenses after the purchase (existing + new)
  additionalLicenses: number; // how many extra are being bought right now
  currentPurchasedLicenses: number;
  onConfirm: (selectedUserIds: string[]) => void;
  loading?: boolean;
}

export function UserLicenseSelector({
  open,
  onOpenChange,
  users,
  maxLicenses,
  additionalLicenses,
  currentPurchasedLicenses,
  onConfirm,
  loading = false,
}: UserLicenseSelectorProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      // Pre-select users up to the license limit (prioritize superadmin, then admins, then managers)
      const sortedUsers = [...users].sort((a, b) => {
        const roleOrder = { superadmin: 0, admin: 1, manager: 2, employee: 3 };
        const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 4;
        const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 4;
        return aOrder - bOrder;
      });

      const initialSelected = new Set(
        sortedUsers.slice(0, maxLicenses).map(u => u.id || u.userId)
      );
      setSelectedUserIds(initialSelected);
    }
  }, [open, users, maxLicenses]);

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      if (newSelected.size >= maxLicenses) {
        return; // Can't select more than max licenses
      }
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const filteredUsers = users.filter(user => {
    const name = user.name || user.fullName || '';
    const email = user.email || '';
    const role = user.role || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || 
           email.toLowerCase().includes(query) || 
           role.toLowerCase().includes(query);
  });

  const activeCount = users.filter(u => u.status === 'active').length;
  const deactivatedCount = activeCount - selectedUserIds.size;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'superadmin': return <Shield className="w-4 h-4" />;
      case 'admin': return <Briefcase className="w-4 h-4" />;
      case 'manager': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'manager': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Users to Keep Active
          </DialogTitle>
          <DialogDescription>
            You're purchasing {additionalLicenses} additional license(s).
            After this purchase you'll have {maxLicenses} total license(s), but you currently have {activeCount} active user(s).
            Select up to {maxLicenses} users to remain active — unselected users will be deactivated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="space-y-1">
                <p className="font-medium">
                  {deactivatedCount > 0 
                    ? `${deactivatedCount} user(s) will be deactivated` 
                    : 'All users will remain active'}
                </p>
                <p className="text-sm">
                  Deactivated users will lose access to the system immediately after payment confirmation.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Selection Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{selectedUserIds.size}</p>
                <p className="text-xs text-muted-foreground">Selected</p>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{maxLicenses}</p>
                <p className="text-xs text-muted-foreground">Total Licenses</p>
              </div>
              <div className="h-8 w-px bg-gray-300" />
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{deactivatedCount}</p>
                <p className="text-xs text-muted-foreground">To Deactivate</p>
              </div>
            </div>
            {selectedUserIds.size < maxLicenses && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                {maxLicenses - selectedUserIds.size} more available
              </Badge>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* User List */}
          <ScrollArea className="h-[min(340px,50vh)] border rounded-lg">
            <div className="p-4 space-y-2">
              {filteredUsers.map((user) => {
                const userId = user.id || user.userId;
                const isSelected = selectedUserIds.has(userId);
                const isSuperAdmin = user.role === 'superadmin';
                const canToggle = !isSuperAdmin; // SuperAdmin can't be deactivated

                return (
                  <div
                    key={userId}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    } ${!canToggle ? 'opacity-75' : 'cursor-pointer'}`}
                    onClick={() => canToggle && toggleUser(userId)}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={!canToggle}
                      onCheckedChange={() => canToggle && toggleUser(userId)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={isSelected ? 'bg-green-200' : 'bg-gray-200'}>
                        {(user.name || user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {user.name || user.fullName || 'No Name'}
                        </p>
                        {isSuperAdmin && (
                          <Badge variant="outline" className="border-purple-300 text-purple-700 text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                        <span className="mr-1">{getRoleIcon(user.role)}</span>
                        {user.role}
                      </Badge>

                      {user.status === 'active' && (
                        <Badge variant="outline" className="border-green-300 text-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}

                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No users found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(Array.from(selectedUserIds))}
            disabled={loading || selectedUserIds.size === 0}
          >
            {loading ? 'Processing...' : `Continue with ${selectedUserIds.size} User(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
