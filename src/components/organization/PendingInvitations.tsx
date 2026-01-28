import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Check, X, Building2 } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

const PendingInvitations = () => {
  const { pendingInvitations, respondToInvitation, loading } = useOrganization();
  const { toast } = useToast();

  const handleRespond = async (invitationId: string, orgName: string, accept: boolean) => {
    const { error } = await respondToInvitation(invitationId, accept);
    
    if (error) {
      toast({
        title: 'Error',
        description: `Failed to ${accept ? 'accept' : 'decline'} invitation`,
        variant: 'destructive'
      });
    } else {
      toast({
        title: accept ? 'Invitation Accepted' : 'Invitation Declined',
        description: accept 
          ? `You have joined ${orgName}` 
          : `You have declined the invitation to ${orgName}`
      });
    }
  };

  if (loading || pendingInvitations.length === 0) return null;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Pending Invitations</h2>
        <Badge variant="secondary">{pendingInvitations.length}</Badge>
      </div>

      <div className="space-y-3">
        {pendingInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{invitation.organization_name}</p>
                <p className="text-sm text-muted-foreground">
                  Invited {new Date(invitation.invited_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRespond(invitation.id, invitation.organization_name, false)}
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                size="sm"
                onClick={() => handleRespond(invitation.id, invitation.organization_name, true)}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PendingInvitations;
