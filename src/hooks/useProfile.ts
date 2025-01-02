import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.log("No authenticated session found");
          throw new Error("No user found");
        }

        console.log("Session user:", session.user);
        
        // Get member_number from user metadata
        const memberNumber = session.user.user_metadata?.member_number;
        if (!memberNumber) {
          console.log("No member number found in metadata");
          throw new Error("No member number found");
        }
        
        console.log("Fetching profile for member number:", memberNumber);
        
        // Fetch profile by member_number
        const { data: profileData, error: profileError } = await supabase
          .from("members")
          .select("*")
          .eq('member_number', memberNumber)
          .maybeSingle();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          throw profileError;
        }

        if (!profileData) {
          console.log("No profile found for member number:", memberNumber);
          return null;
        }

        console.log("Found profile:", profileData);
        return profileData;
      } catch (err) {
        console.error("Error in profile query:", err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
};