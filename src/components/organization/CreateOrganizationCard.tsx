import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

const CreateOrganizationCard = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { createOrganization } = useOrganization();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const { error } = await createOrganization(name.trim());
    setLoading(false);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to create organization. Please try again.',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Organization Created',
        description: `${name} has been created successfully!`
      });
    }
  };

  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Create Your Organization</h2>
        <p className="text-muted-foreground">
          Set up an organization to collaborate with your team and share resources.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="org-name">Organization Name</Label>
          <Input
            id="org-name"
            placeholder="e.g., Smith & Associates Law Firm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Creating...' : 'Create Organization'}
        </Button>
      </form>
    </Card>
  );
};

export default CreateOrganizationCard;
