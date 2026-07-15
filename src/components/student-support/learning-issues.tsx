import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileWarning,
  GraduationCap,
  Loader2,
  Lock,
  LogIn,
  PlayCircle,
  RefreshCcw,
  Search,
  Target,
  Trophy,
  Video,
  Zap,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getStudentProgramSupportContext,
  getStudentAssessmentSupportContext,
  type StudentSnapshot,
  type StudentProgramSupportContext,
  type StudentEnrollmentBrief,
  type StudentAssessmentSupportContext,
} from "@/lib/student-support/student-support.functions";

// ============================================================
// Guided learning issue journeys
// Read-only; never mutate learning records.
// ============================================================

type IssueKey =
  | "find_program"
  | "paid_missing_program"
  | "find_enrollment"
  | "find_learning_programs"
  | "module_locked"
  | "cannot_open_lesson"
  | "lesson_not_complete"
  | "progress_not_updating"
  | "cannot_start_assessment"
  | "assessment_result_missing"
  | "certificate_missing"
  | "video_not_playing"
  | "learning_page_not_opening";

type Issue = {
  key: IssueKey;
  title: string;
  intent: string; // maps to Student Support intent
  question: string; // canonical question the user might ask
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  needsProgram: boolean;
};

const ISSUES: Issue[] = [
  {
    key: "find_program",
    title: "I Can't Find My Program",
    intent: "program_access",
    question: "I can't find my program.",
    description: "Locate a program you enrolled in but can't see in My Learning.",
    icon: Search,
    needsProgram: false,
  },
  {
    key: "paid_missing_program",
    title: "I Paid But My Program Is Missing",
    intent: "payment_and_access",
    question: "I paid but my program is missing.",
    description: "Understand payment and program access states in your account.",
    icon: CreditCard,
    needsProgram: false,
  },
  {
    key: "find_enrollment",
    title: "I Can't Find My Enrollment",
    intent: "enrollment_status",
    question: "I can't find my enrollment.",
    description: "See your authorised enrollment status.",
    icon: ClipboardList,
    needsProgram: false,
  },
  {
    key: "find_learning_programs",
    title: "I Can't Find My Learning Programs",
    intent: "my_learning_navigation",
    question: "I can't find my learning programs in My Learning.",
    description: "See what My Learning shows for your account.",
    icon: BookOpen,
    needsProgram: false,
  },
  {
    key: "module_locked",
    title: "My Module Is Locked",
    intent: "locked_module",
    question: "Why is my module locked?",
    description: "Understand your program's module access state.",
    icon: Lock,
    needsProgram: true,
  },
  {
    key: "cannot_open_lesson",
    title: "I Can't Open A Lesson",
    intent: "lesson_access",
    question: "I can't open a lesson.",
    description: "Check module and lesson access for your program.",
    icon: PlayCircle,
    needsProgram: true,
  },
  {
    key: "lesson_not_complete",
    title: "My Lesson Is Not Complete",
    intent: "lesson_completion",
    question: "My lesson is not marked complete.",
    description: "See student-visible lesson completion state.",
    icon: CheckCircle2,
    needsProgram: true,
  },
  {
    key: "progress_not_updating",
    title: "My Progress Is Not Updating",
    intent: "progress_not_updating",
    question: "My progress is not updating.",
    description: "See your current program progress from the Glintr progress engine.",
    icon: Target,
    needsProgram: true,
  },
  {
    key: "cannot_start_assessment",
    title: "I Can't Start My Assessment",
    intent: "assessment_access",
    question: "I can't start my assessment.",
    description: "Check authorised assessment access and attempt state.",
    icon: Zap,
    needsProgram: false,
  },
  {
    key: "assessment_result_missing",
    title: "My Assessment Result Is Missing",
    intent: "assessment_result",
    question: "My assessment result is missing.",
    description: "See student-visible attempt and result state.",
    icon: FileWarning,
    needsProgram: false,
  },
  {
    key: "certificate_missing",
    title: "My Certificate Is Missing",
    intent: "certificate_missing",
    question: "My certificate is missing.",
    description: "See authorised certificate eligibility and access state.",
    icon: Trophy,
    needsProgram: true,
  },
  {
    key: "video_not_playing",
    title: "My Video Is Not Playing",
    intent: "video_playback",
    question: "My lesson video is not playing.",
    description: "Separate lesson access from a technical video playback issue.",
    icon: Video,
    needsProgram: true,
  },
  {
    key: "learning_page_not_opening",
    title: "A Learning Page Is Not Opening",
    intent: "learning_technical",
    question: "A learning page is not opening.",
    description: "Safe troubleshooting for program, lesson or assessment pages.",
    icon: AlertTriangle,
    needsProgram: false,
  },
];

