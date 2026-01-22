import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Organization {
  id: string;
  name: string;
  owner_id: string;
  shared_credits: number;
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
  profile?: {
    full_name: string;
    title: string | null;
  };
}

interface OrganizationContextType {
  organization: Organization | null;
  members: OrganizationMember[];
  isOwner: boolean;
  loading: boolean;
  refetch: () => Promise<void>;
  createOrganization: (name: string) => Promise<{ error: any }>;
  inviteMember: (email: string) => Promise<{ error: any }>;
  removeMember: (memberId: string) => Promise<{ error: any }>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export const OrganizationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrganization = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
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
      } else {
        // Check if user is a member of an organization
        const { data: membership } = await supabase
          .from('organization_members' as any)
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'accepted')
          .maybeSingle();

        if (membership) {
          const membershipData = membership as unknown as { organization_id: string };
          const { data: memberOrg } = await supabase
            .from('organizations' as any)
            .select('*')
            .eq('id', membershipData.organization_id)
            .single();

          if (memberOrg) {
            setOrganization(memberOrg as unknown as Organization);
            setIsOwner(false);
          }
        }
      }
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

  useEffect(() => {
    fetchOrganization();
  }, [user]);

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        members,
        isOwner,
        loading,
        refetch: fetchOrganization,
        createOrganization,
        inviteMember,
        removeMember
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
