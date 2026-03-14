import { useSession } from "@/hooks/useSession";
import { supabase } from "@/lib/supabase";

const Navbar = () => {
  const session = useSession();

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 px-4">

      <div className="text-lg font-semibold">
        IntoIt
      </div>

      {
        !!session
          ? <div className="flex items-center gap-2">

            <div>
              Hello {
                session.user.user_metadata.username
                ??
                session.user.user_metadata.full_name
                ??
                session.user.email
              }!
            </div>

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



          </div>
      }

    </header>
  );
};

export default Navbar;