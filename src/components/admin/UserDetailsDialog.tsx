import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserDetailsDialogProps {
  user: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDetailsDialog = ({ user, open, onOpenChange }: UserDetailsDialogProps) => {
  const { data: projects } = useQuery({
    queryKey: ["user-projects", user?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.user_id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.user_id && open,
  });

  const { data: transcriptions } = useQuery({
    queryKey: ["user-transcriptions", user?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transcriptions")
        .select("*")
        .eq("user_id", user.user_id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.user_id && open,
  });

  const { data: payments } = useQuery({
    queryKey: ["user-payments", user?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.user_id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.user_id && open,
  });

  const totalMinutes = transcriptions?.reduce((sum, t) => sum + (t.audio_duration || 0), 0) || 0;
  const totalSpent = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user.full_name}</DialogTitle>
          <DialogDescription>{user.title}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 my-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Minutes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{Math.floor(totalMinutes / 60)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalSpent}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{projects?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="projects">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects?.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.type}</TableCell>
                    <TableCell>
                      <Badge>{project.status}</Badge>
                    </TableCell>
                    <TableCell>{project.completed_items}/{project.total_items}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="recordings">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transcriptions?.map((transcription) => (
                  <TableRow key={transcription.id}>
                    <TableCell>{transcription.title}</TableCell>
                    <TableCell>{transcription.session_type}</TableCell>
                    <TableCell>{Math.floor((transcription.audio_duration || 0) / 60)} min</TableCell>
                    <TableCell>
                      <Badge variant="default">Completed</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="payments">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.payment_type}</TableCell>
                    <TableCell>{payment.payment_method}</TableCell>
                    <TableCell>${payment.amount}</TableCell>
                    <TableCell>
                      <Badge variant={payment.status === "completed" ? "default" : "destructive"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
