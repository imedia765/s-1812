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
      
      // First, verify member exists and get their current status
      const { data: members, error: memberError } = await supabase
        .from('members')
        .select('id, member_number, auth_user_id, email')
        .ilike('member_number', memberNumber)
        .limit(1)
        .single();

      if (memberError) {
        console.error('Member verification error:', memberError);
        throw new Error('Error verifying member');
      }

      if (!members) {
        console.error('Member not found');
        throw new Error('Member not found. Please check your member number.');
      }

      console.log('Member found:', members);

      // Generate consistent email and password from member number
      const formattedMemberNumber = memberNumber.toLowerCase();
      const email = `${formattedMemberNumber}@temp.pwaburton.org`;
      const password = formattedMemberNumber;

      let authUser;

      // If member has no auth_user_id, try to sign up first
      if (!members.auth_user_id) {
        console.log('No auth account found, attempting signup');
        
        try {
          const signUpResult = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                member_number: memberNumber.toUpperCase(),
              }
            }
          });

          if (signUpResult.error) {
            if (!signUpResult.error.message.includes('already registered')) {
              throw signUpResult.error;
            }
            console.log('User exists but not linked, proceeding to sign in');
          } else if (signUpResult.data.user) {
            authUser = signUpResult.data.user;
            console.log('Signup successful:', authUser.id);
          }
        } catch (signUpError) {
          console.error('Signup error:', signUpError);
          throw new Error('Failed to create account. Please try again.');
        }
      }

      // Attempt to sign in
      console.log('Attempting to sign in');
      try {
        const signInResult = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInResult.error) {
          throw signInResult.error;
        }

        authUser = signInResult.data.user;
        console.log('Sign in successful:', authUser.id);
      } catch (signInError) {
        console.error('Sign in error:', signInError);
        throw new Error('Invalid credentials. If this is your first time logging in, please try again.');
      }

      // If we got here, login was successful and we have an authUser
      if (authUser && !members.auth_user_id) {
        console.log('Updating member record with auth_user_id:', authUser.id);
        const { error: updateError } = await supabase
          .from('members')
          .update({ auth_user_id: authUser.id })
          .eq('id', members.id);

        if (updateError) {
          console.error('Warning: Failed to update member auth_user_id:', updateError);
          // Don't throw error here as login was successful
        }
      }

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