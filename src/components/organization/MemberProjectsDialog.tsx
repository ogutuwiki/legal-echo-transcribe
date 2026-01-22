import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, FileAudio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MemberProjectsDialogProps {
  member: {
    user_id: string | null;
    email: string;
    profile?: { full_name: string };
  } | null;
  onClose: () => void;
}

interface Project {
  id: string;
  name: string;
  status: string;
  created_at: string;
  hearingCount: number;
}

const MemberProjectsDialog = ({ member, onClose }: MemberProjectsDialogProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!member?.user_id) return;

    const fetchProjects = async () => {
      setLoading(true);
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', member.user_id)
        .order('created_at', { ascending: false });

      if (projectsData) {
        const projectsWithCounts = await Promise.all(
          projectsData.map(async (project) => {
            const { count } = await supabase
              .from('hearings')
              .select('*', { count: 'exact', head: true })
              .eq('project_id', project.id);
            return { ...project, hearingCount: count || 0 };
          })
        );
        setProjects(projectsWithCounts);
      }
      setLoading(false);
    };

    fetchProjects();
  }, [member]);

  return (
    <Dialog open={!!member} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Projects - {member?.profile?.full_name || member?.email}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading projects...</p>
          ) : projects.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No projects yet</p>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{project.name || 'Untitled Project'}</p>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(project.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <FileAudio className="h-4 w-4" />
                      {project.hearingCount} hearings
                    </div>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {project.status || 'active'}
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

export default MemberProjectsDialog;
