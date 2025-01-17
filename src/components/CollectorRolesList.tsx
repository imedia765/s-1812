import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import { format } from 'date-fns';

interface CollectorInfo {
  full_name: string;
  member_number: string;
  roles: string[];
  last_login?: string;
  auth_user_id: string;
}

const CollectorRolesList = () => {
  const { data: collectors, isLoading } = useQuery({
    queryKey: ['collectors-roles'],
    queryFn: async () => {
      console.log('Fetching collectors and roles data...');
      
      // First get active collectors
      const { data: activeCollectors, error: collectorsError } = await supabase
        .from('members_collectors')
        .select('member_number, name')
        .eq('active', true);

      if (collectorsError) {
        console.error('Error fetching collectors:', collectorsError);
        throw collectorsError;
      }

      console.log('Active collectors:', activeCollectors);

      // Then get member details and roles for each collector
      const collectorsWithRoles = await Promise.all(
        activeCollectors.map(async (collector) => {
          // Get member data
          const { data: memberData, error: memberError } = await supabase
            .from('members')
            .select('full_name, member_number, auth_user_id')
            .eq('member_number', collector.member_number)
            .single();

          if (memberError) {
            console.error('Error fetching member data:', memberError);
            throw memberError;
          }

          console.log('Member data:', memberData);

          // Get user roles
          const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('role, created_at')
            .eq('user_id', memberData.auth_user_id);

          if (rolesError) {
            console.error('Error fetching roles:', rolesError);
            throw rolesError;
          }

          console.log('User roles:', roles);

          // Get last login from auth.users
          const { data: authData, error: authError } = await supabase.auth.admin.getUserById(
            memberData.auth_user_id
          );

          if (authError) {
            console.error('Error fetching auth data:', authError);
          }

          console.log('Auth data:', authData);

          return {
            full_name: memberData.full_name,
            member_number: memberData.member_number,
            auth_user_id: memberData.auth_user_id,
            roles: roles?.map(r => r.role) || [],
            last_login: authData?.user?.last_sign_in_at
          };
        })
      );

      console.log('Final collectors data:', collectorsWithRoles);
      return collectorsWithRoles;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-semibold mb-4 text-dashboard-highlight">Active Collectors and Roles</h2>
      <div className="bg-dashboard-card rounded-lg p-4">
        <ul className="space-y-4">
          {collectors?.map((collector) => (
            <li 
              key={collector.member_number}
              className="border-b border-dashboard-cardBorder last:border-0 pb-3 last:pb-0"
            >
              <div className="flex flex-col space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <p className="font-medium text-dashboard-text">{collector.full_name}</p>
                    <p className="text-sm text-dashboard-muted">Member #: {collector.member_number}</p>
                    <p className="text-xs text-dashboard-muted">ID: {collector.auth_user_id}</p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <div className="flex flex-wrap gap-2">
                      {collector.roles.map((role) => (
                        <span 
                          key={role}
                          className="px-2 py-1 text-xs rounded-full bg-dashboard-accent1/20 text-dashboard-accent1"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-dashboard-muted">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Last login: {collector.last_login 
                      ? format(new Date(collector.last_login), 'PPpp')
                      : 'Never logged in'}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CollectorRolesList;