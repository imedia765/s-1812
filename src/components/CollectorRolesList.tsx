import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface CollectorInfo {
  full_name: string;
  member_number: string;
  roles: string[];
}

const CollectorRolesList = () => {
  const { data: collectors, isLoading } = useQuery({
    queryKey: ['collectors-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select(`
          full_name,
          member_number,
          auth_user_id,
          members_collectors!inner(active)
        `)
        .eq('members_collectors.active', true);

      if (error) throw error;

      // Fetch roles for each collector
      const collectorsWithRoles = await Promise.all(
        data.map(async (collector) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', collector.auth_user_id);

          return {
            full_name: collector.full_name,
            member_number: collector.member_number,
            roles: roles?.map(r => r.role) || []
          };
        })
      );

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
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <div>
                  <p className="font-medium text-dashboard-text">{collector.full_name}</p>
                  <p className="text-sm text-dashboard-muted">Member #: {collector.member_number}</p>
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CollectorRolesList;