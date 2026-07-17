#!/usr/bin/env node
/**
 * Student LMS routing health-check.
 *
 * Verifies the critical Student LMS journey is wired end-to-end:
 *
 *   Sign Up / Login → Dashboard → My Courses → Open Course →
 *   Continue Learning → Assignments → Projects → Live Classes →
 *   Certificates → Resume Builder → Career → Support → Logout
 *
 * The script is filesystem-only (no server needed) so it is safe to
 * run in CI. It fails the build when:
 *
 *   1. A required Student LMS route file is missing.
 *   2. A route file does not register the expected createFileRoute id.
 *   3. A route that should be gated is NOT under `_authenticated/`.
 *   4. The `_authenticated` layout is missing its auth guard
 *      (beforeLoad + redirect to /auth).
 *   5. The `/student` layout is missing its role gate
 *      (fetchUserRoles / dashboardPathForRole redirect).
 *   6. `/auth` or `/student/index` no longer redirect signed-in
 *      students to `/student/dashboard`.
 *   7. A student route hardcodes a `redirect({ to: "/dashboard" })`
 *      or similar wrong-role destination.
 *
 * Add new required routes to REQUIRED below. Anything not listed is
 * ignored — this keeps the check focused on the critical journey.
 */
import { readFileSync, existsSync } from "node:fs";

const errors = [];
const ok = (m) => console.log(`  ✓ ${m}`);
const fail = (m) => {
  errors.push(m);
  console.log(`  ✖ ${m}`);
};

const ROUTES_DIR = "src/routes";
const AUTH_DIR = `${ROUTES_DIR}/_authenticated`;

// ── Required Student LMS routes ────────────────────────────────
// file          — path under src/routes/
// id            — expected createFileRoute("<id>") string
// gated         — must live under _authenticated/
// step          — short label for the journey step
const REQUIRED = [
  { step: "Auth entry",            file: "auth.tsx",                                  id: "/auth",                                gated: false },
  { step: "Student layout",        file: "_authenticated/student.tsx",                id: "/_authenticated/student",              gated: true  },
  { step: "Post-login redirect",   file: "_authenticated/student.index.tsx",          id: "/_authenticated/student/",             gated: true  },
  { step: "Dashboard",             file: "_authenticated/student.dashboard.tsx",      id: "/_authenticated/student/dashboard",    gated: true  },
  { step: "My Courses",            file: "_authenticated/student.courses.tsx",        id: "/_authenticated/student/courses",      gated: true  },
  { step: "My Programs list",      file: "_authenticated/student.programs.index.tsx", id: "/_authenticated/student/programs/",    gated: true  },
  { step: "Open enrolled course",  file: "_authenticated/student.programs.view.$slug.tsx", id: "/_authenticated/student/programs/view/$slug", gated: true },
  { step: "Continue Learning",     file: "_authenticated/student.learn.index.tsx",    id: "/_authenticated/student/learn/",       gated: true  },
  { step: "Learning player",       file: "_authenticated/student.learn.$slug.tsx",    id: "/_authenticated/student/learn/$slug",  gated: true  },
  { step: "Assignments",           file: "_authenticated/student.assignments.index.tsx", id: "/_authenticated/student/assignments/", gated: true },
  { step: "Projects",              file: "_authenticated/student.projects.index.tsx", id: "/_authenticated/student/projects/",    gated: true  },
  { step: "Live Classes",          file: "_authenticated/student.live-sessions.index.tsx", id: "/_authenticated/student/live-sessions/", gated: true },
  { step: "Certificates",          file: "_authenticated/student.certificates.tsx",   id: "/_authenticated/student/certificates", gated: true  },
  { step: "Resume Builder",        file: "_authenticated/student.career.resume.tsx",  id: "/_authenticated/student/career/resume", gated: true },
  { step: "Career Center",         file: "_authenticated/student.career.index.tsx",   id: "/_authenticated/student/career/",      gated: true  },
  { step: "Support",               file: "_authenticated/student.support.index.tsx",  id: "/_authenticated/student/support/",     gated: true  },
  { step: "Profile / Logout",      file: "_authenticated/student.profile.tsx",        id: "/_authenticated/student/profile",      gated: true  },
];

