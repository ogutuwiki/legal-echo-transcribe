import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Users, FolderOpen, FileAudio, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

interface Stats {
  totalMembers: number;
  totalProjects: number;
  totalHearings: number;
  sharedCredits: number;
}

const OrganizationStats = () => {
  const { organization, members } = useOrganization();
  const [stats, setStats] = useState<Stats>({
    totalMembers: 0,
    totalProjects: 0,
    totalHearings: 0,
    sharedCredits: 0
  });

  useEffect(() => {
    if (!organization) return;

    const fetchStats = async () => {
      // Count projects using raw query
      const { count: projectsCount } = await supabase
        .from('projects' as any)
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      // Count hearings
      const { count: hearingsCount } = await supabase
        .from('hearings' as any)
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id);

      setStats({
        totalMembers: members.filter(m => m.status === 'accepted').length + 1, // +1 for owner
        totalProjects: projectsCount || 0,
        totalHearings: hearingsCount || 0,
        sharedCredits: organization.shared_credits
      });
    };

    fetchStats();
  }, [organization, members]);

  const statCards = [
    { label: 'Team Members', value: stats.totalMembers, icon: Users, color: 'text-blue-500' },
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderOpen, color: 'text-green-500' },
    { label: 'Total Hearings', value: stats.totalHearings, icon: FileAudio, color: 'text-purple-500' },
    { label: 'Shared Credits', value: stats.sharedCredits.toLocaleString(), icon: CreditCard, color: 'text-amber-500' }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full bg-muted ${stat.color}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default OrganizationStats;