export type LearningIssueLaunch = {
  intent: string;
  question: string;
  courseId?: string;
  courseName?: string | null;
};

export function LearningIssuesSection({
  signedIn,
  snapshot,
  onAskAI,
}: {
  signedIn: boolean | null;
  snapshot: StudentSnapshot | undefined;
  onAskAI: (launch: LearningIssueLaunch) => void;
}) {
  const [active, setActive] = React.useState<IssueKey | null>(null);

  return (
    <Card className="p-5 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Solve Common Learning Issues
          </div>
          <h2 className="mt-1 text-xl md:text-2xl font-semibold tracking-tight">
            Guided Learning Support
          </h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Step through a specific issue with your Glintr program. Read-only —
            these journeys explain your current authorised state and safe next steps.
          </p>
        </div>
        {active && (
          <Button variant="outline" size="sm" onClick={() => setActive(null)}>
            <ArrowRight className="rotate-180 mr-1.5 size-3.5" /> Choose Another
            Learning Issue
          </Button>
        )}
      </div>

      {!active ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ISSUES.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.key}
                onClick={() => setActive(it.key)}
                className="text-left rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary-soft/30 transition p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm">{it.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {it.description}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <IssueJourney
            issue={ISSUES.find((i) => i.key === active)!}
            signedIn={signedIn}
            snapshot={snapshot}
            onReset={() => setActive(null)}
            onAskAI={onAskAI}
          />
        </div>
      )}
    </Card>
  );
}

