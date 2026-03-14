import { NavLink } from "react-router-dom";
import { SignInDialog } from "./auth/sign-in";
import { Brain, Clapperboard, BookOpen, BarChart3 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { UserSettingsDropdown } from "./auth/user-settings";

const linkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

const inactive =
  "text-[color(display-p3_0.392_0.392_0.392)] hover:text-black hover:bg-gray-200";

const active =
  "bg-gray-200 text-black";

const Sidebar = () => {

  const { user } = useAuth();

  return (
    <aside className="hidden md:flex h-full w-56 flex-col border-r border-gray-200">
      <nav className="flex flex-col gap-1 p-3">

        <NavLink
          to="/quiz"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <Brain size={18} />
          Quiz
        </NavLink>

        <NavLink
          to="/shorts"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <Clapperboard size={18} />
          Shorts
        </NavLink>

        <NavLink
          to="/course-outline"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <BookOpen size={18} />
          Course outline
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? active : inactive}`
          }
        >
          <BarChart3 size={18} />
          Analytics
        </NavLink>

      </nav>

      <div className="mt-auto border-t border-gray-200 p-3">
  
  {user ? (
  <UserSettingsDropdown user={user}/>
  ) : (
    <SignInDialog />
  )}
</div>
   
    </aside>
  );
};

export default Sidebar;