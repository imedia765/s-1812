import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid token');
    }

    const githubToken = Deno.env.get('GITHUB_PAT');
    if (!githubToken) {
      throw new Error('GitHub token not configured');
    }

    const { branch = 'main' } = await req.json();
    const repoOwner = 'imedia765';
    const repoName = 's-935078';

    // Log operation start
    await supabase.from('git_operations_logs').insert({
      operation_type: 'push',
      status: 'started',
      created_by: user.id,
      message: 'Starting push operation'
    });

    // First, get the latest commit SHA
    const shaResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/git/refs/heads/${branch}`,
      {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Supabase-Edge-Function'
        }
      }
    );

    if (!shaResponse.ok) {
      throw new Error(`GitHub API error: ${await shaResponse.text()}`);
    }

    const shaData = await shaResponse.json();
    
    // Log success
    await supabase.from('git_operations_logs').insert({
      operation_type: 'push',
      status: 'completed',
      created_by: user.id,
      message: `Successfully retrieved latest commit SHA: ${shaData.object.sha}`
    });

    return new Response(
      JSON.stringify({ success: true, data: shaData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    await supabase.from('git_operations_logs').insert({
      operation_type: 'push',
      status: 'failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});