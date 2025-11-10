"use client"; // Client component, kyunki ise active link pata karna hai
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Folder,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils"; // shadcn ka helper

export function Sidebar() {
  const pathname = usePathname();

  // Sidebar ke links
  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoice", label: "Invoice", icon: FileText },
    { href: "/chat", label: "Chat with Data", icon: MessageCircle }, // <-- ADD THIS
    { href: "/other-files", label: "Other files", icon: Folder },
    { href: "/departments", label: "Departments", icon: Users },
    { href: "/users", label: "Users", icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      {/* Top ke links */}
      <nav className="flex flex-col items-center gap-4 px-2 py-4">
        {/* Flowbit AI Logo (Simple) */}
        <Link
          href="#"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <span className="text-sm font-bold">FA</span>
        </Link>

        {/* Navigation Links */}
        {navLinks.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
              pathname === link.href
                ? "bg-accent text-accent-foreground"
                : ""
            )}
            title={link.label} // Tooltip ke liye
          >
            <link.icon className="h-5 w-5" />
            <span className="sr-only">{link.label}</span>
          </Link>
        ))}
      </nav>

      {/* Neeche ka Settings link (Screenshot mein alag se hai) */}
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4">
        <Link
          href="/settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Link>
      </nav>
    </aside>
  );
}