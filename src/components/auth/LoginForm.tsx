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

      // First try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If sign in fails and there's no auth_user_id, try to sign up
      if (signInError && !member.auth_user_id) {
        console.log('Sign in failed, attempting signup');
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
          console.error('Sign up error:', signUpError);
          // If user exists but sign in failed, there might be a password mismatch
          if (signUpError.message.includes('already registered')) {
            throw new Error('Account exists but credentials are invalid. Please contact support.');
          }
          throw signUpError;
        }

        if (signUpData.user) {
          console.log('New account created, updating member record');
          const { error: updateError } = await supabase
            .from('members')
            .update({ auth_user_id: signUpData.user.id })
            .eq('id', member.id);

          if (updateError) {
            console.error('Error updating member with auth_user_id:', updateError);
            throw updateError;
          }

          // Try signing in again after successful signup
          const { error: finalSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (finalSignInError) {
            console.error('Final sign in error:', finalSignInError);
            throw new Error('Account created but unable to sign in. Please try again.');
          }
        }
      } else if (signInError) {
        // If sign in failed and member has auth_user_id, it's an invalid credentials error
        console.error('Sign in failed:', signInError);
        throw new Error('Invalid credentials. Please contact support.');
      }

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