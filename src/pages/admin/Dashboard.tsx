import { useState } from "react";
import { NavLink, useNavigate } from "react-router";

import AdminPageShell from "../../components/admin/AdminPageShell";
import { Alert } from "../../components/ui/Alert";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { EmptyState } from "../../components/ui/EmptyState";
import { AsyncContent } from "../../components/ui/AsyncContent";
import { useAsync } from "../../hooks/useAsync";
import { useMutation } from "../../hooks/useMutation";
import { getAllCertifications } from "../../services/certificationService";
import { getAllEducation } from "../../services/educationService";
import { getAllExperience } from "../../services/experienceService";
import { getMessages } from "../../services/messageService";
import { getProfile } from "../../services/profileService";
import { getAllProjects } from "../../services/projectService";
import { getResumes } from "../../services/resumeService";
import { getAllSkills } from "../../services/skillService";
import { getAllSocialLinks } from "../../services/socialLinkService";
import { getSiteSettings } from "../../services/settingsService";
import { seedDemoData, SEED_COUNTS, type SeedResult } from "../../services/seedService";
import type { AppError } from "../../types/common";
import type { PortfolioProfile } from "../../types/profile";
import type { Resume } from "../../types/resume";
import type { SiteSettings } from "../../types/settings";
import type { ContactMessage } from "../../types/message";

interface DashboardData {
  profile: PortfolioProfile | null;
  skills: number;
  experience: number;
  education: number;
  certifications: number;
  projects: number;
  socialLinks: number;
  resumes: Resume[];
  messages: ContactMessage[];
  settings: SiteSettings | null;
}

interface SectionCard {
  to: string;
  title: string;
  count: number;
  unit: string;
}

