import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2, Plus } from 'lucide-react';
import { useOrganization, OrganizationProvider } from '@/hooks/useOrganization';
import OrganizationStats from '@/components/organization/OrganizationStats';
import OrganizationMembers from '@/components/organization/OrganizationMembers';
import OrganizationSettings from '@/components/organization/OrganizationSettings';
import OrganizationNotifications from '@/components/organization/OrganizationNotifications';
import CreateOrganizationCard from '@/components/organization/CreateOrganizationCard';
import PendingInvitations from '@/components/organization/PendingInvitations';
import MyMemberships from '@/components/organization/MyMemberships';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const OrganizationsContent = () => {
  const navigate = useNavigate();
  const { organization, isOwner, loading, pendingInvitations, myMemberships } = useOrganization();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const hasAnyContent = organization || pendingInvitations.length > 0 || myMemberships.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  {organization ? organization.name : 'Organizations'}
                </h1>
                {organization && (
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? 'Owner' : 'Member'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {!organization && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          )}
        </div>

        {/* Pending Invitations Section */}
        <PendingInvitations />

        {/* My Memberships Section (when not viewing a specific org) */}
        {!organization && <MyMemberships />}

        {/* Organization Dashboard (when user owns/is member of an org) */}
        {organization ? (
          <div className="space-y-6">
            <OrganizationNotifications />
            <OrganizationStats />
            <OrganizationMembers />
            <OrganizationSettings />
          </div>
        ) : !hasAnyContent && (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Organizations Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create an organization to collaborate with your team and share resources,
              or wait for an invitation from an existing organization.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
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
    </div>
  );
};

const Organizations = () => {
  return (
    <OrganizationProvider>
      <OrganizationsContent />
    </OrganizationProvider>
  );
};

export default Organizations;
