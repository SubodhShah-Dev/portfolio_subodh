import { NavLink, Outlet, useNavigate } from "react-router";

import SidebarShell from "../components/layout/SidebarShell";
import { useAuth } from "../hooks/useAuth";

/**
 * Admin CMS layout (§61) — flat grouped sidebar shared with the public site.
 *
 * Static navigation structure (system chrome, not portfolio content).
 * Rendered only inside ProtectedRoute, so the user is always a verified admin.
 */

interface NavLinkItem {
  to: string;
  label: string;
}

const portfolioLinks: readonly NavLinkItem[] = [
  { to: "/admin/profile", label: "Profile" },
  { to: "/admin/resume", label: "Resume" },
  { to: "/admin/projects", label: "Projects" },
  { to: "/admin/skills", label: "Skills" },
  { to: "/admin/experience", label: "Experience" },
  { to: "/admin/education", label: "Education" },
  { to: "/admin/certifications", label: "Certifications" },
  { to: "/admin/social-links", label: "Social Links" },
];

const websiteLinks: readonly NavLinkItem[] = [
  { to: "/admin/contact", label: "Contact" },
  { to: "/admin/messages", label: "Messages" },
  { to: "/admin/settings", label: "Settings" },
];

function itemClass(isActive: boolean): string {
  return [
    "mb-1 block rounded-lg border-l-2 px-3 py-2 text-sm transition-all duration-200",
    isActive
      ? "border-emerald-400 bg-slate-800/60 text-emerald-400"
      : "border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200",
  ].join(" ");
}

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="mt-5 mb-2 px-3 text-[11px] font-medium tracking-widest text-slate-600 uppercase">
      {children}
    </p>
  );
}

export default function AdminLayout() {
  const { user, signOutUser } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut(): Promise<void> {
    try {
      await signOutUser();
      await navigate("/admin/login", { replace: true });
    } catch {
      // Sign-out failures are rare; stay on the page so the user can retry.
    }
  }

  const brand = (
    <div>
      <p className="text-sm font-semibold text-slate-100">Portfolio CMS</p>
      {user?.email !== undefined && (
        <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
      )}
    </div>
  );

  const nav = (
    <>
      <NavLink to="/admin/dashboard" className={({ isActive }) => itemClass(isActive)}>
        Dashboard
      </NavLink>

      <GroupLabel>Portfolio</GroupLabel>
      {portfolioLinks.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => itemClass(isActive)}>
          {link.label}
        </NavLink>
      ))}

      <GroupLabel>Website</GroupLabel>
      {websiteLinks.map((link) => (
        <NavLink key={link.to} to={link.to} className={({ isActive }) => itemClass(isActive)}>
          {link.label}
        </NavLink>
      ))}

      <GroupLabel>Account</GroupLabel>
      <button
        type="button"
        onClick={() => {
          void handleSignOut();
        }}
        className="mb-1 block w-full cursor-pointer rounded-lg border-l-2 border-transparent px-3 py-2 text-left text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800/40 hover:text-slate-200"
      >
        Logout
      </button>
    </>
  );

  return (
    <SidebarShell brand={brand} nav={nav}>
      <Outlet />
    </SidebarShell>
  );
}
