import { ReactNode } from "react";

type BottomBarProps = {
  children: ReactNode;
  className?: string;
};

const BottomBar = ({ children, className }: BottomBarProps) => {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-gray-50 p-4 md:left-56 dark:border-zinc-700 dark:bg-zinc-900 ${className ?? ""}`}
      style={{ height: 75 }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-end gap-2">
        {children}
      </div>
    </div>
  );
};

export default BottomBar;