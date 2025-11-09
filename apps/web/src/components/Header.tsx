import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {/* Page Title (Screenshot mein "Dashboard" hai) */}
      <h1 className="text-xl font-semibold">Dashboard</h1>

      {/* User Info (Right side) */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Amit Jadhav</span>
        <Avatar className="h-9 w-9">
          <AvatarImage src="/placeholder-user.jpg" alt="Avatar" />
          <AvatarFallback>AJ</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}