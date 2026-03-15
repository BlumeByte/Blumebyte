import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { MessagesPanel } from './MessagesPanel';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface MessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessagesModal({ open, onOpenChange }: MessagesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[85vh] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Messages</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden px-6 py-4">
          <MessagesPanel />
        </div>
      </DialogContent>
    </Dialog>
  );
}
