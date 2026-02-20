import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface CreditRequest {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  admin_note: string | null;
  credits_approved: number | null;
  created_at: string;
  user_name: string;
}

const AdminCreditRequests = () => {
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [approveDialog, setApproveDialog] = useState<CreditRequest | null>(null);
  const [declineDialog, setDeclineDialog] = useState<CreditRequest | null>(null);
  const [creditsAmount, setCreditsAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('credit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const withNames = await Promise.all(
        data.map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', req.user_id)
            .single();
          return { ...req, user_name: profile?.full_name || 'Unknown' };
        })
      );
      setRequests(withNames);
    }
  };

  const handleApprove = async () => {
    if (!approveDialog || !creditsAmount) return;
    setProcessing(true);
    const credits = parseInt(creditsAmount);

    // Update request status
    const { error: reqError } = await supabase
      .from('credit_requests')
      .update({ status: 'approved', credits_approved: credits, admin_note: adminNote || null })
      .eq('id', approveDialog.id);

    if (reqError) {
      toast({ title: 'Error approving request', variant: 'destructive' });
      setProcessing(false);
      return;
    }

    // Add credits to user
    const { data: currentCredits } = await supabase
      .from('credits')
      .select('remaining_credits, total_credits')
      .eq('user_id', approveDialog.user_id)
      .single();

    if (currentCredits) {
      await supabase
        .from('credits')
        .update({
          remaining_credits: currentCredits.remaining_credits + credits,
          total_credits: currentCredits.total_credits + credits,
        })
        .eq('user_id', approveDialog.user_id);
    }

    toast({ title: `Approved ${credits} credits for ${approveDialog.user_name}` });
    setApproveDialog(null);
    setCreditsAmount('');
    setAdminNote('');
    setProcessing(false);
    fetchRequests();
  };

  const handleDecline = async () => {
    if (!declineDialog) return;
    setProcessing(true);

    const { error } = await supabase
      .from('credit_requests')
      .update({ status: 'declined', admin_note: adminNote || null })
      .eq('id', declineDialog.id);

    if (error) {
      toast({ title: 'Error declining request', variant: 'destructive' });
    } else {
      toast({ title: 'Request declined' });
    }

    setDeclineDialog(null);
    setAdminNote('');
    setProcessing(false);
    fetchRequests();
  };

  const statusConfig: Record<string, { icon: any; variant: 'default' | 'secondary' | 'destructive' }> = {
    pending: { icon: Clock, variant: 'secondary' },
    approved: { icon: CheckCircle, variant: 'default' },
    declined: { icon: XCircle, variant: 'destructive' },
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const Icon = config.icon;
            return (
              <TableRow key={req.id}>
                <TableCell>{format(new Date(req.created_at), 'MMM dd, yyyy')}</TableCell>
                <TableCell className="font-medium">{req.user_name}</TableCell>
                <TableCell className="max-w-[200px] truncate">{req.message}</TableCell>
                <TableCell>
                  <Badge variant={config.variant} className="gap-1">
                    <Icon className="h-3 w-3" />
                    {req.status}
                  </Badge>
                </TableCell>
                <TableCell>{req.credits_approved ?? '—'}</TableCell>
                <TableCell>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => { setApproveDialog(req); setAdminNote(''); setCreditsAmount(''); }}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setDeclineDialog(req); setAdminNote(''); }}>
                        <XCircle className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {requests.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No credit requests yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Approve Dialog */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Credit Request</DialogTitle>
          </DialogHeader>
          {approveDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">{approveDialog.user_name}</p>
                <p className="text-sm text-muted-foreground">{approveDialog.message}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Credits to Add</label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Enter number of credits"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional)</label>
                <Textarea
                  placeholder="Add a note for the user..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                />
              </div>
              <Button onClick={handleApprove} disabled={processing || !creditsAmount} className="w-full">
                {processing ? 'Processing...' : `Approve & Add ${creditsAmount || '0'} Credits`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={!!declineDialog} onOpenChange={() => setDeclineDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Credit Request</DialogTitle>
          </DialogHeader>
          {declineDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 space-y-1">
                <p className="text-sm font-medium">{declineDialog.user_name}</p>
                <p className="text-sm text-muted-foreground">{declineDialog.message}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason (optional)</label>
                <Textarea
                  placeholder="Add a reason for declining..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={2}
                />
              </div>
              <Button variant="destructive" onClick={handleDecline} disabled={processing} className="w-full">
                {processing ? 'Processing...' : 'Decline Request'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCreditRequests;
