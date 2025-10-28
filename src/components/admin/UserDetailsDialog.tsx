import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserDetailsDialogProps {
  user: any;
  onClose: () => void;
}

const UserDetailsDialog = ({ user, onClose }: UserDetailsDialogProps) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{user.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="font-medium">{user.title}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Organization</p>
            <p className="font-medium">{user.organization}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium">{user.role}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Credits</p>
            <p className="font-medium">{user.remaining_credits} / {user.credits}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="font-medium">{user.suspended ? 'Suspended' : 'Active'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsDialog;
