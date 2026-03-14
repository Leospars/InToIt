import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import React, { useEffect, useState } from "react";

const Navbar = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 px-4">

      <div className="text-lg font-semibold">
        Logo
      </div>

      {
        !!session
          ? <div className="flex items-center gap-2">

            <div>Hello {session.user.user_metadata.username}!</div>

            <button
              className="inline-flex items-center justify-center bg-gray-950 text-gray-50 h-8 rounded-lg px-3 text-sm"
              onClick={signOut}
            >
              Sign out
            </button>

          </div>
          :
          <div className="flex items-center gap-2">

            <button className="inline-flex items-center justify-center bg-white text-gray-950 shadow hover:bg-gray-100 h-8 rounded-lg px-3 text-sm">
              Feedback
            </button>

            <a
              className="inline-flex items-center justify-center bg-gray-950 text-gray-50 h-8 rounded-lg px-3 text-sm"
              href="/sign-in"
            >
              Sign in
            </a>

          </div>
      }

    </header>
  );
};

export default Navbar;