import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Trash2, Settings, Users, Building2, CreditCard, Gift } from 'lucide-react';

interface OrgData {
  id: string;
  name: string;
  owner_id: string;
  owner_name: string;
  shared_credits: number;
  used_credits: number;
  free_credits: boolean;
  free_credits_expiry: string | null;
  member_count: number;
  project_count: number;
  created_at: string;
}

interface OrgMember {
  id: string;
  email: string;
  status: string;
  user_id: string | null;
  joined_at: string | null;
  invited_at: string;
  full_name?: string;
}

const AdminOrganizations = () => {
  const [orgs, setOrgs] = useState<OrgData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Edit dialog
  const [editOrg, setEditOrg] = useState<OrgData | null>(null);
  const [editCredits, setEditCredits] = useState(0);
  const [editFreeCredits, setEditFreeCredits] = useState(false);
  const [editFreeExpiry, setEditFreeExpiry] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteOrg, setDeleteOrg] = useState<OrgData | null>(null);

  // Members dialog
  const [membersOrg, setMembersOrg] = useState<OrgData | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchOrgs = async () => {
    setLoading(true);
    const { data: orgsData } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!orgsData) { setLoading(false); return; }

    const enriched = await Promise.all(
      orgsData.map(async (org) => {
        const [profileRes, membersRes, projectsRes] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('user_id', org.owner_id).maybeSingle(),
          supabase.from('organization_members').select('id', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'accepted'),
          supabase.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', org.id),
        ]);

        return {
          id: org.id,
          name: org.name,
          owner_id: org.owner_id,
          owner_name: profileRes.data?.full_name || 'Unknown',
          shared_credits: org.shared_credits,
          used_credits: org.used_credits,
          free_credits: org.free_credits || false,
          free_credits_expiry: org.free_credits_expiry,
          member_count: membersRes.count || 0,
          project_count: projectsRes.count || 0,
          created_at: org.created_at,
        };
      })
    );

    setOrgs(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchOrgs(); }, []);

  const openEdit = (org: OrgData) => {
    setEditOrg(org);
    setEditCredits(org.shared_credits);
    setEditFreeCredits(org.free_credits);
    setEditFreeExpiry(org.free_credits_expiry ? format(new Date(org.free_credits_expiry), "yyyy-MM-dd'T'HH:mm") : '');
  };

  const handleSave = async () => {
    if (!editOrg) return;
    setSaving(true);

    const updates: any = {
      shared_credits: editCredits,
      free_credits: editFreeCredits,
      free_credits_expiry: editFreeExpiry ? new Date(editFreeExpiry).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', editOrg.id);

    setSaving(false);

    if (error) {
      toast({ title: 'Error updating organization', variant: 'destructive' });
    } else {
      toast({ title: 'Organization updated successfully' });
      setEditOrg(null);
      fetchOrgs();
    }
  };

  const handleDelete = async () => {
    if (!deleteOrg) return;

    // Delete members first, then org
    await supabase.from('organization_members').delete().eq('organization_id', deleteOrg.id);
    const { error } = await supabase.from('organizations').delete().eq('id', deleteOrg.id);

    if (error) {
      toast({ title: 'Error deleting organization', variant: 'destructive' });
    } else {
      toast({ title: 'Organization deleted' });
      setDeleteOrg(null);
      fetchOrgs();
    }
  };

  const openMembers = async (org: OrgData) => {
    setMembersOrg(org);
    setMembersLoading(true);

    const { data: membersData } = await supabase
      .from('organization_members')
      .select('*')
      .eq('organization_id', org.id)
      .order('invited_at', { ascending: false });

    if (membersData) {
      const withNames = await Promise.all(
        membersData.map(async (m) => {
          if (m.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('user_id', m.user_id)
              .maybeSingle();
            return { ...m, full_name: profile?.full_name || 'Unknown' };
          }
          return { ...m, full_name: undefined };
        })
      );
      setMembers(withNames);
    }
    setMembersLoading(false);
  };

  return (
    <>
      {loading ? (
        <p className="text-muted-foreground text-center py-8">Loading organizations...</p>
      ) : orgs.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No organizations found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Credits (Used/Shared)</TableHead>
              <TableHead>Free Credits</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orgs.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {org.name}
                  </div>
                </TableCell>
                <TableCell>{org.owner_name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => openMembers(org)}>
                    <Users className="h-3 w-3 mr-1" />
                    {org.member_count}
                  </Badge>
                </TableCell>
                <TableCell>{org.project_count}</TableCell>
                <TableCell>
                  <span className="text-destructive font-medium">{org.used_credits}</span>
                  {' / '}
                  <span className="text-primary font-medium">{org.shared_credits}</span>
                </TableCell>
                <TableCell>
                  {org.free_credits ? (
                    <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                      <Gift className="h-3 w-3 mr-1" />
                      Active
                      {org.free_credits_expiry && (
                        <span className="ml-1 text-xs opacity-75">
                          → {format(new Date(org.free_credits_expiry), 'MMM dd')}
                        </span>
                      )}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Off</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(org.created_at), 'MMM dd, yyyy')}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(org)} title="Edit">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openMembers(org)} title="Members">
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteOrg(org)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Organization Dialog */}
      <Dialog open={!!editOrg} onOpenChange={(open) => !open && setEditOrg(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Edit: {editOrg?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-credits" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Shared Credits
              </Label>
              <Input
                id="edit-credits"
                type="number"
                min={0}
                value={editCredits}
                onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Currently used: {editOrg?.used_credits || 0}
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="free-credits" className="flex items-center gap-2">
                  <Gift className="h-4 w-4" /> Free Credits
                </Label>
                <p className="text-xs text-muted-foreground">Enable free credit access</p>
              </div>
              <Switch
                id="free-credits"
                checked={editFreeCredits}
                onCheckedChange={setEditFreeCredits}
              />
            </div>

            {editFreeCredits && (
              <div className="space-y-2">
                <Label htmlFor="free-expiry">Free Credits Expiry</Label>
                <Input
                  id="free-expiry"
                  type="datetime-local"
                  value={editFreeExpiry}
                  onChange={(e) => setEditFreeExpiry(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiry
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrg(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrg} onOpenChange={(open) => !open && setDeleteOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteOrg?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the organization and remove all members.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Dialog */}
      <Dialog open={!!membersOrg} onOpenChange={(open) => !open && setMembersOrg(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Members of {membersOrg?.name}
            </DialogTitle>
          </DialogHeader>
          {membersLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No members found.</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name / Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        {m.full_name ? (
                          <div>
                            <p className="font-medium">{m.full_name}</p>
                            <p className="text-xs text-muted-foreground">{m.email}</p>
                          </div>
                        ) : (
                          <p className="text-sm">{m.email}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={m.status === 'accepted' ? 'default' : m.status === 'pending' ? 'secondary' : 'destructive'}>
                          {m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.joined_at ? format(new Date(m.joined_at), 'MMM dd, yyyy') : 'Pending'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminOrganizations;