// ── 1. Required route files + createFileRoute ids ──────────────
console.log("\n[1/5] Required Student LMS route files");
const contents = new Map();
for (const r of REQUIRED) {
  const full = `${ROUTES_DIR}/${r.file}`;
  if (!existsSync(full)) {
    fail(`${r.step}: missing ${full}`);
    continue;
  }
  const src = readFileSync(full, "utf8");
  contents.set(r.file, src);

  const escaped = r.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const idRe = new RegExp(`createFileRoute\\(["']${escaped}["']\\)`);

  if (!idRe.test(src)) {
    fail(`${r.step}: ${full} does not register createFileRoute("${r.id}")`);
  } else {
    ok(`${r.step} → ${r.id}`);
  }

  if (r.gated && !r.file.startsWith("_authenticated/")) {
    fail(`${r.step}: ${r.file} must live under _authenticated/`);
  }
}

// ── 2. _authenticated layout enforces auth ─────────────────────
console.log("\n[2/5] _authenticated layout auth guard");
const authLayoutPath = `${AUTH_DIR}/route.tsx`;
if (!existsSync(authLayoutPath)) {
  fail(`missing ${authLayoutPath} — protected routes have no guard`);
} else {
  const src = readFileSync(authLayoutPath, "utf8");
  const checks = [
    { re: /createFileRoute\(["']\/_authenticated["']\)/, msg: "registers /_authenticated" },
    { re: /beforeLoad\s*:/,                              msg: "declares beforeLoad" },
    { re: /supabase\.auth\.getUser\s*\(/,                msg: "verifies session with getUser()" },
    { re: /redirect\(\s*\{\s*to\s*:\s*["']\/auth["']/,   msg: "redirects unauth users to /auth" },
  ];
  for (const c of checks) c.re.test(src) ? ok(c.msg) : fail(`_authenticated: ${c.msg} not found`);
}

// ── 3. /student layout enforces role gate ──────────────────────
console.log("\n[3/5] /student layout role gate");
const studentLayout = contents.get("_authenticated/student.tsx");
if (studentLayout) {
  const checks = [
    { re: /beforeLoad\s*:/,               msg: "declares beforeLoad" },
    { re: /fetchUserRoles\s*\(/,          msg: "fetches user roles" },
    { re: /["']student["']/,              msg: "allows 'student' role" },
    { re: /dashboardPathForRole\s*\(/,    msg: "redirects wrong roles to their dashboard" },
  ];
  for (const c of checks) c.re.test(studentLayout) ? ok(c.msg) : fail(`/student layout: ${c.msg} not found`);
}

// ── 4. Post-login lands on /student/dashboard ──────────────────
console.log("\n[4/5] Post-login redirect targets /student/dashboard");
const studentIndex = contents.get("_authenticated/student.index.tsx");
if (studentIndex) {
  /redirect\(\s*\{\s*to\s*:\s*["']\/student\/dashboard["']/.test(studentIndex)
    ? ok("/student → /student/dashboard")
    : fail("/student/index does not redirect to /student/dashboard");
}

const authPath = `${ROUTES_DIR}/auth.tsx`;
if (existsSync(authPath)) {
  const src = readFileSync(authPath, "utf8");
  // /auth should route successful student logins toward /student/... —
  // either directly or via resolveRedirectForUser / dashboardPathForRole.
  const routesStudents =
    /\/student\/dashboard/.test(src) ||
    /resolveRedirectForUser/.test(src) ||
    /dashboardPathForRole/.test(src);
  routesStudents
    ? ok("/auth routes signed-in students to a student destination")
    : fail("/auth has no path that sends students to /student/*");
}

// ── 5. No wrong-role redirects inside student routes ───────────
console.log("\n[5/5] Student routes never redirect to wrong-role dashboards");
const FORBIDDEN = [
  /redirect\(\s*\{\s*to\s*:\s*["']\/dashboard["']/,
  /redirect\(\s*\{\s*to\s*:\s*["']\/partner\/dashboard["']/,
  /redirect\(\s*\{\s*to\s*:\s*["']\/admin\/dashboard["']/,
  /redirect\(\s*\{\s*to\s*:\s*["']\/brand\/dashboard["']/,
];
for (const [file, src] of contents) {
  if (!file.startsWith("_authenticated/student")) continue;
  if (file === "_authenticated/student.tsx") continue; // layout legitimately re-routes wrong roles
  for (const re of FORBIDDEN) {
    if (re.test(src)) {
      fail(`${file} redirects to a non-student dashboard (${re})`);
    }
  }
}
ok("scanned student routes for wrong-role redirects");

// ── result ─────────────────────────────────────────────────────
console.log("");
if (errors.length) {
  console.error(`Student LMS routing check FAILED with ${errors.length} error(s).`);
  process.exit(1);
}
console.log("Student LMS routing check passed.");
