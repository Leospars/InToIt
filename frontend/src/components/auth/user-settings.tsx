import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuContent,
} from "@/components/ui/dropdown/dropdown";

import {
  LayoutGridIcon,
  UserCircleIcon,
  ChevronRightIcon,
  BellIcon,
  LogOut,
  SettingsIcon,
} from "lucide-react";

import { UserCard } from "./user-card";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Props = {
  user: User;
};

export function UserSettingsDropdown({ user }: Props) {

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UserCard
          name={user.user_metadata?.username || "User"}
          email={user.email || ""}
          avatar={user.user_metadata?.avatar_url}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent>

        <DropdownMenuItem className="group">
          <UserCircleIcon size={16} />
          <span className="flex items-center gap-1 text-sm font-medium">
            Profile
            <ChevronRightIcon
              size={12}
              className="-translate-x-1 scale-0 opacity-0 transition-all group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
            />
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem className="group">
          <SettingsIcon size={16} />
          <span className="flex items-center gap-1 text-sm font-medium">
            Settings
            <ChevronRightIcon
              size={12}
              className="-translate-x-1 scale-0 opacity-0 transition-all group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
            />
          </span>
        </DropdownMenuItem>


        <DropdownMenuItem
          onClick={handleSignOut}
          className="group !text-red-500 hover:!bg-red-600/10"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">
            Sign out
          </span>
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}
