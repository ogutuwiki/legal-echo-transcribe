import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, AlertTriangle, UserPlus, CreditCard, X } from 'lucide-react';
import { useOrganization } from '@/hooks/useOrganization';

interface Notification {
  id: string;
  type: 'low_credits' | 'member_low_credits' | 'new_member' | 'pending_invitation';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
}

const OrganizationNotifications = () => {
  const { organization, members, isOwner } = useOrganization();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    if (!organization || !isOwner) return;

    const newNotifications: Notification[] = [];

    // Check organization-level low credits
    const usedCredits = (organization as any).used_credits || 0;
    const remainingCredits = (organization.shared_credits || 0) - usedCredits;
    const creditThreshold = 100; // Could be made configurable

    if (remainingCredits < creditThreshold && remainingCredits >= 0) {
      newNotifications.push({
        id: 'org_low_credits',
        type: 'low_credits',
        title: 'Low Shared Credits',
        message: `Only ${remainingCredits} credits remaining in the organization pool.`,
        severity: remainingCredits < 20 ? 'error' : 'warning',
        timestamp: new Date()
      });
    }

    // Check member-level low credits
    members.forEach(member => {
      const memberAny = member as any;
      if (member.status === 'accepted' && memberAny.allocated_credits) {
        const memberUsed = memberAny.used_credits || 0;
        const memberRemaining = memberAny.allocated_credits - memberUsed;
        const usagePercent = (memberUsed / memberAny.allocated_credits) * 100;

        if (usagePercent > 80) {
          newNotifications.push({
            id: `member_credits_${member.id}`,
            type: 'member_low_credits',
            title: 'Member Low Credits',
            message: `${member.profile?.full_name || member.email} has used ${usagePercent.toFixed(0)}% of allocated credits (${memberRemaining} remaining).`,
            severity: usagePercent > 95 ? 'error' : 'warning',
            timestamp: new Date()
          });
        }
      }
    });

    // Check pending invitations
    const pendingCount = members.filter(m => m.status === 'pending').length;
    if (pendingCount > 0) {
      newNotifications.push({
        id: 'pending_invitations',
        type: 'pending_invitation',
        title: 'Pending Invitations',
        message: `${pendingCount} member invitation(s) are waiting for response.`,
        severity: 'info',
        timestamp: new Date()
      });
    }

    setNotifications(newNotifications.filter(n => !dismissed.includes(n.id)));
  }, [organization, members, isOwner, dismissed]);

  const dismissNotification = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'low_credits':
      case 'member_low_credits':
        return <CreditCard className="h-5 w-5" />;
      case 'new_member':
        return <UserPlus className="h-5 w-5" />;
      case 'pending_invitation':
        return <Bell className="h-5 w-5" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getSeverityStyles = (severity: Notification['severity']) => {
    switch (severity) {
      case 'error':
        return 'border-destructive/50 bg-destructive/10';
      case 'warning':
        return 'border-amber-500/50 bg-amber-500/10';
      default:
        return 'border-primary/50 bg-primary/10';
    }
  };

  const getSeverityBadge = (severity: Notification['severity']) => {
    switch (severity) {
      case 'error':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-warning/20 text-warning">Warning</Badge>;
      default:
        return <Badge variant="secondary">Info</Badge>;
    }
  };

  if (!isOwner || notifications.length === 0) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Notifications</h3>
        <Badge variant="outline">{notifications.length}</Badge>
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start gap-3 p-3 rounded-md border ${getSeverityStyles(notification.severity)}`}
          >
            <div className={notification.severity === 'error' ? 'text-destructive' : notification.severity === 'warning' ? 'text-amber-500' : 'text-primary'}>
              {notification.severity === 'error' || notification.severity === 'warning' ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                getIcon(notification.type)
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{notification.title}</span>
                {getSeverityBadge(notification.severity)}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => dismissNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default OrganizationNotifications;
