import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Building2, Users, Calendar, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrganizationCardProps {
  id: string;
  name: string;
  type: 'owned' | 'joined' | 'pending';
  date: string;
  memberCount?: number;
  onClick?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}

const OrganizationCard = ({
  id,
  name,
  type,
  date,
  memberCount,
  onClick,
  onAccept,
  onDecline
}: OrganizationCardProps) => {
  const isClickable = type !== 'pending' && onClick;
  
  const typeConfig = {
    owned: {
      label: 'Owner',
      icon: Crown,
      borderColor: 'border-l-primary',
      bgColor: 'bg-primary/5 hover:bg-primary/10',
      badgeVariant: 'default' as const,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary'
    },
    joined: {
      label: 'Member',
      icon: Building2,
      borderColor: 'border-l-success',
      bgColor: 'bg-success/5 hover:bg-success/10',
      badgeVariant: 'secondary' as const,
      iconBg: 'bg-success/10',
      iconColor: 'text-success'
    },
    pending: {
      label: 'Pending Invitation',
      icon: Users,
      borderColor: 'border-l-warning',
      bgColor: 'bg-warning/5',
      badgeVariant: 'outline' as const,
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning'
    }
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Card
      className={cn(
        'p-5 border-l-4 transition-all duration-200',
        config.borderColor,
        config.bgColor,
        isClickable && 'cursor-pointer hover:shadow-md'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={cn('p-3 rounded-xl', config.iconBg)}>
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-lg">{name}</h3>
              <Badge variant={config.badgeVariant} className="text-xs">
                {config.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {type === 'pending' ? 'Invited' : type === 'owned' ? 'Created' : 'Joined'}{' '}
                {new Date(date).toLocaleDateString()}
              </span>
              {memberCount !== undefined && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {memberCount} member{memberCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {type === 'pending' ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDecline?.();
              }}
              className="border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAccept?.();
              }}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
    </Card>
  );
};

export default OrganizationCard;
