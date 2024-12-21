import { supabase } from "@/integrations/supabase/client";

export async function getMemberByMemberId(memberId: string) {
  console.log("Looking up member with member_number:", memberId);
  
  try {
    // First try exact match
    let { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('member_number', memberId)
      .maybeSingle();

    if (error) {
      console.error("Database error when looking up member:", error);
      throw error;
    }

    if (!data) {
      // If no exact match, try case-insensitive match
      ({ data, error } = await supabase
        .from('members')
        .select('*')
        .ilike('member_number', memberId)
        .maybeSingle());

      if (error) {
        console.error("Database error when looking up member (case-insensitive):", error);
        throw error;
      }
    }

    console.log("Member lookup result:", data);
    return data;
  } catch (error) {
    console.error("Error in getMemberByMemberId:", error);
    return null;
  }
}