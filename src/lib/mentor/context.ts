// Derive page context and page-aware suggestion chips from the current pathname.

export type MentorPageContext = {
  path: string;
  title?: string;
  category?: string;
  courseSlug?: string;
  section?: string;
};

export function derivePageContext(pathname: string): MentorPageContext {
  const p = pathname || "/";
  const ctx: MentorPageContext = { path: p };

  const parts = p.split("/").filter(Boolean);
  if (parts[0] === "programs" && parts[1]) {
    ctx.section = "programs";
    ctx.category = parts[1];
    if (parts[2]) ctx.courseSlug = parts[2];
  } else if (parts[0] === "blog") {
    ctx.section = "blog";
  } else if (parts[0] === "glossary") {
    ctx.section = "glossary";
  } else if (parts[0] === "compare") {
    ctx.section = "compare";
  } else if (parts[0] === "learning-paths") {
    ctx.section = "learning-paths";
  } else if (parts[0] === "career-maps") {
    ctx.section = "career-maps";
  } else if (parts[0] === "tools") {
    ctx.section = "tools";
  } else if (
    p === "/earn" ||
    p === "/70-revenue-model" ||
    p === "/50-supported-model" ||
    p === "/income-calculator" ||
    p === "/payout-system" ||
    p === "/partner-network"
  ) {
    ctx.section = "earn";
  } else if (p.startsWith("/launch-your-brand") || p === "/brand-setup" || p === "/lms" || p === "/marketing-support") {
    ctx.section = "launch";
  }

  return ctx;
}

export function contextualSuggestions(ctx: MentorPageContext): string[] {
  switch (ctx.section) {
    case "programs":
      if (ctx.courseSlug) {
        return [
          "What will I learn?",
          "Show me a study plan",
          "Compare with similar programs",
          "Related blogs",
        ];
      }
      return [
        "Recommend a program",
        "Show a learning path",
        "Compare programs in this category",
        "Explain a term",
      ];
    case "blog":
      return ["Related blogs", "Explain this topic", "Recommend a program", "Show glossary terms"];
    case "glossary":
      return ["Explain in simple terms", "Related programs", "Show a comparison", "Give an example"];
    case "compare":
      return ["Which is right for me?", "Recommend a program", "Study plan", "Career map"];
    case "learning-paths":
    case "career-maps":
      return ["Create a study plan", "Recommend programs", "Related blogs", "Show glossary terms"];
    case "tools":
      return ["How does this tool work?", "Recommend a program", "Related learning path", "Study plan"];
    case "earn":
      return [
        "How does the 70% model work?",
        "How does the 50% model work?",
        "How do payouts work?",
        "Become a partner",
      ];
    case "launch":
      return [
        "How does white label work?",
        "What LMS do I get?",
        "Marketing support",
        "Book a consultation",
      ];
    default:
      return [
        "Recommend a course",
        "Compare programs",
        "Explain AI",
        "Create a study plan",
        "Revenue share help",
        "Latest blogs",
      ].slice(0, 4);
  }
}
