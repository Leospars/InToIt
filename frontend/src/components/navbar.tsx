import { CommandMenu } from "./ui/command-menu/command-menu";
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

      
          <div className="flex items-center gap-2">
{/* 
            <button className="inline-flex items-center justify-center bg-white text-gray-950 shadow hover:bg-gray-100 h-8 rounded-lg px-3 text-sm">
              Feedback
            </button> */}


            <CommandMenu />
          </div>


      
    </header >
  );
};

export default Navbar;
