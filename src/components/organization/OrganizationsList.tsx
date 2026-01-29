import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Building2, Crown, Users, Mail } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import OrganizationCard from './OrganizationCard';
import CreateOrganizationCard from './CreateOrganizationCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OrganizationsListProps {
  onSelectOrganization: (orgId: string) => void;
}

interface OrgWithMembers {
  id: string;
  name: string;
  date: string;
  type: 'owned' | 'joined';
  memberCount: number;
}

const OrganizationsList = ({ onSelectOrganization }: OrganizationsListProps) => {
  const { 
    pendingInvitations, 
    myMemberships, 
    respondToInvitation,
    refetch 
  } = useOrganization();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [orgDetails, setOrgDetails] = useState<Record<string, number>>({});

  // Fetch member counts for each organization
  useEffect(() => {
    const fetchMemberCounts = async () => {
      const counts: Record<string, number> = {};
      for (const membership of myMemberships) {
        const { count } = await supabase
          .from('organization_members' as any)
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', membership.organization_id)
          .eq('status', 'accepted');
        counts[membership.organization_id] = (count || 0) + (membership.is_owner ? 1 : 0);
      }
      setOrgDetails(counts);
    };
    
    if (myMemberships.length > 0) {
      fetchMemberCounts();
    }
  }, [myMemberships]);

  const handleAccept = async (invitationId: string, orgName: string) => {
    const { error } = await respondToInvitation(invitationId, true);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept invitation',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Welcome!',
        description: `You have joined ${orgName}`
      });
      // After accepting, navigate to the organization
      await refetch();
      const membership = myMemberships.find(m => m.organization_name === orgName);
      if (membership) {
        onSelectOrganization(membership.organization_id);
      }
    }
  };

  const handleDecline = async (invitationId: string, orgName: string) => {
    const { error } = await respondToInvitation(invitationId, false);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline invitation',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Invitation Declined',
        description: `You have declined the invitation to ${orgName}`
      });
    }
  };

  const ownedOrgs = myMemberships.filter(m => m.is_owner);
  const joinedOrgs = myMemberships.filter(m => !m.is_owner);
  const hasContent = myMemberships.length > 0 || pendingInvitations.length > 0;

  return (
    <div className="space-y-8">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Organizations</h1>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </Button>
      </div>

      {/* Pending Invitations Section */}
      {pendingInvitations.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold">Pending Invitations</h2>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-warning/20 text-warning text-sm font-medium">
              {pendingInvitations.length}
            </span>
          </div>
          <div className="grid gap-3">
            {pendingInvitations.map((invitation) => (
              <OrganizationCard
                key={invitation.id}
                id={invitation.id}
                name={invitation.organization_name}
                type="pending"
                date={invitation.invited_at}
                onAccept={() => handleAccept(invitation.id, invitation.organization_name)}
                onDecline={() => handleDecline(invitation.id, invitation.organization_name)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Owned Organizations Section */}
      {ownedOrgs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Organizations You Own</h2>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-sm font-medium">
              {ownedOrgs.length}
            </span>
          </div>
          <div className="grid gap-3">
            {ownedOrgs.map((org) => (
              <OrganizationCard
                key={org.id}
                id={org.organization_id}
                name={org.organization_name}
                type="owned"
                date={org.joined_at}
                memberCount={orgDetails[org.organization_id] || 1}
                onClick={() => onSelectOrganization(org.organization_id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Joined Organizations Section */}
      {joinedOrgs.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-success" />
            <h2 className="text-lg font-semibold">Organizations You've Joined</h2>
            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-success/20 text-success text-sm font-medium">
              {joinedOrgs.length}
            </span>
          </div>
          <div className="grid gap-3">
            {joinedOrgs.map((org) => (
              <OrganizationCard
                key={org.id}
                id={org.organization_id}
                name={org.organization_name}
                type="joined"
                date={org.joined_at}
                memberCount={orgDetails[org.organization_id] || 1}
                onClick={() => onSelectOrganization(org.organization_id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!hasContent && (
        <div className="text-center py-16 px-4">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Organizations Yet</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create an organization to collaborate with your team and share resources,
            or wait for an invitation from an existing organization.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Organization
          </Button>
        </div>
      )}

      {/* Create Organization Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Organization</DialogTitle>
          </DialogHeader>
          <CreateOrganizationCard onSuccess={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationsList;
