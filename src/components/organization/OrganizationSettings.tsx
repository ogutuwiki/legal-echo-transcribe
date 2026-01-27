import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Trash2, Save, CreditCard, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';

const OrganizationSettings = () => {
  const { organization, isOwner, refetch } = useOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [name, setName] = useState(organization?.name || '');
  const [sharedCredits, setSharedCredits] = useState(organization?.shared_credits || 0);
  const [lowCreditThreshold, setLowCreditThreshold] = useState(100);
  const [loading, setLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!organization || !isOwner) return null;

  const handleUpdate = async () => {
    setLoading(true);

    const { error } = await supabase
      .from('organizations' as any)
      .update({ 
        name: name.trim(),
        shared_credits: sharedCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', organization.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update organization',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Organization Updated',
        description: 'Your changes have been saved'
      });
      await refetch();
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    // First delete all members
    await supabase
      .from('organization_members' as any)
      .delete()
      .eq('organization_id', organization.id);

    // Then delete the organization
    const { error } = await supabase
      .from('organizations' as any)
      .delete()
      .eq('id', organization.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Organization Deleted',
        description: 'Your organization has been permanently deleted'
      });
      navigate('/');
    }
  };

  const usedCredits = (organization as any).used_credits || 0;
  const remainingCredits = sharedCredits - usedCredits;
  const isLowCredits = remainingCredits < lowCreditThreshold;

  return (
    <Card className="p-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Organization Settings</h2>
            </div>
            <span className="text-sm text-muted-foreground">
              {isOpen ? 'Hide' : 'Show'}
            </span>
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shared-credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Shared Credit Pool
              </Label>
              <Input
                id="shared-credits"
                type="number"
                min={usedCredits}
                value={sharedCredits}
                onChange={(e) => setSharedCredits(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Used: {usedCredits} | Remaining: {remainingCredits}
              </p>
            </div>
          </div>

          {isLowCredits && remainingCredits > 0 && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm">
                Low credits warning: Only {remainingCredits} credits remaining in the shared pool.
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="low-threshold">Low Credit Alert Threshold</Label>
            <Input
              id="low-threshold"
              type="number"
              min={0}
              value={lowCreditThreshold}
              onChange={(e) => setLowCreditThreshold(parseInt(e.target.value) || 0)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Show warning when remaining credits fall below this number
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Organization
            </Button>

            <Button onClick={handleUpdate} disabled={loading || !name.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{organization.name}" and remove all members.
              Projects and hearings will remain with their original owners.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Organization
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OrganizationSettings;
