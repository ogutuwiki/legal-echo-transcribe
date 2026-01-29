import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useOrganization, OrganizationProvider } from '@/hooks/useOrganization';
import OrganizationsList from '@/components/organization/OrganizationsList';
import OrganizationDetails from '@/components/organization/OrganizationDetails';

const OrganizationsContent = () => {
  const navigate = useNavigate();
  const { loading, selectOrganization, organization } = useOrganization();
  const [viewMode, setViewMode] = useState<'list' | 'details'>('list');

  const handleSelectOrganization = async (orgId: string) => {
    await selectOrganization(orgId);
    setViewMode('details');
  };

  const handleBackToList = async () => {
    await selectOrganization(null);
    setViewMode('list');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {viewMode === 'list' && (
          <>
            <div className="mb-6">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
            <OrganizationsList onSelectOrganization={handleSelectOrganization} />
          </>
        )}

        {viewMode === 'details' && organization && (
          <OrganizationDetails onBack={handleBackToList} />
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
