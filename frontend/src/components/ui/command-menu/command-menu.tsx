import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  CommandIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  SearchIcon,
} from "lucide-react";

import { cn } from "@/utils/cn";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./primitives";

type ItemProps = {
  heading: string;
  group: {
    title: string;
    slug: string;
    shortcut?: string;
  }[];
};

export function CommandMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const ITEMS: ItemProps[] = [
    {
      heading: "Navigation",
      group: [
        { title: "Quiz", slug: "/quiz" },
        { title: "Shorts", slug: "/shorts"},
        { title: "Course Outline", slug: "/course-outline" },
        { title: "Analytics", slug: "/analytics" },
      ],
    },
  ];

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group relative flex items-center justify-between gap-4 pl-3 pr-2 py-1.5 border rounded-full text-[13px]",
          "border-gray-200 bg-white hover:bg-gray-100",
        )}
      >
        <span className="flex items-center gap-2 text-gray-500">
          <SearchIcon size={12} />
          Search
        </span>

        <CommandMenuIcon />
      </button>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput placeholder="Search pages..." />

        <CommandList className="bg-white">
          <CommandEmpty>No results found.</CommandEmpty>

          {ITEMS.map(({ heading, group }) => (
            <CommandGroup key={heading} heading={heading}>
              {group.map(({ title, slug, shortcut }) => (
                <CommandItem
                  key={title}
                  onSelect={() => {
                    navigate(slug);
                    setIsOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {title}

                  {shortcut && (
                    <div className="ml-auto flex gap-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-xs">
                        <CommandIcon size={12} />
                      </div>

                      {/* <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-xs">
                        {shortcut}
                      </div> */}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>

        <div className="flex items-center justify-between border-t border-gray-200 bg-white p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="p-1 rounded-md bg-gray-200">
                  <ArrowUpIcon size={16} />
                </div>

                <div className="p-1 rounded-md bg-gray-200">
                  <ArrowDownIcon size={16} />
                </div>
              </div>

              <span className="text-sm">Navigate</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-gray-200">Enter</div>

              <span className="text-sm">Select</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm">Close</span>

            <div className="p-1 text-xs rounded-md bg-gray-200">ESC</div>
          </div>
        </div>
      </CommandDialog>
    </>
  );
}

function CommandMenuIcon() {
  return (
    <span
      className={cn(
        "text-gray-500 border border-gray-200",
        "px-1.5 py-1 rounded-lg text-[10px] flex items-center gap-0.5",
      )}
    >
      <CommandIcon size={10} /> K
    </span>
  );
}
