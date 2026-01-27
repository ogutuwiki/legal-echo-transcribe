import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, X, FileSpreadsheet, Mail } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InviteMemberDialog = ({ open, onOpenChange }: InviteMemberDialogProps) => {
  const [email, setEmail] = useState('');
  const [bulkEmails, setBulkEmails] = useState('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { inviteMember } = useOrganization();
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const parseEmails = (text: string): string[] => {
    const emails = text
      .split(/[,;\n\r]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e && validateEmail(e));
    return [...new Set(emails)]; // Remove duplicates
  };

  const handleBulkTextChange = (text: string) => {
    setBulkEmails(text);
    setParsedEmails(parseEmails(text));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv' || fileExtension === 'txt') {
      const text = await file.text();
      handleBulkTextChange(text);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      // For Excel files, we'll use a simple approach - read as text
      // In a production app, you'd use a library like xlsx
      toast({
        title: 'Excel Import',
        description: 'Please save your Excel file as CSV for import, or copy-paste emails directly.',
        variant: 'default'
      });
    } else {
      toast({
        title: 'Unsupported Format',
        description: 'Please use CSV, TXT, or copy-paste emails directly.',
        variant: 'destructive'
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeEmail = (emailToRemove: string) => {
    const updated = parsedEmails.filter(e => e !== emailToRemove);
    setParsedEmails(updated);
    setBulkEmails(updated.join(', '));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    const { error } = await inviteMember(email.trim());
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to send invitation. Please try again.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${email}`
      });
      setEmail('');
      onOpenChange(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedEmails.length === 0) return;

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const emailAddr of parsedEmails) {
      const { error } = await inviteMember(emailAddr);
      if (error) {
        failCount++;
      } else {
        successCount++;
      }
    }

    setLoading(false);

    if (failCount === 0) {
      toast({
        title: 'All Invitations Sent',
        description: `Successfully invited ${successCount} team member(s)`
      });
      setBulkEmails('');
      setParsedEmails([]);
      onOpenChange(false);
    } else {
      toast({
        title: 'Partial Success',
        description: `Invited ${successCount} member(s), ${failCount} failed (may already be invited)`,
        variant: 'default'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Team Members</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Single
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 pt-4">
            <form onSubmit={handleSingleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@lawfirm.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  The invited user will receive an email with instructions to join your organization.
                </p>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Import from File</Label>
                <div className="flex gap-2">
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV or Excel File
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported: CSV, TXT (one email per line or comma-separated)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk-emails">Or Paste Emails</Label>
                <Textarea
                  id="bulk-emails"
                  placeholder="Enter emails separated by commas or new lines:&#10;john@example.com, jane@example.com&#10;bob@example.com"
                  value={bulkEmails}
                  onChange={(e) => handleBulkTextChange(e.target.value)}
                  rows={4}
                />
              </div>

              {parsedEmails.length > 0 && (
                <div className="space-y-2">
                  <Label>Validated Emails ({parsedEmails.length})</Label>
                  <div className="max-h-32 overflow-y-auto p-2 border rounded-md bg-muted/50">
                    <div className="flex flex-wrap gap-1">
                      {parsedEmails.map((emailAddr) => (
                        <Badge
                          key={emailAddr}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {emailAddr}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-destructive"
                            onClick={() => removeEmail(emailAddr)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={loading || parsedEmails.length === 0}
              >
                {loading ? 'Sending...' : `Invite ${parsedEmails.length} Member(s)`}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
