import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true, roles: [] });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null }));
      if (session?.user) {
        setTimeout(async () => {
          const { data } = await supabase.from("user_roles").select("role").eq("user_id", session.user!.id);
          setState((s) => ({ ...s, roles: (data ?? []).map((r) => r.role), loading: false }));
        }, 0);
      } else {
        setState((s) => ({ ...s, roles: [], loading: false }));
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setState((s) => ({ ...s, session: data.session, user: data.session?.user ?? null }));
      if (data.session?.user) {
        const { data: rs } = await supabase.from("user_roles").select("role").eq("user_id", data.session.user.id);
        setState((s) => ({ ...s, roles: (rs ?? []).map((r) => r.role), loading: false }));
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
