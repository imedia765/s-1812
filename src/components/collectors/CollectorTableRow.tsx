import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import RoleManagementDropdown from "./RoleManagementDropdown";
import EnhancedRoleSection from "./roles/EnhancedRoleSection";
import { Collector } from "@/types/collector";
import { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['app_role'];

interface CollectorTableRowProps {
  collector: Collector;
  onRoleUpdate: (collector: Collector, role: 'collector', action: 'add' | 'remove') => void;
  onEnhancedRoleUpdate: (collector: Collector, roleName: string, isActive: boolean) => void;
  onSync: () => void;
  isSyncing: boolean;
}

const CollectorTableRow = ({
  collector,
  onRoleUpdate,
  onEnhancedRoleUpdate,
  onSync,
  isSyncing
}: CollectorTableRowProps) => {
  return (
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
            onRoleUpdate={(role, action) => onRoleUpdate(collector, 'collector', action)}
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
            onEnhancedRoleUpdate(collector, roleName, isActive)
          }
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center space-x-2">
          <Badge 
            variant={collector.syncStatus?.status === 'completed' ? 'secondary' : 'outline'}
            className="text-xs"
          >
            {collector.syncStatus?.status || 'Not synced'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
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
  );
};

export default CollectorTableRow;