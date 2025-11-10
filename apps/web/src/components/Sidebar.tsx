"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Folder,
  Users,
  MessageCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

function FlowbitLogo() {
  return (
    <div className="flex items-center gap-2">
      <img
        src="https://media.licdn.com/dms/image/v2/D4D0BAQF2OkxzyGCE5Q/company-logo_200_200/B4DZnDcZkQJcAM-/0/1759920626345/flowbit_ai_logo?e=2147483647&v=beta&t=pqGeLX13tftHUSDyG_uf0fdokosWbd9CnF4Jok9I9Yc"
        alt="Flowbit AI Logo"
        className="h-8 w-8 rounded"
      />
      <span className="text-lg font-bold text-gray-800">Flowbit AI</span>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/invoice", label: "Invoice", icon: FileText },
    { href: "/chat", label: "Chat with Data", icon: MessageCircle },
    { href: "/other-files", label: "Other files", icon: Folder },
    { href: "/departments", label: "Departments", icon: Users },
    { href: "/users", label: "Users", icon: Users },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 z-20 flex h-full w-60 flex-col border-r bg-white shadow-sm">
      <div className="flex items-center gap-3 px-5 py-4 border-b">
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrrNSEOfP6-8ebNg-djnorO8LYdltG-8XgTg&s"
          alt="Buchhaltung Logo"
          className="h-9 w-9 rounded-lg"
        />
        <div>
          <h2 className="text-sm font-semibold text-gray-800">Buchhaltung</h2>
          <span className="text-xs text-gray-500">12 members</span>
        </div>
      </div>
      
      <nav className="flex flex-col px-4 py-6 space-y-1 text-sm font-medium">
        <span className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
          General
        </span>
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 transition-all",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <link.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary" : "text-gray-500"
                )}
              />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t px-5 py-4">
        <FlowbitLogo />
      </div>
    </aside>
  );
}