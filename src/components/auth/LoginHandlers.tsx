import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { getMemberByMemberId } from "@/utils/memberAuth";

export const useLoginHandlers = (setIsLoggedIn: (value: boolean) => void) => {
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      console.log("Attempting email login with:", { email });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Email login error:", error);
        throw error;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Email login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
    }
  };

  const handleMemberIdSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const memberId = (formData.get("memberId") as string).toUpperCase().trim();
    const password = formData.get("password") as string;

    try {
      console.log("Attempting member ID login for:", memberId);
      const member = await getMemberByMemberId(memberId);

      if (!member) {
        throw new Error("Member ID not found");
      }

      // For first time login or if using member number as password
      if (member.first_time_login && password === member.member_number) {
        // Create auth user with temporary email
        const email = `${memberId.toLowerCase()}@temp.pwaburton.org`;
        console.log("Creating new auth user for first-time login");
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              member_id: member.id,
              member_number: member.member_number
            }
          }
        });

        if (signUpError) {
          console.error("First-time login error:", signUpError);
          throw signUpError;
        }

        // If sign up successful, attempt immediate login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error("First-time sign in error:", signInError);
          throw signInError;
        }

        toast({
          title: "First-time login successful",
          description: "Please complete your profile setup",
        });
        
        console.log("First-time login successful for member:", memberId);
        setIsLoggedIn(true);
        return;
      }

      // For returning users, attempt normal login with email
      const email = member.email;
      if (!email) throw new Error("No email associated with this member");

      console.log("Attempting login with email:", email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        throw error;
      }

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Login process error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid Member ID or password",
        variant: "destructive",
      });
    }
  };

  return {
    handleEmailSubmit,
    handleMemberIdSubmit,
  };
};