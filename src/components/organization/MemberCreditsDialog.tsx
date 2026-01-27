import { useState, useEffect } from 'react';
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
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

interface MemberCreditsDialogProps {
  member: any;
  onClose: () => void;
}

const MemberCreditsDialog = ({ member, onClose }: MemberCreditsDialogProps) => {
  const { organization, refetch } = useOrganization();
  const { toast } = useToast();
  const [allocatedCredits, setAllocatedCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setAllocatedCredits(member.allocated_credits || 0);
    }
  }, [member]);

  if (!member) return null;

  const usedCredits = member.used_credits || 0;
  const usagePercentage = allocatedCredits > 0 ? (usedCredits / allocatedCredits) * 100 : 0;
  const isLowCredits = usagePercentage > 80;
  const remainingCredits = Math.max(0, allocatedCredits - usedCredits);

  const handleSave = async () => {
    if (!organization) return;

    setLoading(true);

    const { error } = await supabase
      .from('organization_members' as any)
      .update({ 
        allocated_credits: allocatedCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', member.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update credit allocation',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Credits Updated',
        description: `Allocated ${allocatedCredits} credits to ${member.profile?.full_name || member.email}`
      });
      await refetch();
      onClose();
    }
  };

  return (
    <Dialog open={!!member} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Manage Credits
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {member.profile?.full_name || member.email}
              </span>
              {isLowCredits && allocatedCredits > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Low Credits
                </Badge>
              )}
            </div>
            {member.profile?.full_name && (
              <p className="text-sm text-muted-foreground">{member.email}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Credit Usage</span>
              <span className="font-medium">{usedCredits} / {allocatedCredits}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className={`font-medium ${isLowCredits ? 'text-amber-500' : 'text-green-500'}`}>
                {remainingCredits} credits
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credits">Allocate Credits</Label>
            <div className="flex items-center gap-2">
              <Input
                id="credits"
                type="number"
                min={usedCredits}
                value={allocatedCredits}
                onChange={(e) => setAllocatedCredits(parseInt(e.target.value) || 0)}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                from shared pool
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Organization pool: {organization?.shared_credits?.toLocaleString() || 0} credits available
            </p>
          </div>

          {allocatedCredits > 0 && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="font-medium">Credit Summary</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Allocated:</span>
                <span>{allocatedCredits}</span>
                <span className="text-muted-foreground">Used:</span>
                <span>{usedCredits}</span>
                <span className="text-muted-foreground">Available:</span>
                <span className={remainingCredits < 10 ? 'text-amber-500' : ''}>{remainingCredits}</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MemberCreditsDialog;
