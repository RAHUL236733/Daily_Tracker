import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  if (!user) return null;

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white transition-all duration-150 hover:scale-105 hover:bg-indigo-600 active:scale-95"
        aria-label="Profile menu"
      >
        {initials}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-white shadow-lg dark:bg-gray-900 animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
        >
          <div className="p-3 space-y-1">
            {/* Sign Out Button */}
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
              role="menuitem"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
