import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const LoginForm = () => {
  const [memberNumber, setMemberNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting login process for member:', memberNumber);
      
      // First, verify member exists
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, auth_user_id')
        .eq('member_number', memberNumber.toUpperCase())
        .limit(1);

      if (memberError) {
        console.error('Member verification error:', memberError);
        throw new Error('Error verifying member');
      }

      if (!members || members.length === 0) {
        console.error('Member not found');
        throw new Error('Member not found');
      }

      const member = members[0];
      console.log('Member found:', member);

      // Generate consistent email and password from member number
      const formattedMemberNumber = memberNumber.toLowerCase();
      const email = `${formattedMemberNumber}@temp.pwaburton.org`;
      const password = formattedMemberNumber;

      console.log('Attempting authentication with:', { email });

      // Try to sign up first if no auth_user_id exists
      if (!member.auth_user_id) {
        console.log('No auth_user_id found, attempting signup');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              member_number: memberNumber.toUpperCase(),
            }
          }
        });

        if (signUpError) {
          // If signup fails because user exists, proceed to sign in
          if (signUpError.message.includes('already registered')) {
            console.log('User already exists, proceeding to sign in');
          } else {
            console.error('Sign up error:', signUpError);
            throw signUpError;
          }
        } else if (signUpData.user) {
          // Update member with new auth_user_id
          const { error: updateError } = await supabase
            .from('members')
            .update({ auth_user_id: signUpData.user.id })
            .eq('id', member.id);

          if (updateError) {
            console.error('Error updating member with auth_user_id:', updateError);
            throw updateError;
          }
        }
      }

      // Always attempt to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error('Invalid credentials. Please try again or contact support.');
      }

      console.log('Sign in successful:', signInData?.user?.id);

      // If we got here, login was successful
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });

      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-dashboard-card rounded-lg shadow-lg p-8 mb-12">
      <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto">
        <div>
          <label htmlFor="memberNumber" className="block text-sm font-medium text-dashboard-text mb-2">
            Member Number
          </label>
          <Input
            id="memberNumber"
            type="text"
            value={memberNumber}
            onChange={(e) => setMemberNumber(e.target.value)}
            placeholder="Enter your member number"
            className="w-full"
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-dashboard-accent1 hover:bg-dashboard-accent1/90"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;