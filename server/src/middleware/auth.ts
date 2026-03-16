/**
 * Auth Middleware
 *
 * Verifies Supabase JWT from the Authorization header.
 * Attaches user info to the Fastify request object.
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required',
  );
}

// Service-role client for server-side operations (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export { supabaseAdmin };

export interface AuthUser {
  id: string;
  email: string;
  tier: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  try {
    // Verify the token with Supabase
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      });
    }

    // Fetch the user's tier from our users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'User profile not found',
      });
    }

    // Attach user info to request
    request.user = {
      id: user.id,
      email: user.email ?? '',
      tier: profile.tier as string,
    };
  } catch (err) {
    request.log.error(err, 'Auth middleware error');
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}
