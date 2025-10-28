import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface UserMessagesDialogProps {
  user: any;
  onClose: () => void;
}

const UserMessagesDialog = ({ user, onClose }: UserMessagesDialogProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
  }, [user.id]);

  const handleSend = async () => {
    if (!subject || !content) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      from_admin: true,
      subject,
      content,
    });

    if (error) {
      toast({ title: 'Error sending message', variant: 'destructive' });
    } else {
      toast({ title: 'Message sent successfully' });
      setSubject('');
      setContent('');
      fetchMessages();
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Messages with {user.full_name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <ScrollArea className="h-64 border rounded-lg p-4">
            {messages.map((msg) => (
              <div key={msg.id} className="mb-4 p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold">{msg.subject}</p>
                  <Badge variant={msg.from_admin ? 'default' : 'secondary'}>
                    {msg.from_admin ? 'Admin' : 'User'}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{msg.content}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(msg.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            ))}
          </ScrollArea>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
          </div>

          <Button onClick={handleSend}>Send Message</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserMessagesDialog;
