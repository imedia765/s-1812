import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Database } from '@/integrations/supabase/types';
import { User } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

type Member = Database['public']['Tables']['members']['Row'];

const CollectorMembers = ({ collectorName }: { collectorName: string }) => {
  const { toast } = useToast();

  const { data: members, isLoading, error } = useQuery({
    queryKey: ['collector_members', collectorName],
    queryFn: async () => {
      console.log('Fetching members for collector:', collectorName);
      
      // First get the current user's role and details
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);

      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user');
      }

      // Get user's role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) {
        console.error('Error fetching user role:', roleError);
        throw roleError;
      }

      console.log('User role:', roleData?.role);

      // Get collector details to verify matching
      const { data: collectorData, error: collectorError } = await supabase
        .from('members_collectors')
        .select('*')
        .eq('name', collectorName)
        .single();

      if (collectorError) {
        console.error('Error fetching collector details:', collectorError);
        throw collectorError;
      }

      console.log('Collector details:', collectorData);

      // Fetch members with detailed logging
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .eq('collector', collectorName)
        .order('created_at', { ascending: false });
      
      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }

      console.log('Fetched members count:', membersData?.length);
      console.log('First few members:', membersData?.slice(0, 3));

      return membersData as Member[];
    },
    meta: {
      errorMessage: "Failed to fetch collector members"
    }
  });

  if (error) {
    console.error('Query error:', error);
    toast({
      title: "Error loading members",
      description: error.message,
      variant: "destructive"
    });
  }

  if (isLoading) return <div>Loading members...</div>;
  if (!members?.length) return <div className="text-gray-400">No members assigned to this collector</div>;

  return (
    <ScrollArea className="h-[400px] w-full rounded-md">
      <div className="space-y-2 pr-4">
        {members.map((member) => (
          <div 
            key={member.id}
            className="flex items-center gap-3 p-3 bg-black/20 rounded-lg"
          >
            <User className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-white">{member.full_name}</p>
              <p className="text-xs text-gray-400">Member #{member.member_number}</p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default CollectorMembers;