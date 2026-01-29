import { Button } from '@/components/ui/button';
import { ArrowLeft, Crown, Building2, LogOut } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import OrganizationStats from './OrganizationStats';
import OrganizationMembers from './OrganizationMembers';
import OrganizationSettings from './OrganizationSettings';
import OrganizationNotifications from './OrganizationNotifications';
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

interface OrganizationDetailsProps {
  onBack: () => void;
}

const OrganizationDetails = ({ onBack }: OrganizationDetailsProps) => {
  const { organization, isOwner, leaveOrganization, myMemberships } = useOrganization();
  const { toast } = useToast();

  if (!organization) return null;

  const currentMembership = myMemberships.find(m => m.organization_id === organization.id);

  const handleLeave = async () => {
    if (!currentMembership) return;
    
    const { error } = await leaveOrganization(currentMembership.id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to leave organization',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Left Organization',
        description: `You have left ${organization.name}`
      });
      onBack();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isOwner ? 'bg-primary/10' : 'bg-success/10'}`}>
              {isOwner ? (
                <Crown className="h-7 w-7 text-primary" />
              ) : (
                <Building2 className="h-7 w-7 text-success" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{organization.name}</h1>
              <p className="text-sm text-muted-foreground">
                {isOwner ? 'You own this organization' : 'You are a member'}
              </p>
            </div>
          </div>
        </div>

        {/* Leave button for non-owners */}
        {!isOwner && currentMembership && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Leave Organization
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Organization?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave {organization.name}? 
                  You will lose access to shared resources and will need a new invitation to rejoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLeave}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Leave Organization
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Organization Content */}
      <OrganizationNotifications />
      <OrganizationStats />
      <OrganizationMembers />
      <OrganizationSettings />
    </div>
  );
};

export default OrganizationDetails;
