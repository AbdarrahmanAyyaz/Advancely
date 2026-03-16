/**
 * API Client
 *
 * Wraps fetch calls to the Advancely server.
 * Automatically attaches the Supabase auth token.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // On device, localhost doesn't work — use the dev server host IP instead
  if (Platform.OS !== 'web') {
    const debuggerHost =
      Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:3000`;
    }
  }
  return 'http://localhost:3000';
}

const API_BASE = getApiBase();

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T;
  error?: string;
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, params } = options;

  // Get current session token
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  // Build URL with query params
  let url = `${API_BASE}${path}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new ApiError(
      json.message ?? json.error ?? 'Request failed',
      response.status,
      json,
    );
  }

  return json as ApiResponse<T>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}
