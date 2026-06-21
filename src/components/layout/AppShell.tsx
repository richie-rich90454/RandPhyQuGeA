import { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Home, Clock, BarChart3, Library, Settings } from "lucide-react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { cn } from "../../lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Home",
    path: "/",
    icon: <Home className="h-5 w-5" aria-hidden="true" />,
  },
  {
    label: "Practice",
    path: "/practice",
    icon: <Clock className="h-5 w-5" aria-hidden="true" />,
  },
  {
    label: "Progress",
    path: "/progress",
    icon: <BarChart3 className="h-5 w-5" aria-hidden="true" />,
  },
  {
    label: "Question Bank",
    path: "/question-bank",
    icon: <Library className="h-5 w-5" aria-hidden="true" />,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: <Settings className="h-5 w-5" aria-hidden="true" />,
  },
];

/**
 * Responsive application shell.
 *
 * On desktop (>= 768px) renders a fixed left sidebar with icon + label nav
 * items. On mobile (< 768px) renders a bottom navigation bar instead. Nested
 * route content is rendered via `<Outlet />`.
 */
export function AppShell() {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <aside className="fixed inset-y-0 left-0 z-10 flex w-64 flex-col border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <nav className="flex flex-1 flex-col gap-1 p-4">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-md border-l-4 px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary-600 text-primary-600"
                      : "border-transparent text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700"
                  )
                }
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="ml-64 h-screen overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 dark:bg-neutral-900">
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary-600"
                  : "text-neutral-600 dark:text-neutral-300"
              )
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
