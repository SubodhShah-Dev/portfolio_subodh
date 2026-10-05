import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";

import AdminLayout from "../layouts/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
import { projectLoader, publicLayoutLoader } from "../loaders/publicLoaders";
import AdminLogin from "../pages/admin/AdminLogin";
import Home from "../pages/public/Home";
import NotFound from "../pages/public/NotFound";
import ProjectDetails from "../pages/public/ProjectDetails";
import Projects from "../pages/public/Projects";
import { PageSkeleton } from "../components/common/Skeleton";
import ProtectedRoute from "./ProtectedRoute";
import PublicErrorBoundary from "./PublicErrorBoundary";

/**
 * Application routes (React Router v8 data mode) — §6.
 *
 * - Public routes render inside the profile-sidebar PublicLayout; its loader
 *   resolves all published content once for the whole public tree.
 * - Initial loader hydration shows a skeleton instead of a blank screen (§44).
 * - Loader failures surface via PublicErrorBoundary (safe copy + retry).
 * - /admin/login is the only unauthenticated admin route.
 * - Every other /admin/* route passes through ProtectedRoute (auth + authz).
 * - Admin pages are lazy-loaded; public entry points stay eager (§51).
 */
const router = createBrowserRouter([
  {
    id: "public",
    element: <PublicLayout />,
    loader: publicLayoutLoader,
    errorElement: <PublicErrorBoundary />,
    HydrateFallback: () => (
      <div className="p-8">
        <PageSkeleton label="Loading page…" />
      </div>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "projects", element: <Projects /> },
      { path: "projects/:id", element: <ProjectDetails />, loader: projectLoader },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    path: "admin/login",
    element: <AdminLogin />,
  },
  {
    path: "admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      {
        path: "dashboard",
        lazy: async () => ({
          Component: (await import("../pages/admin/Dashboard")).default,
        }),
      },
      {
        path: "profile",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageProfile")).default,
        }),
      },
      {
        path: "resume",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageResume")).default,
        }),
      },
      {
        path: "projects",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageProjects")).default,
        }),
      },
      {
        path: "skills",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageSkills")).default,
        }),
      },
      {
        path: "experience",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageExperience")).default,
        }),
      },
      {
        path: "education",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageEducation")).default,
        }),
      },
      {
        path: "certifications",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageCertifications")).default,
        }),
      },
      {
        path: "social-links",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageSocialLinks")).default,
        }),
      },
      {
        path: "contact",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageContact")).default,
        }),
      },
      {
        path: "messages",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageMessages")).default,
        }),
      },
      {
        path: "settings",
        lazy: async () => ({
          Component: (await import("../pages/admin/ManageSettings")).default,
        }),
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
