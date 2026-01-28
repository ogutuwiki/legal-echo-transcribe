import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, LogOut, Crown } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const MyMemberships = () => {
  const { myMemberships, leaveOrganization, loading } = useOrganization();
  const { toast } = useToast();

  const handleLeave = async (membershipId: string, orgName: string) => {
    const { error } = await leaveOrganization(membershipId);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to leave organization',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Left Organization',
        description: `You have left ${orgName}`
      });
    }
  };

  if (loading || myMemberships.length === 0) return null;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">My Memberships</h2>
        <Badge variant="outline">{myMemberships.length}</Badge>
      </div>

      <div className="space-y-3">
        {myMemberships.map((membership) => (
          <div
            key={membership.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                {membership.is_owner ? (
                  <Crown className="h-5 w-5 text-primary" />
                ) : (
                  <Building2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{membership.organization_name}</p>
                  {membership.is_owner && (
                    <Badge variant="default" className="text-xs">Owner</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {membership.is_owner 
                    ? `Created ${new Date(membership.joined_at).toLocaleDateString()}`
                    : `Joined ${new Date(membership.joined_at).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
            {!membership.is_owner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LogOut className="h-4 w-4 mr-1" />
                    Leave
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Leave Organization?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to leave {membership.organization_name}? 
                      You will lose access to shared resources and will need a new invitation to rejoin.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleLeave(membership.id, membership.organization_name)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Leave Organization
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MyMemberships;
