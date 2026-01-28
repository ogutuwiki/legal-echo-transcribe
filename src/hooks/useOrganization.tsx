import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  shared_credits: number;
  used_credits: number;
  created_at: string;
}

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string | null;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  invited_at: string;
  joined_at: string | null;
  allocated_credits?: number;
  used_credits?: number;
  profile?: {
    full_name: string;
    title: string | null;
  };
}

interface PendingInvitation {
  id: string;
  organization_id: string;
  organization_name: string;
  invited_at: string;
}

interface MyMembership {
  id: string;
  organization_id: string;
  organization_name: string;
  is_owner: boolean;
  joined_at: string;
}

interface OrganizationContextType {
  organization: Organization | null;
  members: OrganizationMember[];
  pendingInvitations: PendingInvitation[];
  myMemberships: MyMembership[];
  isOwner: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
  createOrganization: (name: string) => Promise<{ error: any }>;
  inviteMember: (email: string) => Promise<{ error: any }>;
  removeMember: (memberId: string) => Promise<{ error: any }>;
  respondToInvitation: (invitationId: string, accept: boolean) => Promise<{ error: any }>;
  leaveOrganization: (membershipId: string) => Promise<{ error: any }>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [myMemberships, setMyMemberships] = useState<MyMembership[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch pending invitations for the current user by email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) {
        const { data: invitations } = await supabase
          .from('organization_members' as any)
          .select('id, organization_id, invited_at')
          .eq('email', authUser.email)
          .eq('status', 'pending');

        if (invitations && invitations.length > 0) {
          // Fetch organization names for pending invitations
          const invitationsWithNames = await Promise.all(
            (invitations as any[]).map(async (inv) => {
              const { data: org } = await supabase
                .from('organizations' as any)
                .select('name')
                .eq('id', inv.organization_id)
                .single();
              return {
                id: inv.id,
                organization_id: inv.organization_id,
                organization_name: (org as any)?.name || 'Unknown Organization',
                invited_at: inv.invited_at
              };
            })
          );
          setPendingInvitations(invitationsWithNames);
        } else {
          setPendingInvitations([]);
        }
      }

      // Fetch all memberships (both owned and member of)
      const memberships: MyMembership[] = [];

      // Check if user owns an organization
      const { data: orgData } = await supabase
        .from('organizations' as any)
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (orgData) {
        const org = orgData as unknown as Organization;
        setOrganization(org);
        setIsOwner(true);
        await fetchMembers(org.id);
        memberships.push({
          id: org.id,
          organization_id: org.id,
          organization_name: org.name,
          is_owner: true,
          joined_at: org.created_at
        });
      } else {
        // Check if user is a member of an organization
        const { data: membership } = await supabase
          .from('organization_members' as any)
          .select('id, organization_id, joined_at')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .maybeSingle();

        if (membership) {
          const membershipData = membership as unknown as { id: string; organization_id: string; joined_at: string };
          const { data: memberOrg } = await supabase
            .from('organizations' as any)
            .select('*')
            .eq('id', membershipData.organization_id)
            .single();

          if (memberOrg) {
            const org = memberOrg as unknown as Organization;
            setOrganization(org);
            setIsOwner(false);
            memberships.push({
              id: membershipData.id,
              organization_id: org.id,
              organization_name: org.name,
              is_owner: false,
              joined_at: membershipData.joined_at
            });
          }
        } else {
          setOrganization(null);
          setIsOwner(false);
        }
      }

      setMyMemberships(memberships);
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (orgId: string) => {
    const { data: membersData } = await supabase
      .from('organization_members' as any)
      .select('*')
      .eq('organization_id', orgId)
      .order('invited_at', { ascending: false });

    if (membersData) {
      // Fetch profiles for accepted members
      const membersWithProfiles = await Promise.all(
        (membersData as unknown as any[]).map(async (member) => {
          if (member.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, title')
              .eq('user_id', member.user_id)
              .single();
            return { ...member, profile };
          }
          return member;
        })
      );
      setMembers(membersWithProfiles as OrganizationMember[]);
    }
  };

  const createOrganization = async (name: string) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('organizations' as any)
      .insert({ name, owner_id: user.id });

    if (!error) {
      await fetchOrganization();
    }

    return { error };
  };

  const inviteMember = async (email: string) => {
    if (!organization) return { error: 'No organization' };

    const { error } = await supabase
      .from('organization_members' as any)
      .insert({
        organization_id: organization.id,
        email,
        status: 'pending'
      });

    if (!error) {
      await fetchMembers(organization.id);
    }

    return { error };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('organization_members' as any)
      .delete()
      .eq('id', memberId);

    if (!error && organization) {
      await fetchMembers(organization.id);
    }

    return { error };
  };

  const respondToInvitation = async (invitationId: string, accept: boolean) => {
    if (!user) return { error: 'Not authenticated' };

    if (accept) {
      const { error } = await supabase
        .from('organization_members' as any)
        .update({
          status: 'accepted',
          user_id: user.id,
          joined_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (!error) {
        await fetchOrganization();
      }

      return { error };
    } else {
      const { error } = await supabase
        .from('organization_members' as any)
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (!error) {
        await fetchOrganization();
      }

      return { error };
    }
  };

  const leaveOrganization = async (membershipId: string) => {
    const { error } = await supabase
      .from('organization_members' as any)
      .delete()
      .eq('id', membershipId);

    if (!error) {
      await fetchOrganization();
    }

    return { error };
  };

  useEffect(() => {
    fetchOrganization();
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        members,
        pendingInvitations,
        myMemberships,
        isOwner,
        loading,
        refetch: fetchOrganization,
        createOrganization,
        inviteMember,
        removeMember,
        respondToInvitation,
        leaveOrganization
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
