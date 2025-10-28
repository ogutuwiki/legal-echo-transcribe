import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FolderOpen } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

const AdminUserProjects = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [projects, setProjects] = useState<any[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      const [profileRes, projectsRes] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('user_id', userId).single(),
        supabase.from('projects').select('*').eq('user_id', userId),
      ]);

      if (profileRes.data) setUserName(profileRes.data.full_name);
      if (projectsRes.data) {
        const projectsWithHearings = await Promise.all(
          projectsRes.data.map(async (project) => {
            const { data: hearings } = await supabase
              .from('hearings')
              .select('*')
              .eq('project_id', project.id);
            return { ...project, hearings: hearings || [] };
          })
        );
        setProjects(projectsWithHearings);
      }
    };

    if (userId && !adminLoading && isAdmin) {
      fetchData();
    }
  }, [userId, isAdmin, adminLoading, navigate]);

  if (adminLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Projects for {userName}</h1>
        </div>

        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No projects found</p>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {projects.map((project) => (
              <AccordionItem key={project.id} value={project.id}>
                <Card>
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-5 w-5" />
                        <span className="font-semibold">{project.name}</span>
                      </div>
                      <Badge>{project.hearings.length} recordings</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4">
                    <div className="space-y-2 mt-2">
                      {project.hearings.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No recordings</p>
                      ) : (
                        project.hearings.map((hearing: any) => (
                          <Card key={hearing.id} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{hearing.title || 'Untitled'}</p>
                                <p className="text-sm text-muted-foreground">
                                  Duration: {hearing.audio_duration || 'N/A'}
                                </p>
                              </div>
                              <Badge variant={hearing.status === 'completed' ? 'default' : 'secondary'}>
                                {hearing.status || 'processing'}
                              </Badge>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </Card>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
};

export default AdminUserProjects;
