import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Users, FolderOpen, DollarSign, Coins, Clock } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProjects: number;
  totalPayments: number;
  totalCredits: number;
  remainingCredits: number;
  totalRecordingHours: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProjects: 0,
    totalPayments: 0,
    totalCredits: 0,
    remainingCredits: 0,
    totalRecordingHours: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [usersRes, projectsRes, paymentsRes, creditsRes, hearingsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('amount'),
        supabase.from('credits').select('total_credits, remaining_credits'),
        supabase.from('hearings').select('audio_duration'),
      ]);

      const totalPayments = paymentsRes.data?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalCredits = creditsRes.data?.reduce((sum, c) => sum + c.total_credits, 0) || 0;
      const remainingCredits = creditsRes.data?.reduce((sum, c) => sum + c.remaining_credits, 0) || 0;
      
      const totalSeconds = hearingsRes.data?.reduce((sum, h) => {
        const duration = h.audio_duration || '0';
        const match = duration.match(/(\d+):(\d+):(\d+)/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const seconds = parseInt(match[3]);
          return sum + (hours * 3600 + minutes * 60 + seconds);
        }
        return sum;
      }, 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalProjects: projectsRes.count || 0,
        totalPayments,
        totalCredits,
        remainingCredits,
        totalRecordingHours: Math.round(totalSeconds / 3600 * 10) / 10,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Total Projects', value: stats.totalProjects, icon: FolderOpen },
    { label: 'Total Payments', value: `$${stats.totalPayments.toFixed(2)}`, icon: DollarSign },
    { label: 'Total Credits', value: stats.totalCredits, icon: Coins },
    { label: 'Remaining Credits', value: stats.remainingCredits, icon: Coins },
    { label: 'Recording Hours', value: `${stats.totalRecordingHours}h`, icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat) => (
        <Card key={stat.label} className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <stat.icon className="h-6 w-6 text-primary" />
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

export default AdminStats;
