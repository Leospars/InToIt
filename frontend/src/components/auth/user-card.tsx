import { ChevronsUpDown, UserCircleIcon } from "lucide-react";
import React from "react";

type UserCardProps = {
  name: string;
  email: string;
  avatar?: string;
} & React.ComponentPropsWithoutRef<"div">;

export const UserCard = React.forwardRef<HTMLDivElement, UserCardProps>(
  ({ name, email, avatar, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex items-center justify-between w-full bg-white text-gray-950 shadow hover:bg-gray-100 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${className ?? ""}`}
        {...props}
      >
<div className="flex items-center gap-3 min-w-0">
  <div>
    <UserCircleIcon size={20} />
  </div>

  <div className="flex flex-col leading-tight min-w-0">
    <span className="font-medium truncate">{name}</span>

    <span className="text-xs text-gray-500 truncate">{email}</span>
  </div>
</div>

        <ChevronsUpDown size={16} className="text-gray-500" />
      </div>
    );
  },
);

UserCard.displayName = "UserCard";
