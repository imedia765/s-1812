import { supabase } from "@/integrations/supabase/client";

export async function getMemberByMemberId(memberId: string) {
  console.log("Looking up member with member_number:", memberId);
  
  try {
    // First try exact match
    let { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('member_number', memberId.toUpperCase().trim())
      .maybeSingle();

    if (!data && !error) {
      // If no exact match, try case-insensitive match
      ({ data, error } = await supabase
        .from('members')
        .select('*')
        .ilike('member_number', memberId.trim())
        .maybeSingle());
    }

    if (error) {
      console.error("Database error when looking up member:", error);
      throw error;
    }

    console.log("Member lookup result:", data);
    return data;
  } catch (error) {
    console.error("Error in getMemberByMemberId:", error);
    return null;
  }
}

export async function verifyMemberPassword(memberId: string, password: string) {
  const member = await getMemberByMemberId(memberId);
  
  if (!member) {
    console.log("No member found for verification");
    return false;
  }

  // For first-time login, check if password matches member number
  if (member.first_time_login) {
    return password === member.member_number;
  }

  // For returning users, verify against stored password hash
  if (member.default_password_hash) {
    const hashedPassword = await hashPassword(password);
    return hashedPassword === member.default_password_hash;
  }

  return false;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}