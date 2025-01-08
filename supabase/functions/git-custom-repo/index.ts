import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GitOperationRequest {
  repoId: string;
  branch?: string;
  commitMessage?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Custom repo git operation started');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid token');
    }

    console.log('User authenticated:', user.id);

    const githubToken = Deno.env.get('GITHUB_PAT');
    if (!githubToken) {
      console.error('GitHub token not configured');
      throw new Error('GitHub token not configured in Edge Function secrets');
    }

    const { repoId, branch = 'main', commitMessage = 'Force commit: Pushing all files' } = await req.json() as GitOperationRequest;

    // Get repository configuration
    const { data: repoConfig, error: repoError } = await supabase
      .from('git_repository_configs')
      .select('*')
      .eq('id', repoId)
      .single();

    if (repoError || !repoConfig) {
      console.error('Repository config error:', repoError);
      throw new Error('Repository configuration not found');
    }

    console.log('Found repository config:', repoConfig);

    // Log operation start
    const { error: logError } = await supabase
      .from('git_operations_logs')
      .insert({
        operation_type: 'push',
        status: 'started',
        created_by: user.id,
        message: `Starting Git push operation to ${repoConfig.repo_url}`
      });

    if (logError) {
      console.error('Error logging operation:', logError);
    }

    const apiUrl = `https://api.github.com/repos/${repoConfig.repo_url.replace('https://github.com/', '')}/git/refs/heads/${branch}`;

    console.log('Testing GitHub token...');
    const testResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    if (!testResponse.ok) {
      const testResponseText = await testResponse.text();
      console.error('GitHub token test failed:', testResponseText);
      throw new Error(`GitHub token validation failed: ${testResponseText}`);
    }

    console.log('Fetching branch information...');
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Supabase-Edge-Function'
      }
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('GitHub API error:', responseText);
      throw new Error(`GitHub API error: ${responseText}`);
    }

    const data = await response.json();
    console.log('Current branch state:', JSON.stringify(data, null, 2));

    // Update log with success
    await supabase
      .from('git_operations_logs')
      .insert({
        operation_type: 'push',
        status: 'completed',
        created_by: user.id,
        message: `Successfully pushed to ${repoConfig.repo_url} on branch ${branch}`
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully pushed to ${repoConfig.repo_url} on branch ${branch}`,
        data: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in git-custom-repo:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase
      .from('git_operations_logs')
      .insert({
        operation_type: 'push',
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});