import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';

interface CreateOrganizationCardProps {
  onSuccess?: () => void;
}

const CreateOrganizationCard = ({ onSuccess }: CreateOrganizationCardProps) => {
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
      onSuccess?.();
    }
  };

  return (
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
  );
};

export default CreateOrganizationCard;
