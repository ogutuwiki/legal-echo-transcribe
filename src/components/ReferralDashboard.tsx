import { useState, useEffect } from 'react';
import { Copy, Gift, Users, TrendingUp, Share2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Referral {
  id: string;
  referred_user_id: string;
  referrer_credits_awarded: number;
  referred_credits_awarded: number;
  status: string;
  created_at: string;
}

const ReferralDashboard = () => {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get or generate referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('user_id', user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      } else {
        // Generate one
        const { data } = await supabase.rpc('generate_referral_code', { _user_id: user.id });
        if (data) setReferralCode(data);
      }

      // Fetch referrals
      const { data: refs } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      if (refs) setReferrals(refs);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!referralCode) return;
    const shareUrl = `${window.location.origin}/auth?ref=${referralCode}`;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCreditsEarned = referrals.reduce((sum, r) => sum + r.referrer_credits_awarded, 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
          <Gift className="h-4 w-4" />
          Referrals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="h-5 w-5 text-primary" />
            Affiliate Program
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Referral Code Card */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground mb-2">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background px-4 py-2.5 rounded-lg text-lg font-bold tracking-wider text-primary border border-primary/20">
                  {loading ? '...' : referralCode}
                </code>
                <Button onClick={copyCode} size="sm" variant="default" className="gap-1.5 shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share your link — you earn <strong className="text-primary">5 credits</strong>, they get <strong className="text-primary">3 credits</strong>!
              </p>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-emerald-500/10 border-emerald-500/20">
              <CardContent className="pt-3 pb-3 text-center">
                <Users className="h-5 w-5 mx-auto text-emerald-600 mb-1" />
                <p className="text-2xl font-bold text-emerald-700">{referrals.length}</p>
                <p className="text-xs text-emerald-600">Referrals</p>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/10 border-amber-500/20">
              <CardContent className="pt-3 pb-3 text-center">
                <TrendingUp className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-2xl font-bold text-amber-700">{totalCreditsEarned}</p>
                <p className="text-xs text-amber-600">Credits Earned</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/20">
              <CardContent className="pt-3 pb-3 text-center">
                <Share2 className="h-5 w-5 mx-auto text-blue-600 mb-1" />
                <p className="text-2xl font-bold text-blue-700">5</p>
                <p className="text-xs text-blue-600">Per Referral</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Referrals */}
          {referrals.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Recent Referrals</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                    <span className="text-muted-foreground">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      +{ref.referrer_credits_awarded} credits
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {referrals.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-4">
              No referrals yet. Share your code to start earning!
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReferralDashboard;
