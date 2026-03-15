import { Session } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
    });

    async function fetchInitialSession() {
      const { data } = await supabase.auth.getSession();

      if (data) {
        setSession(data.session);
      }
    }

    fetchInitialSession();

    return () => subscription.unsubscribe();
  }, []);

  return session;
}