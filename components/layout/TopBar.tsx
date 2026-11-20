"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FaBars, FaSignOutAlt, FaUserShield } from "react-icons/fa";
import { apiService, UserAccount } from "@/lib/api-service";
import { HeaderActivity, HeaderSearch } from "./HeaderControls";

interface TopBarProps {
  onToggleSidebar?: () => void;
}

export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    apiService.auth
      .getMe()
      .then((user) => {
        if (isMounted) setCurrentUser(user);
      })
      .catch(() => {
        // Unauthenticated or error
      });

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      isMounted = false;
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.auth.logout();
    } catch {
      // Fallback
    }
    router.replace("/");
    router.refresh();
  };

  const displayName = currentUser?.name || "Admin";
  const displayRole = currentUser?.role ? currentUser.role.toUpperCase() : "ADMIN";
  const displayEmail = currentUser?.email || "admin@aldermin.edu";

  return (
    <header className="h-16 shrink-0 relative flex items-center justify-between gap-3 px-3 md:px-6 z-20 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Toggle (Visible on mobile) */}
        <button
          className="text-gray-600 text-xl md:hidden hover:text-gray-900 transition-colors p-2"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <FaBars />
        </button>
        {/* Search */}
        <HeaderSearch />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-6 shrink-0">
        {/* Notifications */}
        <HeaderActivity kind="alerts" />

        {/* Messages */}
        <HeaderActivity kind="messages" />

        {/* User Profile with Dropdown */}
        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-3 cursor-pointer p-1 pr-3 rounded-full hover:bg-gray-100/50 transition-colors border border-transparent hover:border-gray-200"
          >
            <span
              role="img"
              aria-label="User profile"
              className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center"
            >
              <FaUserShield aria-hidden="true" />
            </span>
            <span className="text-gray-700 font-medium text-sm hidden md:block">
              {displayName}
            </span>
          </div>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="font-semibold text-gray-900 text-sm truncate">
                  {displayName}
                </div>
                <div className="text-xs text-gray-400 truncate mb-1.5">
                  {displayEmail}
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary">
                  <FaUserShield size={10} />
                  {displayRole}
                </span>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium"
                >
                  <FaSignOutAlt className="text-rose-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
