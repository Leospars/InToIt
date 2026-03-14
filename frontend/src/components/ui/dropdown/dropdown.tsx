import { createContext, useContext, useState, useEffect } from "react"
import { type Variants, motion } from "framer-motion"
import { createPortal } from "react-dom"
import { cn } from "@/utils/cn"
import { Slot } from "@radix-ui/react-slot"

const content: Variants = {
  hidden: {
    clipPath: "inset(10% 50% 90% 50% round 12px)",
    opacity: 0,
  },
  show: {
    clipPath: "inset(0% 0% 0% 0% round 12px)",
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0,
      duration: 0.5,
      delayChildren: 0.15,
      staggerChildren: 0.1,
    },
  },
}

const item: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.3,
    filter: "blur(20px)",
  },
  show: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
}

type DropdownMenuProps = React.ComponentProps<"nav">

export function DropdownMenu({
  className,
  children,
  ...props
}: DropdownMenuProps) {
  return (
    <DropdownMenuProvider>
      <nav
        className={cn("relative w-full space-y-2", className)}
        {...props}
      >
        {children}
      </nav>
    </DropdownMenuProvider>
  )
}

type DropdownMenuTriggerProps = {
  asChild?: boolean
} & React.ComponentProps<"button">

export function DropdownMenuTrigger({
  asChild = false,
  children,
  className,
  ...props
}: DropdownMenuTriggerProps) {
  const {  setIsOpen, setTriggerRect } = useDropdownMenu()

  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(
        "flex w-full items-center justify-between rounded-xl border border-border bg-main-secondary px-3 py-2 ease-out",
        "duration-200 focus-visible:border-border focus-visible:outline-none active:scale-[0.97]",
        className
      )}
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setTriggerRect(rect)
        setIsOpen((prev) => !prev)
      }}
      {...props}
    >
      {children}
    </Comp>
  )
}

type DropdownMenuContentProps = React.ComponentProps<typeof motion.ul>

export function DropdownMenuContent({
  children,
  className,
  ...props
}: DropdownMenuContentProps) {
  const { isOpen, triggerRect } = useDropdownMenu()

  if (!triggerRect) return null

  const menu = (
    <motion.ul
      className={cn(
        "fixed z-50 w-[200px] flex flex-col gap-1.5 rounded-xl p-1",
        "border border-border bg-main-secondary shadow-xl bg-white ",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
        className
      )}
      style={{
        left: triggerRect.left,
        top: triggerRect.top -24,
        transform: "translateY(-100%)",
      }}
      variants={content}
      initial="hidden"
      animate={isOpen ? "show" : "hidden"}
      exit="hidden"
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.ul>
  )

  return <DropdownPortal>{menu}</DropdownPortal>
}

type DropdownMenuItemProps = {
  asChild?: boolean
} & React.ComponentProps<"button">

export function DropdownMenuItem({
  asChild = false,
  children,
  className,
  ...props
}: DropdownMenuItemProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <motion.li variants={item} transition={{ duration: 0.2 }}>
      <Comp
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border border-transparent py-1 text-primary-muted transition-colors",
          "hover:text-primary-foreground focus-visible:border-border focus-visible:text-primary-foreground focus-visible:outline-none",
          "select-none px-1.5 hover:bg-main-foreground/60 focus-visible:bg-main-foreground/60",
          className
        )}
        {...props}
      >
        {children}
      </Comp>
    </motion.li>
  )
}

type DropdownPortalProps = {
  children: React.ReactNode
  container?: HTMLElement | null
}

function DropdownPortal({
  children,
  container = typeof window !== "undefined" ? document.body : null,
}: DropdownPortalProps) {
  const [mounted, setMounted] = useState(false)
  const [portalContainer, setPortalContainer] =
    useState<HTMLElement | null>(null)

  useEffect(() => {
    setMounted(true)
    setPortalContainer(container || document.body)
    return () => setMounted(false)
  }, [container])

  if (!mounted || !portalContainer) return null

  return createPortal(children, portalContainer)
}

const Context = createContext(
  {} as {
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    triggerRect: DOMRect | null
    setTriggerRect: (rect: DOMRect | null) => void
  }
)

function DropdownMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  const value = {
    isOpen,
    setIsOpen,
    triggerRect,
    setTriggerRect,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}

function useDropdownMenu() {
  const context = useContext(Context)
  if (!context) throw new Error("DropdownMenu must be used within provider")
  return context
}
