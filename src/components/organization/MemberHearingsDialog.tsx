import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileAudio, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MemberHearingsDialogProps {
  member: {
    user_id: string | null;
    email: string;
    profile?: { full_name: string };
  } | null;
  onClose: () => void;
}

interface Hearing {
  id: number;
  title: string;
  status: string;
  audio_duration: string | null;
  created_at: string;
  project_name: string;
}

const MemberHearingsDialog = ({ member, onClose }: MemberHearingsDialogProps) => {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member?.user_id) return;

    const fetchHearings = async () => {
      setLoading(true);
      const { data: hearingsData } = await supabase
        .from('hearings')
        .select('*, projects(name)')
        .eq('user_id', member.user_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (hearingsData) {
        const formattedHearings = hearingsData.map((h: any) => ({
          ...h,
          project_name: h.projects?.name || 'Unknown Project'
        }));
        setHearings(formattedHearings);
      }
      setLoading(false);
    };

    fetchHearings();
  }, [member]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Dialog open={!!member} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Hearings - {member?.profile?.full_name || member?.email}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading hearings...</p>
          ) : hearings.length === 0 ? (
            <Card className="p-8 text-center">
              <FileAudio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hearings yet</p>
            </Card>
          ) : (
            hearings.map((hearing) => (
              <Card key={hearing.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileAudio className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{hearing.title || 'Untitled Hearing'}</p>
                      <p className="text-sm text-muted-foreground">{hearing.project_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {hearing.audio_duration && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {hearing.audio_duration}
                      </div>
                    )}
                    <Badge variant={getStatusColor(hearing.status || 'pending')}>
                      {hearing.status || 'pending'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberHearingsDialog;
