import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CreditRequest {
  id: string;
  message: string | null;
  status: string;
  admin_note: string | null;
  credits_approved: number | null;
  created_at: string;
}

const CreditRequestDialog = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<CreditRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) fetchRequests();
  }, [open, user]);

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('credit_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setRequests(data);
  };

  const handleSubmit = async () => {
    if (!user || !message.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('credit_requests').insert({
      user_id: user.id,
      message: message.trim(),
    });
    if (error) {
      toast({ title: 'Error submitting request', variant: 'destructive' });
    } else {
      toast({ title: 'Credit request submitted!' });
      setMessage('');
      fetchRequests();
    }
    setSubmitting(false);
  };

  const statusConfig: Record<string, { icon: any; color: string }> = {
    pending: { icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-300' },
    approved: { icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
    declined: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300' },
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/10">
          <CreditCard className="h-4 w-4" />
          Request Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Request Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Describe why you need additional credits..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <Button onClick={handleSubmit} disabled={submitting || !message.trim()} className="w-full gap-2">
              <Send className="h-4 w-4" />
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>

          {requests.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-muted-foreground">Your Requests</h4>
              {requests.map((req) => {
                const config = statusConfig[req.status] || statusConfig.pending;
                const Icon = config.icon;
                return (
                  <div key={req.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={config.color}>
                        <Icon className="h-3 w-3 mr-1" />
                        {req.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(req.created_at), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm">{req.message}</p>
                    {req.status === 'approved' && req.credits_approved && (
                      <p className="text-xs text-emerald-600 font-medium">+{req.credits_approved} credits added</p>
                    )}
                    {req.admin_note && (
                      <p className="text-xs text-muted-foreground italic">Admin: {req.admin_note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreditRequestDialog;
