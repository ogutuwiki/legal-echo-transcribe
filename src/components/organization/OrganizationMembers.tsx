import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { UserPlus, FolderOpen, FileAudio, Trash2, Mail, CreditCard, AlertTriangle } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';
import { useToast } from '@/hooks/use-toast';
import InviteMemberDialog from './InviteMemberDialog';
import MemberProjectsDialog from './MemberProjectsDialog';
import MemberHearingsDialog from './MemberHearingsDialog';
import MemberCreditsDialog from './MemberCreditsDialog';
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

const OrganizationMembers = () => {
  const { members, isOwner, removeMember } = useOrganization();
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedMemberProjects, setSelectedMemberProjects] = useState<any>(null);
  const [selectedMemberHearings, setSelectedMemberHearings] = useState<any>(null);
  const [selectedMemberCredits, setSelectedMemberCredits] = useState<any>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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

  const handleBulkDelete = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const memberId of selectedMembers) {
      const { error } = await removeMember(memberId);
      if (error) {
        failCount++;
      } else {
        successCount++;
      }
    }

    setBulkDeleteOpen(false);
    setSelectedMembers([]);

    if (failCount === 0) {
      toast({
        title: 'Members Removed',
        description: `Successfully removed ${successCount} member(s)`
      });
    } else {
      toast({
        title: 'Partial Success',
        description: `Removed ${successCount} member(s), ${failCount} failed`,
        variant: 'default'
      });
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const toggleAllMembers = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(members.map(m => m.id));
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
        <div className="flex items-center gap-2">
          {isOwner && selectedMembers.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedMembers.length})
            </Button>
          )}
          {isOwner && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>
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
              {isOwner && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedMembers.length === members.length && members.length > 0}
                    onCheckedChange={toggleAllMembers}
                  />
                </TableHead>
              )}
              <TableHead>Member</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} className={selectedMembers.includes(member.id) ? 'bg-muted/50' : ''}>
                {isOwner && (
                  <TableCell>
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => toggleMemberSelection(member.id)}
                    />
                  </TableCell>
                )}
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
                  <div className="flex items-center gap-1">
                    {(member as any).allocated_credits !== undefined && (member as any).allocated_credits !== null ? (
                      <>
                        <span>{(member as any).used_credits || 0} / {(member as any).allocated_credits}</span>
                        {(member as any).allocated_credits > 0 && 
                         (((member as any).used_credits || 0) / (member as any).allocated_credits) > 0.8 && (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
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
                          title="View Projects"
                        >
                          <FolderOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMemberHearings(member)}
                          title="View Hearings"
                        >
                          <FileAudio className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {isOwner && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedMemberCredits(member)}
                          title="Manage Credits"
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.id, member.email)}
                          title="Remove Member"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
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
      <MemberCreditsDialog
        member={selectedMemberCredits}
        onClose={() => setSelectedMemberCredits(null)}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Selected Members?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMembers.length} member(s) from the organization?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Remove Members
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default OrganizationMembers;
