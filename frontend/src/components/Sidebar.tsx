import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Globe, LayoutDashboard, Compass, Heart, MessageCircle, GraduationCap, 
  Calendar, Users, Bot, LogOut, Menu, X, Search, Loader2, ShieldCheck
} from "lucide-react";
import { logout, getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useSocket } from "@/hooks/useSocket";

const navItems: any[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/discover", label: "Découvrir", icon: Compass },
  { to: "/matches", label: "Mes Matches", icon: Heart },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/mentors", label: "Mentors", icon: GraduationCap },
  { to: "/mentor-requests", label: "Demandes Mentor", icon: ShieldCheck, role: "mentor" },
  { to: "/events", label: "Événements", icon: Calendar },
  { to: "/groups", label: "Groupes", icon: Users },
  { to: "/assistant", label: "Assistant IA", icon: Bot },
] as const;

import { searchUsers } from "@/services/usersApi";

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const socket = useSocket();
  const [user, setUser] = useState({ name: "Étudiant", email: "" } as ReturnType<typeof getUser>);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { users } = await searchUsers(searchQuery);
        setSearchResults(users);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (pathname.startsWith("/messages")) {
      setHasUnread(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!socket) return;
    socket.on("newNotification", () => {
      if (!window.location.pathname.startsWith("/messages")) {
        setHasUnread(true);
      }
    });
    return () => { socket.off("newNotification"); };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const initials = mounted
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "ÉT";
  const displayName = mounted ? user.name : "Étudiant";

  const NavContent = (
    <>
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Globe className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight">StudentConnect</span>
      </div>

      {/* Global Search */}
      <div className="px-4 mb-4 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-primary transition-all"
          />
        </div>
        
        {/* Search Results Dropdown */}
        {(isSearching || searchResults.length > 0) && (
          <div className="absolute left-4 right-4 top-full z-50 mt-1 rounded-xl border bg-card p-1 shadow-xl animate-in fade-in slide-in-from-top-2">
            {isSearching ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      navigate({ to: "/profile/$id", params: { id: res.id } });
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
                      {res.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{res.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{res.major || "Étudiant"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems
          .filter(it => !it.role || it.role === user.role)
          .map((it) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => setOpen(false)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-4 w-4" />
                {it.label === "Messages" && hasUnread && (
                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive shadow-[0_0_0_2px_white]" />
                )}
              </div>
              {it.label}
              {it.label === "Messages" && hasUnread && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-destructive" />
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <Link
          to="/profile/me"
          onClick={() => setOpen(false)}
          className="mb-2 flex items-center gap-3 rounded-lg p-2 hover:bg-accent"
        >
          <div suppressHydrationWarning className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {initials || "ÉT"}
          </div>
          <div className="min-w-0 flex-1">
            <p suppressHydrationWarning className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">Mon profil</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Globe className="h-4 w-4" />
          </div>
          <span className="font-bold">StudentConnect</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 hover:bg-accent"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-sidebar md:flex">
        {NavContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-xl animate-fade-in">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 hover:bg-accent"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
            {NavContent}
          </aside>
        </div>
      )}
    </>
  );
}
