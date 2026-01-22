import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { UserPlus, FolderOpen, FileAudio, Trash2, Mail } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import InviteMemberDialog from './InviteMemberDialog';
import MemberProjectsDialog from './MemberProjectsDialog';
import MemberHearingsDialog from './MemberHearingsDialog';

const OrganizationMembers = () => {
  const { members, isOwner, removeMember } = useOrganization();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMemberProjects, setSelectedMemberProjects] = useState<any>(null);
  const [selectedMemberHearings, setSelectedMemberHearings] = useState<any>(null);

  const handleRemove = async (memberId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the organization?`)) return;

    const { error } = await removeMember(memberId);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Member Removed',
        description: `${email} has been removed from the organization`
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Team Members</h2>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No team members yet</p>
          {isOwner && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Your First Member
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {member.profile?.full_name || member.email}
                    </p>
                    {member.profile?.full_name && (
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(member.status)}</TableCell>
                <TableCell>
                  {member.joined_at
                    ? new Date(member.joined_at).toLocaleDateString()
                    : 'Pending'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {member.status === 'accepted' && member.user_id && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMemberProjects(member)}
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMemberHearings(member)}
                        >
                          <FileAudio className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.id, member.email)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      <MemberProjectsDialog
        member={selectedMemberProjects}
        onClose={() => setSelectedMemberProjects(null)}
      />
      <MemberHearingsDialog
        member={selectedMemberHearings}
        onClose={() => setSelectedMemberHearings(null)}
      />
    </Card>
  );
};

export default OrganizationMembers;
