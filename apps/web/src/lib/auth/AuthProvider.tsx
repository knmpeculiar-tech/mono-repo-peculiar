"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { authErrorMessage } from "./authHelpers";

type AuthResult = { error: string | null; errorCode?: string };

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    next?: string,
  ) => Promise<AuthResult & { needsEmailConfirmation: boolean }>;
  resendConfirmation: (email: string, next?: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

// Email links land on /auth/callback, which exchanges the link for a session
// cookie and then forwards to `next`. Built from the current origin so it
// works on localhost and every deployed domain — each origin must be listed
// under Supabase Auth → URL Configuration → Redirect URLs.
function callbackUrl(next: string) {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

function toResult(error: Parameters<typeof authErrorMessage>[0] | null): AuthResult {
  return error ? { error: authErrorMessage(error), errorCode: error.code } : { error: null };
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      signIn: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return toResult(error);
      },
      signUp: async (email, password, next = "/") => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl(next) },
        });
        if (error) {
          return { ...toResult(error), needsEmailConfirmation: false };
        }
        // With email confirmation on, Supabase deliberately returns a
        // success-shaped response for an already-registered address (an
        // obfuscated user with no identities) and sends no email, so the
        // user would otherwise wait forever for a link that never comes.
        if (data.user && data.user.identities?.length === 0) {
          return {
            error: authErrorMessage({ code: "user_already_exists", message: "", status: 422 }),
            errorCode: "user_already_exists",
            needsEmailConfirmation: false,
          };
        }
        return { error: null, needsEmailConfirmation: !data.session };
      },
      resendConfirmation: async (email, next = "/") => {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
          options: { emailRedirectTo: callbackUrl(next) },
        });
        return toResult(error);
      },
      requestPasswordReset: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl("/reset-password"),
        });
        return toResult(error);
      },
      updatePassword: async (password) => {
        const { error } = await supabase.auth.updateUser({ password });
        return toResult(error);
      },
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