function IssueJourney({
  issue,
  signedIn,
  snapshot,
  onReset,
  onAskAI,
}: {
  issue: Issue;
  signedIn: boolean | null;
  snapshot: StudentSnapshot | undefined;
  onReset: () => void;
  onAskAI: (launch: LearningIssueLaunch) => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = React.useState<string | null>(
    null,
  );

  // Auto-select when there's exactly one enrollment.
  React.useEffect(() => {
    if (!snapshot) return;
    if (snapshot.enrollments.length === 1 && snapshot.enrollments[0].courseId) {
      setSelectedCourseId(snapshot.enrollments[0].courseId);
    }
  }, [snapshot]);

  const enrollments = snapshot?.enrollments ?? [];
  const selected =
    enrollments.find((e) => e.courseId === selectedCourseId) ?? null;

  // Sign-in gate for account-specific journeys.
  const needsAuth = issue.key !== "find_program" || signedIn === false;
  if (signedIn === false) {
    return (
      <JourneyShell
        issue={issue}
        stepLabel="Step 1 of 2"
        stepTitle="Sign In To Continue"
      >
        <p className="text-sm text-muted-foreground">
          This guided support journey checks your authorised Glintr learning
          information. Please sign in to your student account to continue.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/auth">
              <LogIn className="mr-1.5 size-3.5" /> Sign In
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            Start Over
          </Button>
        </div>
      </JourneyShell>
    );
  }

  if (signedIn === null || !snapshot) {
    return (
      <JourneyShell issue={issue} stepLabel="Loading" stepTitle="Checking your account">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading your authorised
          learning information...
        </div>
      </JourneyShell>
    );
  }

  // No enrollment path
  if (enrollments.length === 0) {
    return (
      <JourneyShell
        issue={issue}
        stepLabel="Step 1 of 1"
        stepTitle="I Couldn't Find An Enrollment Linked To This Student Account"
      >
        <p className="text-sm text-muted-foreground">
          I could not confirm an authorised enrollment for this account using the
          available student information. If you completed a payment recently,
          program access can take some time to appear based on Glintr's
          authoritative payment and enrollment workflow.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/programs">Explore Programs</Link>
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onAskAI({
                intent: "payment_and_access",
                question: "I paid but I don't see an enrollment.",
              })
            }
          >
            Ask About Payment And Access
          </Button>
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RefreshCcw className="mr-1.5 size-3.5" /> Start Over
          </Button>
        </div>
      </JourneyShell>
    );
  }

  // Program selector for issues that need program context and there are multiple.
  if (issue.needsProgram && !selected) {
    return (
      <JourneyShell
        issue={issue}
        stepLabel="Step 1 of 2"
        stepTitle="Which Program Do You Need Help With?"
      >
        <div className="grid gap-2">
          {enrollments.map((e) => (
            <button
              key={e.enrollmentId}
              onClick={() => e.courseId && setSelectedCourseId(e.courseId)}
              className="text-left rounded-lg border border-border hover:border-primary/40 hover:bg-primary-soft/30 transition px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">
                  {e.courseName ?? "Program"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatEnrollmentStatus(e.status)}
                  {typeof e.progressPct === "number"
                    ? ` · ${e.progressPct}% progress`
                    : ""}
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RefreshCcw className="mr-1.5 size-3.5" /> Start Over
          </Button>
        </div>
      </JourneyShell>
    );
  }

  // Non-program-scoped journeys or program-scoped with selection.
  return (
    <ResolvedJourney
      issue={issue}
      snapshot={snapshot}
      selected={selected}
      onReset={() => {
        setSelectedCourseId(null);
        onReset();
      }}
      onChangeProgram={() => setSelectedCourseId(null)}
      onAskAI={onAskAI}
      needsAuth={needsAuth}
    />
  );
}

function ResolvedJourney({
  issue,
  snapshot,
  selected,
  onReset,
  onChangeProgram,
  onAskAI,
}: {
  issue: Issue;
  snapshot: StudentSnapshot;
  selected: StudentEnrollmentBrief | null;
  onReset: () => void;
  onChangeProgram: () => void;
  onAskAI: (launch: LearningIssueLaunch) => void;
  needsAuth: boolean;
}) {
  const fetchCtx = useServerFn(getStudentProgramSupportContext);
  const ctxMutation = useMutation({
    mutationFn: async (courseId: string) => fetchCtx({ data: { courseId } }),
  });

  React.useEffect(() => {
    if (issue.needsProgram && selected?.courseId) {
      ctxMutation.mutate(selected.courseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issue.needsProgram, selected?.courseId]);

  const ctx = ctxMutation.data as StudentProgramSupportContext | undefined;
  const learnHref = selected?.courseSlug
    ? (`/student/learn/${selected.courseSlug}` as const)
    : null;
  const programHref = selected?.courseSlug
    ? (`/student/programs/${selected.courseSlug}` as const)
    : null;

  const body = (() => {
    switch (issue.key) {
      case "find_program":
      case "find_learning_programs":
        return (
          <>
            <StatusLine label="Authorised Enrollments" value={String(snapshot.enrollmentCount)} />
            {snapshot.enrollments.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">
                No authorised programs are currently visible in your My Learning.
                If you recently enrolled or paid, allow the authoritative
                enrollment and payment workflow to complete.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {snapshot.enrollments.map((e) => (
                  <div
                    key={e.enrollmentId}
                    className="rounded-lg border border-border bg-background px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {e.courseName ?? "Program"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatEnrollmentStatus(e.status)}
                        {typeof e.progressPct === "number"
                          ? ` · ${e.progressPct}% progress`
                          : ""}
                      </div>
                    </div>
                    {e.courseSlug ? (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          to="/student/programs/$slug"
                          params={{ slug: e.courseSlug }}
                        >
                          Open Program
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        );
      case "find_enrollment":
        return (
          <>
            <StatusLine label="Authorised Enrollments" value={String(snapshot.enrollmentCount)} />
            {snapshot.enrollments.length > 0 && (
              <div className="mt-3 grid gap-2">
                {snapshot.enrollments.map((e) => (
                  <div
                    key={e.enrollmentId}
                    className="rounded-lg border border-border px-3 py-2"
                  >
                    <div className="text-sm font-medium">
                      {e.courseName ?? "Program"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: {formatEnrollmentStatus(e.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Glintr Student Support is read-only and cannot create or approve
              enrollment. If your enrollment appears missing, ask the AI or
              contact human student support (added later).
            </p>
          </>
        );
      case "paid_missing_program":
        return (
          <>
            <p className="text-sm text-muted-foreground">
              Student Support cannot verify payment or grant program access —
              those flow through Glintr's authoritative payment and enrollment
              workflow. Here's what your account currently shows:
            </p>
            <div className="mt-3 grid gap-2">
              {snapshot.enrollments.map((e) => (
                <div
                  key={e.enrollmentId}
                  className="rounded-lg border border-border px-3 py-2"
                >
                  <div className="text-sm font-medium">{e.courseName ?? "Program"}</div>
                  <div className="text-xs text-muted-foreground">
                    Enrollment status: {formatEnrollmentStatus(e.status)}
                  </div>
                </div>
              ))}
              {snapshot.enrollments.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No authorised enrollment is visible on this account yet.
                </div>
              )}
            </div>
          </>
        );
      case "module_locked":
      case "cannot_open_lesson":
      case "lesson_not_complete":
      case "progress_not_updating": {
        if (ctxMutation.isPending) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading your program
              context...
            </div>
          );
        }
        if (ctxMutation.isError || !ctx || !ctx.authorised) {
          return (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="size-4 mt-0.5" />
              I couldn't load an authorised learning context for this program.
              Please try another program or ask Glintr AI Student Support.
            </div>
          );
        }
        return (
          <>
            <StatusLine label="Program" value={ctx.courseName ?? "Program"} />
            <StatusLine
              label="Enrollment Status"
              value={formatEnrollmentStatus(ctx.enrollmentStatus)}
            />
            <StatusLine
              label="Learning Progress"
              value={
                typeof ctx.progressPct === "number"
                  ? `${ctx.progressPct}% (${ctx.completedLessonCount}/${ctx.publishedLessonCount} lessons)`
                  : "Not available"
              }
            />
            {issue.key === "module_locked" && (
              <>
                <StatusLine
                  label="Modules"
                  value={String(ctx.moduleCount)}
                />
                <StatusLine
                  label="First Locked Module"
                  value={ctx.firstLockedModuleName ?? "No locked module detected"}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Glintr's progression engine determines module access. Complete
                  the required lessons in the previous module to unlock the next.
                  AI Student Support cannot unlock modules.
                </p>
              </>
            )}
            {issue.key === "cannot_open_lesson" && (
              <>
                <StatusLine
                  label="Current Lesson"
                  value={ctx.currentLessonName ?? "None available"}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  If a lesson is locked, it is intentionally unavailable based on
                  your program's access rules. If a lesson should be available
                  but still doesn't open, that is a technical issue (covered in
                  the next Student Support update).
                </p>
              </>
            )}
            {issue.key === "lesson_not_complete" && (
              <>
                <StatusLine
                  label="Current Lesson"
                  value={ctx.currentLessonName ?? "None active"}
                />
                <StatusLine
                  label="Completion Status"
                  value={formatLessonStatus(ctx.currentLessonStatus)}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Lesson completion is set by the Glintr progress engine based on
                  the actual configured completion rule. AI Student Support
                  cannot mark lessons complete.
                </p>
              </>
            )}
            {issue.key === "progress_not_updating" && (
              <p className="mt-2 text-xs text-muted-foreground">
                This value comes directly from Glintr's authoritative progress
                engine. AI Student Support cannot change or recalculate it.
              </p>
            )}
          </>
        );
      }
      case "certificate_missing": {
        if (ctxMutation.isPending) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading your certificate context...
            </div>
          );
        }
        if (ctxMutation.isError || !ctx || !ctx.authorised) {
          return (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="size-4 mt-0.5" />
              I couldn't load an authorised certificate context. Try another program or ask Glintr AI Student Support.
            </div>
          );
        }
        return (
          <>
            <StatusLine label="Program" value={ctx.courseName ?? "Program"} />
            <StatusLine
              label="Enrollment Status"
              value={formatEnrollmentStatus(ctx.enrollmentStatus)}
            />
            <StatusLine
              label="Learning Progress"
              value={
                typeof ctx.progressPct === "number"
                  ? `${ctx.progressPct}% (${ctx.completedLessonCount}/${ctx.publishedLessonCount} lessons)`
                  : "Not available"
              }
            />
            <StatusLine
              label="Certificate On Record"
              value={ctx.hasCertificate ? "Available" : "Not available"}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Glintr's certificate system is authoritative. AI Student Support cannot issue, mark eligible, or release certificates. If your certificate should exist but is missing, ask a follow-up and human student support can review it.
            </p>
          </>
        );
      }
      case "video_not_playing": {
        if (ctxMutation.isPending) {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Checking your lesson access...
            </div>
          );
        }
        const lessonAvailable =
          ctx && ctx.authorised && !!ctx.currentLessonName && ctx.currentLessonStatus !== null;
        return (
          <>
            {ctx?.authorised && (
              <>
                <StatusLine label="Program" value={ctx.courseName ?? "Program"} />
                <StatusLine
                  label="Current Lesson"
                  value={ctx.currentLessonName ?? "None available"}
                />
                <StatusLine
                  label="Lesson Access"
                  value={lessonAvailable ? "Available" : "Not available"}
                />
              </>
            )}
            {!lessonAvailable ? (
              <p className="mt-2 text-xs text-muted-foreground">
                The current lesson does not appear available on your account. This is a Lesson Access state, not a technical playback issue. Follow the program's access rules or complete the required previous lesson.
              </p>
            ) : (
              <div className="mt-3 space-y-2 text-sm">
                <div className="font-medium">Safe playback checks:</div>
                <ol className="ml-4 list-decimal space-y-1 text-muted-foreground text-xs">
                  <li>Confirm the correct lesson is open.</li>
                  <li>Retry the video from the start.</li>
                  <li>Check your network connection.</li>
                  <li>Refresh the lesson page.</li>
                  <li>Try a different supported browser tab.</li>
                </ol>
                <p className="text-xs text-muted-foreground">
                  Do not share passwords, OTPs, or payment PINs. If the issue persists, ask a follow-up and preserve the program/lesson context for support review.
                </p>
              </div>
            )}
          </>
        );
      }
      case "cannot_start_assessment":
      case "assessment_result_missing":
        return (
          <AssessmentIssueBody
            issue={issue}
            onAskAI={onAskAI}
          />
        );
      case "learning_page_not_opening":
        return (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              First, identify which page isn't opening: program, module, lesson, or assessment. Then try these safe steps:
            </p>
            <ol className="ml-4 list-decimal space-y-1 text-muted-foreground text-xs">
              <li>Retry the current action.</li>
              <li>Refresh the page.</li>
              <li>Confirm you are signed in to your Glintr student account.</li>
              <li>Return to My Learning and reopen the program.</li>
              <li>Try the action again.</li>
            </ol>
            <p className="text-xs text-muted-foreground">
              If the page still won't open, this may be an access/business state rather than a technical issue — the AI can help distinguish. Never share passwords, OTPs, UPI PINs, CVV, or authentication tokens.
            </p>
          </div>
        );
    }
  })();

  return (
    <JourneyShell
      issue={issue}
      stepLabel="Current State"
      stepTitle={issue.title}
    >
      {body}

      <div className="mt-5 flex flex-wrap gap-2">
        {learnHref && (
          <Button asChild size="sm">
            <Link
              to="/student/learn/$slug"
              params={{ slug: selected!.courseSlug! }}
            >
              Continue Learning
            </Link>
          </Button>
        )}
        {programHref && (
          <Button asChild size="sm" variant="outline">
            <Link
              to="/student/programs/$slug"
              params={{ slug: selected!.courseSlug! }}
            >
              Open Program
            </Link>
          </Button>
        )}
        <Button asChild size="sm" variant="outline">
          <Link to="/student/programs">Open My Learning</Link>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAskAI({
              intent: issue.intent,
              question: issue.question,
              courseId: selected?.courseId ?? undefined,
              courseName: selected?.courseName ?? undefined,
            })
          }
        >
          Ask A Follow-Up
        </Button>
        {issue.needsProgram && snapshot.enrollments.length > 1 && (
          <Button size="sm" variant="ghost" onClick={onChangeProgram}>
            Change Program
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onReset}>
          <RefreshCcw className="mr-1.5 size-3.5" /> Start Over
        </Button>
      </div>
    </JourneyShell>
  );
}

function JourneyShell({
  issue,
  stepLabel,
  stepTitle,
  children,
}: {
  issue: Issue;
  stepLabel: string;
  stepTitle: string;
  children: React.ReactNode;
}) {
  const Icon = issue.icon;
  return (
    <div className="rounded-xl border border-border bg-background p-4 md:p-5">
      <div className="flex items-start gap-3">
        <div className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {stepLabel}
          </div>
          <div className="font-medium">{stepTitle}</div>
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-dashed border-border py-1.5 last:border-b-0 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium text-right truncate max-w-[60%]">{value}</div>
    </div>
  );
}

function formatEnrollmentStatus(s: string | null | undefined) {
  if (!s) return "Not available";
  const map: Record<string, string> = {
    active: "Active",
    completed: "Completed",
    paused: "Paused",
    pending: "Pending",
    cancelled: "Cancelled",
  };
  return map[s] ?? s;
}

function formatLessonStatus(s: string | null | undefined) {
  if (!s) return "Not started";
  const map: Record<string, string> = {
    not_started: "Not started",
    in_progress: "In progress",
    completed: "Completed",
  };
  return map[s] ?? s;
}

// ============================================================
// Assessment guided issue body (fetches authorised assessments)
// ============================================================
function AssessmentIssueBody({
  issue,
  onAskAI,
}: {
  issue: Issue;
  onAskAI: (launch: LearningIssueLaunch) => void;
}) {
  const fetchAsx = useServerFn(getStudentAssessmentSupportContext);
  const [selected, setSelected] = React.useState<string | null>(null);
  const q = useMutation({
    mutationFn: async () => fetchAsx() as Promise<StudentAssessmentSupportContext>,
  });
  React.useEffect(() => {
    q.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = q.data;
  const list = data?.assessments ?? [];

  React.useEffect(() => {
    if (list.length === 1) setSelected(list[0].assessmentId);
  }, [list]);

  if (q.isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading your authorised assessments...
      </div>
    );
  }
  if (q.isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-start gap-2">
        <AlertTriangle className="size-4 mt-0.5" />
        Unable to load assessment information. Please try again or ask Glintr AI Student Support.
      </div>
    );
  }
  if (list.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No authorised assessments are currently visible on your account. Assessments appear once they are published in a program you're enrolled in.
      </p>
    );
  }
  if (!selected) {
    return (
      <div>
        <div className="mb-2 text-sm font-medium">Which Assessment Do You Need Help With?</div>
        <div className="grid gap-2">
          {list.map((a) => (
            <button
              key={a.assessmentId}
              onClick={() => setSelected(a.assessmentId)}
              className="text-left rounded-lg border border-border hover:border-primary/40 hover:bg-primary-soft/30 transition px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {a.courseName ?? "Program"}
                  {a.bestAttemptPercentage != null
                    ? ` · Best ${Math.round(a.bestAttemptPercentage)}%`
                    : " · No submitted attempt"}
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const a = list.find((x) => x.assessmentId === selected)!;
  const isResult = issue.key === "assessment_result_missing";
  return (
    <>
      <StatusLine label="Assessment" value={a.name} />
      <StatusLine label="Program" value={a.courseName ?? "Program"} />
      {isResult ? (
        <>
          <StatusLine
            label="Attempts Submitted"
            value={String(
              a.totalAttempts > 0 && (a.bestAttemptStatus === "submitted" || a.lastAttemptSubmittedAt)
                ? a.totalAttempts
                : 0,
            )}
          />
          <StatusLine
            label="Best Result"
            value={
              a.bestAttemptPercentage != null
                ? `${Math.round(a.bestAttemptPercentage)}%${a.bestAttemptPassed != null ? ` · ${a.bestAttemptPassed ? "Passed" : "Not Passed"}` : ""}`
                : "No submitted attempt"
            }
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Results come from Glintr's authoritative assessment engine. AI Student Support cannot calculate scores, mark passed/failed, or change results.
          </p>
        </>
      ) : (
        <>
          <StatusLine label="Required" value={a.isRequired ? "Yes" : "No"} />
          <StatusLine
            label="Pass Percentage"
            value={a.passPercentage != null ? `${Math.round(a.passPercentage)}%` : "Not configured"}
          />
          <StatusLine
            label="Your Attempts So Far"
            value={String(a.totalAttempts)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Assessment access follows Glintr's configured rules. AI Student Support cannot start an assessment, create an attempt, unlock, or bypass access — and cannot provide answers to active assessments.
          </p>
        </>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/student/assessments">Open Assessments</Link>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            onAskAI({
              intent: issue.intent,
              question: `${issue.question} (Assessment: ${a.name}${a.courseName ? `, Program: ${a.courseName}` : ""})`,
              courseId: a.courseId ?? undefined,
              courseName: a.courseName ?? undefined,
            })
          }
        >
          Ask A Follow-Up
        </Button>
        {list.length > 1 && (
          <Button size="sm" variant="ghost" onClick={() => setSelected(null)}>
            Choose Another Assessment
          </Button>
        )}
      </div>
    </>
  );
}


// Re-export unused icon type for tree-shakers.
export const _GraduationCap = GraduationCap;
export const _Badge = Badge;
export const _cn = cn;
