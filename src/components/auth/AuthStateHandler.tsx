import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAuthStateHandler = (setIsLoggedIn: (value: boolean) => void) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log("Setting up auth state handler");
    
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log("Initial session check:", { session, error });
        
        if (error) {
          console.error("Session check error:", error);
          await handleAuthError(error);
          return;
        }
        
        if (session?.access_token && session?.refresh_token) {
          console.log("Active session found");
          setIsLoggedIn(true);
          if (window.location.pathname === "/login") {
            navigate("/admin");
          }
        } else {
          console.log("No active session");
          await handleNoSession();
        }
      } catch (error) {
        console.error("Session check failed:", error);
        await handleAuthError(error);
      }
    };

    const handleAuthError = async (error: any) => {
      console.error("Auth error:", error);
      
      // Clear any invalid session data
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      
      if (error.message?.includes("refresh_token_not_found")) {
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
      }
      
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        navigate("/login");
      }
    };

    const handleNoSession = async () => {
      setIsLoggedIn(false);
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        navigate("/login");
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", { event, session });
      
      switch (event) {
        case "SIGNED_IN":
          if (session?.access_token && session?.refresh_token) {
            console.log("Sign in event detected");
            setIsLoggedIn(true);
            toast({
              title: "Signed in successfully",
              description: "Welcome back!",
            });
            navigate("/admin");
          }
          break;
          
        case "SIGNED_OUT":
          console.log("User signed out");
          setIsLoggedIn(false);
          navigate("/login");
          break;
          
        case "TOKEN_REFRESHED":
          console.log("Token refreshed successfully");
          if (session?.access_token && session?.refresh_token) {
            setIsLoggedIn(true);
          } else {
            await handleNoSession();
          }
          break;
          
        case "USER_UPDATED":
          console.log("User data updated");
          if (session?.access_token && session?.refresh_token) {
            setIsLoggedIn(true);
          }
          break;
          
        case "INITIAL_SESSION":
          console.log("Initial session check");
          if (session?.access_token && session?.refresh_token) {
            setIsLoggedIn(true);
          } else {
            await handleNoSession();
          }
          break;
      }
    });

    return () => {
      console.log("Cleaning up auth subscription");
      subscription.unsubscribe();
    };
  }, [navigate, setIsLoggedIn, toast]);
};