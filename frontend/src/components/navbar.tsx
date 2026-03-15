import { CommandMenu } from "./ui/command-menu/command-menu";

const Navbar = () => {
  return (
    <header className="relative flex h-16 w-full items-center border-b border-gray-200 px-4">


      <div className="text-lg font-semibold">
        IntoIt
      </div>

   
      <div className="absolute left-1/2 -translate-x-1/2">
        <CommandMenu />
      </div>

      <div className="ml-auto flex items-center gap-2">

        <button className="inline-flex items-center justify-center bg-white text-gray-950 shadow hover:bg-gray-100 h-8 rounded-lg px-3 text-sm">
          Feedback
        </button>

      </div>

    </header>
  );
};

export default Navbar;