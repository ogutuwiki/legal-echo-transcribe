import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, DollarSign, FolderOpen, Shield, Ban, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UserDetailsDialog from './UserDetailsDialog';
import UserPaymentsDialog from './UserPaymentsDialog';
import UserProjectsDialog from './UserProjectsDialog';
import UserMessagesDialog from './UserMessagesDialog';
import { useNavigate } from 'react-router-dom';

interface UserData {
  id: string;
  full_name: string;
  title: string;
  organization: string;
  suspended: boolean;
  role: 'admin' | 'user';
  credits: number;
  remaining_credits: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [dialogType, setDialogType] = useState<'details' | 'payments' | 'projects' | 'messages' | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    
    if (!profiles) return;

    const usersWithRoles = await Promise.all(
      profiles.map(async (profile) => {
        const [roleRes, creditsRes] = await Promise.all([
          supabase.from('user_roles').select('role').eq('user_id', profile.user_id).maybeSingle(),
          supabase.from('credits').select('total_credits, remaining_credits').eq('user_id', profile.user_id).maybeSingle(),
        ]);

        return {
          id: profile.user_id,
          full_name: profile.full_name,
          title: profile.title || '',
          organization: profile.organization || '',
          suspended: profile.suspended,
          role: roleRes.data?.role || 'user',
          credits: creditsRes.data?.total_credits || 0,
          remaining_credits: creditsRes.data?.remaining_credits || 0,
        };
      })
    );

    setUsers(usersWithRoles);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: 'admin' | 'user') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', currentRole);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });

    if (error) {
      toast({ title: 'Error updating role', variant: 'destructive' });
    } else {
      toast({ title: `Role updated to ${newRole}` });
      fetchUsers();
    }
  };

  const toggleSuspension = async (userId: string, suspended: boolean) => {
    const { error } = await supabase.from('profiles').update({ suspended: !suspended }).eq('user_id', userId);

    if (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    } else {
      toast({ title: `User ${!suspended ? 'suspended' : 'activated'}` });
      fetchUsers();
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name}</TableCell>
              <TableCell>{user.title}</TableCell>
              <TableCell>{user.organization}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>{user.remaining_credits} / {user.credits}</TableCell>
              <TableCell>
                <Badge variant={user.suspended ? 'destructive' : 'default'}>
                  {user.suspended ? 'Suspended' : 'Active'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleRole(user.id, user.role)}>
                    <Shield className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setDialogType('payments'); }}>
                    <DollarSign className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/users/${user.id}/projects`)}>
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setDialogType('messages'); }}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant={user.suspended ? 'default' : 'destructive'} onClick={() => toggleSuspension(user.id, user.suspended)}>
                    {user.suspended ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && dialogType === 'payments' && (
        <UserPaymentsDialog user={selectedUser} onClose={() => { setSelectedUser(null); setDialogType(null); }} />
      )}
      {selectedUser && dialogType === 'messages' && (
        <UserMessagesDialog user={selectedUser} onClose={() => { setSelectedUser(null); setDialogType(null); }} />
      )}
    </>
  );
};

export default AdminUsers;
