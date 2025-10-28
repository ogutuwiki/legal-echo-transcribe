import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserProjectsDialogProps {
  user: any;
  onClose: () => void;
}

const UserProjectsDialog = ({ user, onClose }: UserProjectsDialogProps) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Projects for {user.full_name}</DialogTitle>
        </DialogHeader>
        <p>Projects view coming soon...</p>
      </DialogContent>
    </Dialog>
  );
};

export default UserProjectsDialog;
