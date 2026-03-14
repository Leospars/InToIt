import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog/dialog";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {  supabase  } from "@/lib/supabase";
import { toast } from "sonner";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function SignInDialog() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isSignIn = mode === "signin";

  
  const handleSubmit = async () => {
    if (isAuthPending) return;

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    setIsAuthPending(true);

    try {
      if (!isSignIn) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });

        if (error) throw error;

        toast.success("Account created! Check your email to confirm.");
        console.log("Signup success", data);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Logged in successfully");
        console.log("Signin success", data);
      }

      setIsOpen(false);
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setIsAuthPending(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="inline-flex items-center justify-center bg-gray-950 text-gray-50 h-8 rounded-lg px-3 text-sm w-full">
        Sign in
      </DialogTrigger>

      <DialogContent className="w-full max-w-md bg-white p-6 dark:bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-zinc-900 dark:text-white">
            {isSignIn ? "Welcome back" : "Create an account"}
          </DialogTitle>

          <DialogDescription className="text-zinc-600 dark:text-zinc-400">
            {isSignIn
              ? "Login to your account and get started."
              : "Let's get you signed up and started."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 flex flex-col space-y-4">

          {/* Google Auth */}

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
          >
            <GoogleIcon />
            {isSignIn ? "Login with Google" : "Sign up with Google"}
          </button>

          {/* Divider */}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-sm text-zinc-400">or</span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Email */}



          {/* Username (signup only) */}


          <div className='flex flex-col space-y-1.5'>
            <label htmlFor='email' className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
              Email
            </label>
            <input
              id='email'
              type='email'
              placeholder='you@example.com'
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isAuthPending}
              className='h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-white/5'
            />
          </div>

          {!isSignIn && (
            <div className='flex flex-col space-y-1.5'>
              <label htmlFor='username' className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
                Username
              </label>
              <input
                id='username'
                type='text'
                placeholder={isSignIn ? 'John Doe' : 'JohnDoe'}
                value={username}
                disabled={isAuthPending}
                onChange={e => setUsername(e.target.value)}
                className='h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-white/5'
              />
            </div>
          )}


          <div className='flex flex-col space-y-1.5'>
            <label htmlFor='password' className='text-sm font-medium text-zinc-700 dark:text-zinc-300'>
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                disabled={isAuthPending}
                onChange={(e) => setPassword(e.target.value)}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 pr-9 text-sm text-zinc-900 outline-hidden focus:ring-2 focus:ring-black/5 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:focus:ring-white/5"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isAuthPending}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
            </div>
          </div>

          {/* Forgot password */}

          {isSignIn && (
            <div className="text-right -mt-2">
              <a
                href="#"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Forgot password?
              </a>
            </div>
          )}

          {/* Submit */}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isAuthPending}
            className="inline-flex items-center justify-center w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {isSignIn ? "Login" : "Sign up"}
          </button>

          {/* Toggle */}

          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {isSignIn ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              disabled={isAuthPending}
              onClick={() => setMode(isSignIn ? "signup" : "signin")}
              className="font-semibold text-zinc-900 hover:underline dark:text-white"
            >
              {isSignIn ? "Sign up" : "Login"}
            </button>
          </p>

          {/* Terms */}

          <p className="text-center text-sm text-zinc-400">
            By clicking {isSignIn ? "login" : "signing up"}, you agree to our{" "}
            <a className="underline">Terms of Service</a> and{" "}
            <a className="underline">Privacy Policy</a>
          </p>
        </div>

        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}