async function loadDashboard(): Promise<DashboardData> {
  const [
    profile,
    skills,
    experience,
    education,
    certifications,
    projects,
    socialLinks,
    resumes,
    messages,
    settings,
  ] = await Promise.all([
    getProfile(),
    getAllSkills(),
    getAllExperience(),
    getAllEducation(),
    getAllCertifications(),
    getAllProjects(),
    getAllSocialLinks(),
    getResumes(),
    getMessages(),
    getSiteSettings(),
  ]);
  return {
    profile,
    skills: skills.length,
    experience: experience.length,
    education: education.length,
    certifications: certifications.length,
    projects: projects.length,
    socialLinks: socialLinks.length,
    resumes,
    messages,
    settings,
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const dashboard = useAsync<DashboardData>(loadDashboard, []);
  const [seedConfirmOpen, setSeedConfirmOpen] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedSummary, setSeedSummary] = useState<SeedResult | null>(null);
  const seed = useMutation<void, SeedResult>(() => seedDemoData());

  const openSeedConfirm = (): void => {
    seed.reset();
    setSeedConfirmOpen(true);
  };

  const confirmSeed = async (): Promise<void> => {
    const result = await seed.execute(undefined);
    setSeedConfirmOpen(false);
    if (result.ok) {
      setSeeded(true);
      setSeedSummary(result.data);
      dashboard.reload();
    }
  };

  return (
    <AdminPageShell
      title="Dashboard"
      description="Portfolio content overview."
    >
      <AsyncContent
        state={dashboard}
        errorFallback={(error: AppError, retry: () => void) => (
          <div role="alert" className="card p-8 text-center">
            <p className="text-sm font-medium text-slate-100">{error.message}</p>
            <div className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={retry}>
                Try again
              </Button>
            </div>
          </div>
        )}
      >
        {(data) => {
          const unread = data.messages.filter((message) => !message.read).length;
          const activeResume = data.resumes.find((resume) => resume.isActive);
          const isEmptyPortfolio =
            data.profile === null &&
            data.skills === 0 &&
            data.experience === 0 &&
            data.education === 0 &&
            data.certifications === 0 &&
            data.projects === 0 &&
            data.socialLinks === 0;
          // The seeder fills whatever sample entries are still missing, so it
          // stays available as long as at least one seed document is absent.
          const anyFillableMissing =
            data.profile === null ||
            data.settings === null ||
            data.skills === 0 ||
            data.projects === 0;

          const cards: SectionCard[] = [
            { to: "/admin/profile", title: "Profile", count: data.profile === null ? 0 : 1, unit: "entry" },
            { to: "/admin/projects", title: "Projects", count: data.projects, unit: "projects" },
            { to: "/admin/skills", title: "Skills", count: data.skills, unit: "skills" },
            { to: "/admin/experience", title: "Experience", count: data.experience, unit: "entries" },
            { to: "/admin/education", title: "Education", count: data.education, unit: "entries" },
            { to: "/admin/certifications", title: "Certifications", count: data.certifications, unit: "entries" },
            { to: "/admin/social-links", title: "Social Links", count: data.socialLinks, unit: "links" },
            { to: "/admin/messages", title: "Messages", count: data.messages.length, unit: "messages" },
          ];

          return (
            <div className="space-y-6">
              {seeded && (
                <Alert tone="success">
                  Sample content loaded
                  {seedSummary !== null
                    ? ` — ${seedSummary.filled.length} added, ${seedSummary.skipped.length} already in place`
                    : ""}
                  . Open the public site to see it. Every entry is normal content:
                  edit it, publish drafts, or delete what you don't need.
                </Alert>
              )}
              {seed.error !== null && (
                <Alert tone="error">{seed.error.message}</Alert>
              )}

              {isEmptyPortfolio && (
                <EmptyState
                  title="Your portfolio has no content yet"
                  description="Start with your profile, or load a ready-made sample you can edit and replace as you go."
                  action={
                    <div className="flex flex-wrap justify-center gap-3">
                      <Button onClick={() => void navigate("/admin/profile")}>
                        Create your profile
                      </Button>
                      <Button variant="secondary" onClick={openSeedConfirm}>
                        Load sample content
                      </Button>
                    </div>
                  }
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                  <NavLink
                    key={card.to}
                    to={card.to}
                    aria-label={`${card.title}: ${card.count} ${card.unit}`}
                    className="card block p-5 transition-colors hover:border-emerald-500/40"
                  >
                    <p className="text-sm text-slate-400">{card.title}</p>
                    <p className="mt-2 font-display text-3xl font-bold tracking-[-0.02em] text-slate-100">
                      {card.count}
                      <span className="ml-1.5 font-body text-sm font-normal text-slate-500">
                        {card.unit}
                      </span>
                    </p>
                    {card.title === "Messages" && unread > 0 && (
                      <p className="mt-2 text-xs font-medium text-amber-400">
                        {unread} unread
                      </p>
                    )}
                  </NavLink>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div className="card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">Site status</p>
                    <Badge tone={data.settings?.enabled === false ? "red" : "emerald"}>
                      {data.settings === null
                        ? "not configured"
                        : data.settings.enabled
                          ? "live"
                          : "paused"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {data.settings === null
                      ? "Create site settings to control branding and homepage sections."
                      : data.settings.enabled
                        ? "Visitors see your portfolio."
                        : "Visitors see a paused notice."}
                  </p>
                  <div className="mt-4">
                    <NavLink to="/admin/settings" className="btn-secondary">
                      Open settings
                    </NavLink>
                  </div>
                </div>

                <div className="card p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-400">Resume</p>
                    <Badge tone={activeResume !== undefined ? "emerald" : "slate"}>
                      {activeResume !== undefined ? "active" : "none"}
                    </Badge>
                  </div>
                  <p className="mt-2 break-all text-sm text-slate-500">
                    {activeResume !== undefined
                      ? (activeResume.fileName ?? activeResume.downloadUrl)
                      : "No resume is available for download yet."}
                  </p>
                  <div className="mt-4">
                    <NavLink to="/admin/resume" className="btn-secondary">
                      Open resume
                    </NavLink>
                  </div>
                </div>

                <div className="card p-5">
                  <p className="text-sm text-slate-400">Quick links</p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    <li>
                      <NavLink to="/admin/contact" className="text-emerald-400 hover:text-emerald-300">
                        Contact section
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/" className="text-emerald-400 hover:text-emerald-300">
                        View public site
                      </NavLink>
                    </li>
                    {anyFillableMissing && !isEmptyPortfolio && (
                      <li className="pt-2">
                        <Button variant="secondary" onClick={openSeedConfirm}>
                          Add missing sample content
                        </Button>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {data.profile !== null && (
                <Alert tone="info">
                  Signed in — your public site shows published content only. Drafts stay
                  hidden until you publish them.
                </Alert>
              )}

              <ConfirmDialog
                open={seedConfirmOpen}
                title="Load sample content?"
                description={`Adds whatever the sample is still missing — a profile, ${SEED_COUNTS.skills} skills, ${SEED_COUNTS.projects} projects, and site settings — published immediately. Existing content is never overwritten. Experience, education, and certifications stay empty for your own entries. Everything can be edited or deleted from the admin.`}
                confirmLabel="Load sample content"
                busy={seed.status === "submitting"}
                onConfirm={() => void confirmSeed()}
                onCancel={() => setSeedConfirmOpen(false)}
              />
            </div>
          );
        }}
      </AsyncContent>
    </AdminPageShell>
  );
}
