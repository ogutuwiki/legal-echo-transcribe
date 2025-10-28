import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, TrendingUp, Download } from 'lucide-react';
import { format } from 'date-fns';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  credits_purchased: number;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  user_name: string;
}

const AdminPayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showHighestPayer, setShowHighestPayer] = useState(false);
  const [showCreditsUsed, setShowCreditsUsed] = useState(false);
  const [highestPayerData, setHighestPayerData] = useState<any>(null);
  const [creditsData, setCreditsData] = useState<any>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsData) {
        const paymentsWithNames = await Promise.all(
          paymentsData.map(async (payment) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', payment.user_id)
              .single();
            
            return {
              ...payment,
              user_name: profile?.full_name || 'Unknown',
            };
          })
        );
        setPayments(paymentsWithNames);
      }
    };

    fetchPayments();
  }, []);

  const handleHighestPayer = async () => {
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('user_id, amount');

    if (paymentsData) {
      const userTotals: Record<string, { total: number; name: string }> = {};
      
      for (const payment of paymentsData) {
        if (!userTotals[payment.user_id]) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', payment.user_id)
            .single();
          
          userTotals[payment.user_id] = { total: 0, name: profile?.full_name || 'Unknown' };
        }
        userTotals[payment.user_id].total += Number(payment.amount);
      }

      const highest = Object.entries(userTotals).sort((a, b) => b[1].total - a[1].total)[0];
      if (highest) {
        setHighestPayerData({ name: highest[1].name, total: highest[1].total });
        setShowHighestPayer(true);
      }
    }
  };

  const handleCreditsUsed = async () => {
    const { data } = await supabase.from('credits').select('*');

    if (data) {
      const totals = data.reduce((acc, credit) => ({
        used: acc.used + credit.used_credits,
        remaining: acc.remaining + credit.remaining_credits,
        worth: acc.worth + (credit.remaining_credits * 0.1),
      }), { used: 0, remaining: 0, worth: 0 });

      setCreditsData(totals);
      setShowCreditsUsed(true);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Date', 'User', 'Amount', 'Credits', 'Method', 'Transaction ID'],
      ...payments.map(p => [
        format(new Date(p.created_at), 'yyyy-MM-dd'),
        p.user_name,
        p.amount,
        p.credits_purchased,
        p.payment_method,
        p.transaction_id,
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Button onClick={handleHighestPayer}>
          <Trophy className="mr-2 h-4 w-4" />
          Highest Payer
        </Button>
        <Button onClick={handleCreditsUsed}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Credits Used
        </Button>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Transaction ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{format(new Date(payment.created_at), 'MMM dd, yyyy')}</TableCell>
              <TableCell>{payment.user_name}</TableCell>
              <TableCell>${payment.amount}</TableCell>
              <TableCell>{payment.credits_purchased}</TableCell>
              <TableCell>{payment.payment_method}</TableCell>
              <TableCell className="font-mono text-xs">{payment.transaction_id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={showHighestPayer} onOpenChange={setShowHighestPayer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Highest Payer</DialogTitle>
          </DialogHeader>
          {highestPayerData && (
            <div className="space-y-2">
              <p><strong>Name:</strong> {highestPayerData.name}</p>
              <p><strong>Total Paid:</strong> ${highestPayerData.total.toFixed(2)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showCreditsUsed} onOpenChange={setShowCreditsUsed}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credits Overview</DialogTitle>
          </DialogHeader>
          {creditsData && (
            <div className="space-y-2">
              <p><strong>Total Credits Used:</strong> {creditsData.used}</p>
              <p><strong>Remaining Credits:</strong> {creditsData.remaining}</p>
              <p><strong>Worth:</strong> ${creditsData.worth.toFixed(2)}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminPayments;
