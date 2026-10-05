import { createBrowserRouter, Navigate } from "react-router";
import { RouterProvider } from "react-router/dom";

import AdminLayout from "../layouts/AdminLayout";
import PublicLayout from "../layouts/PublicLayout";
import AdminLogin from "../pages/admin/AdminLogin";
import Home from "../pages/public/Home";
import NotFound from "../pages/public/NotFound";
import ProjectDetails from "../pages/public/ProjectDetails";
import Projects from "../pages/public/Projects";
import ProtectedRoute from "./ProtectedRoute";

/**
 * Application routes (React Router v8 data mode) — §6.
 *
 * - Public routes render inside the profile-sidebar PublicLayout.
 * - /admin/login is the only unauthenticated admin route.
 * - Every other /admin/* route passes through ProtectedRoute (auth + authz).
 * - Admin pages are lazy-loaded; public entry points stay eager (§51).
 */
const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "projects", element: <Projects /> },
      { path: "projects/:id", element: <ProjectDetails /> },
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
