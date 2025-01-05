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
      console.log('Starting member fetch for collector:', collectorName);
      
      // First get the current user's role and details
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);

      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user');
      }

      // Directly fetch members for the collector
      console.log('Executing members query with collector name:', collectorName);
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select(`
          id,
          member_number,
          full_name,
          email,
          phone,
          status,
          collector
        `)
        .eq('collector', collectorName)
        .order('member_number', { ascending: true });
      
      if (membersError) {
        console.error('Error fetching members:', membersError);
        throw membersError;
      }

      console.log('Query returned members count:', membersData?.length);
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
      variant: "destructive",
    });
  }

  if (isLoading) return <div className="text-sm text-gray-400">Loading members...</div>;
  if (!members?.length) return <div className="text-sm text-gray-400">No members assigned to this collector</div>;

  return (
    <ScrollArea className="h-[400px] w-full rounded-md">
      <div className="space-y-2 pr-4">
        {members.map((member) => (
          <div 
            key={member.id}
            className="flex items-center gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-dashboard-accent1/20 flex items-center justify-center">
              <User className="w-4 h-4 text-dashboard-accent1" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{member.full_name}</p>
              <p className="text-xs text-gray-400">Member #{member.member_number}</p>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs ${
              member.status === 'active' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {member.status || 'Pending'}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default CollectorMembers;