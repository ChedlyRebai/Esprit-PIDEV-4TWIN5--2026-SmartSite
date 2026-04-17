import { useState, useEffect } from "react";
import {
  Link,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  redirect,
} from "react-router";
import {
  Building2,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Badge } from "../components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationCount } from "../action/notification.action";
import ChatbotWidget from "../components/Chatbot";
import { SidebarMenu } from "../components/SidebarMenu";
import type { RoleType } from "../types";
import { cn } from "@/lib/utils";
import { getCurrentUser } from "../action/auth.action";
import { getNavigationForRole } from "../utils/roleConfig";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Contournement : si le role est null, utiliser un role par défaut
  const roleName = (
    typeof user.role === "object" && user.role?.name
      ? user.role.name
      : "user"
  ) as RoleType;

  // Navigation statique basée sur le rôle
  const navigationItems = getNavigationForRole(roleName);

  const { data: currentUser } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(user),
  });

  const isInactiveAccount =
    currentUser?.status === 200 && currentUser?.data?.isActif === false;

  if (isInactiveAccount) {
    return redirect("/banned");
  }

  const { data: unredDataLength, isError: UnreadError } = useQuery({
    queryKey: ["unreadNotificationsLength"],
    queryFn: () => getUnreadNotificationCount(),
  });

  const unreadNotifications = 0;

  const getInitials = (nom: string, lastName: string) => {
    return `${nom.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (UnreadError) {
    console.error("Error fetching notifications", UnreadError);
  }
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={
                sidebarOpen ? "Close sidebar menu" : "Open sidebar menu"
              }
              aria-controls="primary-sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </Button>
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-card p-2 rounded-lg border border-border">
                {logoAvailable ? (
                  <img
                    src="/logo.png"
                    alt="SmartSite"
                    className="h-10 w-10 object-contain"
                    onError={() => setLogoAvailable(false)}
                  />
                ) : (
                  <Building2 className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent hidden sm:inline">
                SmartSite
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Date & Time */}
            <div className="hidden md:flex flex-col items-end text-sm mr-2">
              <span className="font-medium text-foreground">
                {currentTime.toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="text-muted-foreground text-xs">
                {currentTime.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Open notifications"
              onClick={() => navigate("/notifications")}
            >
              <Bell aria-hidden="true" className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
                  {unreadNotifications}
                </Badge>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white">
                      {getInitials(user?.firstName || "", user?.lastName || "")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {/* {roleLabels[user.role]} */}
                    </span>
                  </div>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 hidden md:block"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.cin}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          id="primary-sidebar"
          aria-label="Sidebar navigation"
          className={cn(
            "fixed lg:sticky top-0 left-0 z-30 h-screen w-[17rem] flex flex-col",
            "bg-sidebar text-sidebar-foreground border-r border-sidebar-border",
            "transition-transform duration-300 ease-out lg:translate-x-0",
            "pt-16 lg:pt-6 shadow-sm",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <nav className="p-4 space-y-1 overflow-y-auto flex-1">
            {navigationItems &&
              navigationItems.map((item) => {
                const isActive = location.pathname.startsWith(
                  item.href || item.children?.[0]?.href || "",
                );

                // Si l'item a des enfants, afficher le parent comme section
                if (item.children && item.children.length > 0) {
                  return (
                    <div key={item.label} className="space-y-1">
                      <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {item.label}
                      </div>
                      {item.children.map((child) => {
                        const isChildActive = location.pathname.startsWith(
                          child.href,
                        );
                        return (
                          <Link
                            key={child.href}
                            to={child.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                                flex items-center gap-3 px-4 py-2 rounded-lg transition-all ml-4
                                ${
                                  isChildActive
                                    ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md"
                                    : "text-muted-foreground hover:bg-muted"
                                }
                              `}
                          >
                            <span className="text-sm font-medium">
                              {child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                }

                // Item sans enfants
                return (
                  <Link
                    key={item.href}
                    to={item.href!}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                        ${
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-md"
                            : "text-muted-foreground hover:bg-muted"
                        }
                      `}
                  >
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
          </nav>
          <div className="p-3 mt-auto border-t border-sidebar-border bg-sidebar/95 backdrop-blur-sm">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-center gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </Button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar overlay"
            className="fixed inset-0  bg-opacity-10 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main
          id="main-content"
          data-app-content
          tabIndex={-1}
          className="flex-1 p-6 lg:p-8 outline-none"
        >
          <Outlet />
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
}
