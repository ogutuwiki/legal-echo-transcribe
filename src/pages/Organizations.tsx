import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useOrganization, OrganizationProvider } from '@/hooks/useOrganization';
import OrganizationStats from '@/components/organization/OrganizationStats';
import OrganizationMembers from '@/components/organization/OrganizationMembers';
import CreateOrganizationCard from '@/components/organization/CreateOrganizationCard';

const OrganizationsContent = () => {
  const navigate = useNavigate();
  const { organization, isOwner, loading } = useOrganization();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
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

        {!organization ? (
          <CreateOrganizationCard />
        ) : (
          <div className="space-y-8">
            <OrganizationStats />
            <OrganizationMembers />
          </div>
        )}
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
