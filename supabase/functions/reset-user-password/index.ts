// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define CORS headers to allow requests from your application
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Be more specific in production, e.g., 'https://your-app-domain.com'
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.info('server started');

Deno.serve(async (req: Request) => {
  // This is needed for the browser's preflight request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Get the userId and newPassword from the request body.
    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword) {
      throw new Error('User ID and new password are required.')
    }

    // 2. Create a Supabase admin client with the SERVICE_ROLE_KEY.
    // This key has admin privileges and is stored securely as an environment
    // variable in the Supabase Edge Functions runtime.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // 3. Use the admin client to update the user's password.
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      // Log the full error for server-side debugging.
      console.error('Error updating user password:', error);
      // Return a more specific error response to the client.
      return new Response(JSON.stringify({ error: error.message, details: error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 400,
      });
    }

    // 4. Return the successful response.
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // 5. Handle any unexpected errors and return a proper error response.
    console.error('Caught an unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
});
