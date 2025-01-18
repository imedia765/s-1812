import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Users, Shield, Loader2 } from 'lucide-react';
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import PrintButtons from "@/components/PrintButtons";
import { useState } from 'react';
import PaginationControls from './ui/pagination/PaginationControls';
import { Collector } from '@/types/collector';
import CollectorAccordionItem from './collectors/CollectorAccordionItem';
import { useCollectorSync } from '@/hooks/useCollectorSync';
import { useCollectorRoles } from '@/hooks/useCollectorRoles';
import RoleManagementDropdown from './collectors/RoleManagementDropdown';
import EnhancedRoleSection from './collectors/roles/EnhancedRoleSection';
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

type UserRole = Database['public']['Enums']['app_role'];

const ITEMS_PER_PAGE = 10;

const CollectorsList = () => {
  const [page, setPage] = useState(1);
  const syncRolesMutation = useCollectorSync();
  const { updateRoleMutation, updateEnhancedRoleMutation } = useCollectorRoles();
  const { toast } = useToast();

  const { data: allMembers } = useQuery({
    queryKey: ['all_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('member_number', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: paymentsData, isLoading: collectorsLoading, error: collectorsError } = useQuery({
    queryKey: ['members_collectors', page],
    queryFn: async () => {
      console.log('Fetching collectors from members_collectors...');
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data: collectorsData, error: collectorsError, count } = await supabase
        .from('members_collectors')
        .select(`
          id,
          name,
          prefix,
          number,
          email,
          phone,
          active,
          created_at,
          updated_at,
          member_number
        `, { count: 'exact' })
        .order('number', { ascending: true })
        .range(from, to);
      
      if (collectorsError) {
        console.error('Error fetching collectors:', collectorsError);
        throw collectorsError;
      }

      if (!collectorsData) return { data: [], count: 0 };

      const collectorsWithCounts = await Promise.all(collectorsData.map(async (collector) => {
        const { count } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('collector', collector.name);

        // Fetch user roles for this collector
        const { data: memberData } = await supabase
          .from('members')
          .select('auth_user_id')
          .eq('member_number', collector.member_number)
          .single();

        // Fetch enhanced roles
        const { data: enhancedRoles } = await supabase
          .from('enhanced_roles')
          .select('*')
          .eq('user_id', memberData?.auth_user_id);

        // Fetch sync status
        const { data: syncStatus } = await supabase
          .from('sync_status')
          .select('*')
          .eq('user_id', memberData?.auth_user_id)
          .single();

        let roles: UserRole[] = [];
        if (memberData?.auth_user_id) {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', memberData.auth_user_id);
          roles = rolesData?.map(r => r.role as UserRole) || [];
        }

        return {
          ...collector,
          memberCount: count || 0,
          roles,
          enhancedRoles: enhancedRoles || [],
          syncStatus
        };
      }));

      return {
        data: collectorsWithCounts,
        count: count || 0
      };
    },
  });

  const collectors = paymentsData?.data || [];
  const totalPages = Math.ceil((paymentsData?.count || 0) / ITEMS_PER_PAGE);

  const handleRoleUpdate = async (collector: Collector & { roles: UserRole[] }, role: 'collector', action: 'add' | 'remove') => {
    try {
      await updateRoleMutation.mutateAsync({ 
        userId: collector.member_number || '', 
        role, 
        action 
      });
      
      toast({
        title: "Role updated",
        description: `Successfully ${action}ed ${role} role for ${collector.name}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleEnhancedRoleUpdate = async (collector: Collector, roleName: string, isActive: boolean) => {
    try {
      await updateEnhancedRoleMutation.mutateAsync({
        userId: collector.member_number || '',
        roleName,
        isActive
      });
      toast({
        title: "Enhanced role updated",
        description: `Successfully updated ${roleName} for ${collector.name}`,
      });
    } catch (error) {
      toast({
        title: "Error updating enhanced role",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (collectorsLoading) return <div className="text-center py-4">Loading collectors...</div>;
  if (collectorsError) return <div className="text-center py-4 text-red-500">Error loading collectors: {collectorsError.message}</div>;
  if (!collectors?.length) return <div className="text-center py-4">No collectors found</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Collectors Management</h2>
        <PrintButtons allMembers={allMembers} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Collector</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles & Access</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enhanced Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sync Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {collectors.map((collector) => (
              <tr key={collector.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{collector.name}</div>
                      <div className="text-sm text-gray-500">{collector.member_number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <RoleManagementDropdown
                      currentRoles={collector.roles}
                      onRoleUpdate={(role, action) => handleRoleUpdate(collector, 'collector', action)}
                      disabled={updateRoleMutation.isPending}
                    />
                    <div className="flex flex-col space-y-1">
                      {collector.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <EnhancedRoleSection
                    collector={collector}
                    onEnhancedRoleUpdate={(roleName, isActive) => 
                      handleEnhancedRoleUpdate(collector, roleName, isActive)
                    }
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={collector.syncStatus?.status === 'success' ? 'success' : 'warning'}
                      className="text-xs"
                    >
                      {collector.syncStatus?.status || 'Not synced'}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncRolesMutation.mutate()}
                      disabled={syncRolesMutation.isPending}
                    >
                      {syncRolesMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Sync'
                      )}
                    </Button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-900"
                    onClick={() => {/* Add view details handler */}}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="py-4">
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};

export default CollectorsList;