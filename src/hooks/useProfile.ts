import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error("Failed to get session");
      }

      if (!session?.user) {
        console.log("No authenticated session found");
        throw new Error("No user found");
      }

      // Get member_number from user metadata
      const memberNumber = session.user.user_metadata?.member_number;
      if (!memberNumber) {
        console.log("No member number found in metadata");
        throw new Error("No member number found");
      }

      console.log("Fetching profile for member number:", memberNumber);

      // Fetch profile by member_number
      const { data, error } = await supabase
        .from("members")
        .select()
        .eq("member_number", memberNumber)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }

      console.log("Found profile:", data);
      return data;
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
};