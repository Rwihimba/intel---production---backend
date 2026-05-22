"use client";

import axios, { AxiosError } from "axios";
import { supabase } from "./supabase";

const baseURL = process.env.NEXT_PUBLIC_API_URL;

if (!baseURL) {
  throw new Error(
    "Missing NEXT_PUBLIC_API_URL. Set it in frontend/.env.local to the backend URL (e.g. http://localhost:3001)"
  );
}

export const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Auth-probe endpoints are expected to 401 during login bootstrap
    // (e.g. a signed-in user with no users row yet). Let callers handle
    // those locally instead of force-signing-out + redirecting.
    const url = error.config?.url ?? "";
    const isAuthProbe = url.includes("/v1/me") || url.includes("/v1/auth/");
    if (error.response?.status === 401 && !isAuthProbe) {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error.response?.data ?? error);
  }
);
