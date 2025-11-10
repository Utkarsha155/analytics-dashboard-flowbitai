import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b bg-white px-6">
      {/* Page Title */}
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>

      {/* --- USER INFO (This part is updated) --- */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-800">Amit Jadhav</div>
          <div className="text-xs text-gray-500">Admin</div>
        </div>
        <Avatar className="h-10 w-10 border">
          {/* This URL will automatically generate an "AJ" avatar */}
          <AvatarImage
            src="https://eu.ui-avatars.com/api/?name=Amit+Jadhav&background=250065&color=fff&font-size=0.33"
            alt="Avatar"
          />
          {/* Fallback agar image load na ho */}
          <AvatarFallback>AJ</AvatarFallback>
        </Avatar>
      </div>
      {/* --- END UPDATE --- */}
    </header>
  );
}