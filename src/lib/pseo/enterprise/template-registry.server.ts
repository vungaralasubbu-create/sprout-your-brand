// Seed + fetch templates for the enterprise pSEO engine.
import { getAdmin } from "./service-client.server";
import type { PseoPageTypeEx, PseoTemplate } from "./types";

type Seed = Omit<PseoTemplate, "id" | "is_active"> & { is_active?: boolean };

const SECTION = (id: string, heading: string, prompt: string, minWords = 120) => ({
  id, heading, prompt, minWords,
});

// A concise but production-ready seed covering all 27 page types.
export const TEMPLATE_SEEDS: Seed[] = [
  {
    key: "course_pillar", name: "Course Pillar", page_type: "course",
    url_pattern: "/course/{course}",
    title_pattern: "Best {course_name} Course Online",
    meta_pattern: "Master {course_name} with our online course — projects, mentorship, placement support.",
    h1_pattern: "Best {course_name} Course",
    variables: ["course", "course_name"],
    schema_types: ["Course", "BreadcrumbList", "FAQPage"],
    prompt_version: "v1",
    min_words: 1200,
    sections: [
      SECTION("overview", "Overview", "Explain what {course_name} is and who it's for."),
      SECTION("curriculum", "Curriculum", "Outline a modern curriculum for {course_name}."),
      SECTION("careers", "Career Opportunities", "Career roles and salary ranges after {course_name}."),
      SECTION("projects", "Projects", "5 hands-on projects for {course_name}."),
      SECTION("faq", "FAQs", "Answer 6 top questions about {course_name}."),
    ],
  },
  {
    key: "career_pillar", name: "Career Pillar", page_type: "career",
    url_pattern: "/career/{role}",
    title_pattern: "How to Become a {role_name} — Complete Guide",
    meta_pattern: "Roadmap, skills, salary and interview prep to become a {role_name}.",
    h1_pattern: "Become a {role_name}",
    variables: ["role", "role_name"],
    schema_types: ["Article", "FAQPage", "BreadcrumbList"],
    prompt_version: "v1",
    min_words: 1100,
    sections: [
      SECTION("intro", "Overview", "Introduce {role_name} and current demand."),
      SECTION("skills", "Skills Required", "List core and advanced skills."),
      SECTION("roadmap", "Roadmap", "Step-by-step roadmap to become a {role_name}."),
      SECTION("salary", "Salary", "Salary ranges by experience."),
      SECTION("companies", "Top Companies", "Companies hiring {role_name}s."),
      SECTION("faq", "FAQs", "Answer 6 FAQs."),
    ],
  },
  {
    key: "technology_pillar", name: "Technology Pillar", page_type: "technology",
    url_pattern: "/learn/{technology}",
    title_pattern: "Learn {technology_name} — Complete Guide",
    meta_pattern: "Learn {technology_name}: fundamentals, projects, roadmap, salary and jobs.",
    h1_pattern: "Learn {technology_name}",
    variables: ["technology", "technology_name"],
    schema_types: ["Article", "FAQPage"],
    prompt_version: "v1", min_words: 1200,
    sections: [
      SECTION("what", "What is {technology_name}?", "Explain in beginner-friendly terms."),
      SECTION("why", "Why Learn {technology_name}", "Industry demand, use cases."),
      SECTION("roadmap", "Roadmap", "6-month learning roadmap."),
      SECTION("projects", "Project Ideas", "8 project ideas."),
      SECTION("careers", "Careers & Salary", "Career paths and salary."),
      SECTION("faq", "FAQs", "6 FAQs."),
    ],
  },
  {
    key: "certification_pillar", name: "Certification Guide", page_type: "certification",
    url_pattern: "/certification/{certification}",
    title_pattern: "Best Certifications for {topic_name}",
    meta_pattern: "Top {topic_name} certifications compared: cost, difficulty, ROI.",
    h1_pattern: "Best {topic_name} Certifications",
    variables: ["certification", "topic_name"],
    schema_types: ["Article", "FAQPage"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("overview", "Overview", "Why {topic_name} certifications matter."),
      SECTION("top", "Top Certifications", "List and compare top 5."),
      SECTION("prep", "How to Prepare", "Prep strategy."),
      SECTION("faq", "FAQs", "6 FAQs."),
    ],
  },
  {
    key: "interview_questions", name: "Interview Questions", page_type: "interview_questions",
    url_pattern: "/interview/{technology}-interview-questions",
    title_pattern: "Top {technology_name} Interview Questions & Answers",
    meta_pattern: "Practice {technology_name} interview questions with detailed answers.",
    h1_pattern: "{technology_name} Interview Questions",
    variables: ["technology", "technology_name"],
    schema_types: ["FAQPage", "Article"], prompt_version: "v1", min_words: 1400,
    sections: [
      SECTION("basic", "Basic Questions", "10 basic Q&A on {technology_name}."),
      SECTION("intermediate", "Intermediate Questions", "10 intermediate Q&A."),
      SECTION("advanced", "Advanced Questions", "10 advanced Q&A."),
      SECTION("tips", "Interview Tips", "Practical tips."),
    ],
  },
  {
    key: "interview_experience", name: "Interview Experience", page_type: "interview_experience",
    url_pattern: "/company/{company}-interview-process",
    title_pattern: "{company_name} Interview Process & Experience",
    meta_pattern: "How {company_name} interviews candidates: rounds, questions, and tips.",
    h1_pattern: "{company_name} Interview Process",
    variables: ["company", "company_name"],
    schema_types: ["Article", "FAQPage"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("rounds", "Interview Rounds", "Describe the rounds."),
      SECTION("questions", "Common Questions", "Common questions asked."),
      SECTION("tips", "Preparation Tips", "How to prepare."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "projects", name: "Project Ideas", page_type: "project",
    url_pattern: "/projects/{technology}-projects",
    title_pattern: "Best {technology_name} Projects for {year}",
    meta_pattern: "Hands-on {technology_name} projects with source code and difficulty ratings.",
    h1_pattern: "Best {technology_name} Projects",
    variables: ["technology", "technology_name", "year"],
    schema_types: ["ItemList", "Article"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("beginner", "Beginner Projects", "5 beginner projects."),
      SECTION("intermediate", "Intermediate Projects", "5 intermediate projects."),
      SECTION("advanced", "Advanced Projects", "5 advanced projects."),
      SECTION("faq", "FAQs", "4 FAQs."),
    ],
  },
  {
    key: "tutorial", name: "Tutorial", page_type: "tutorial",
    url_pattern: "/tutorial/{technology}",
    title_pattern: "{technology_name} Tutorial for Beginners",
    meta_pattern: "Step-by-step {technology_name} tutorial with code and exercises.",
    h1_pattern: "{technology_name} Tutorial",
    variables: ["technology", "technology_name"],
    schema_types: ["Article", "HowTo"], prompt_version: "v1", min_words: 1200,
    sections: [
      SECTION("intro", "Introduction", "Intro to {technology_name}."),
      SECTION("setup", "Setup", "Environment setup."),
      SECTION("basics", "Basics", "Core concepts."),
      SECTION("practice", "Practice Exercises", "5 exercises."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "roadmap", name: "Roadmap", page_type: "roadmap",
    url_pattern: "/roadmap/{role}",
    title_pattern: "{role_name} Roadmap — Step by Step",
    meta_pattern: "Complete {role_name} learning roadmap with milestones and resources.",
    h1_pattern: "{role_name} Roadmap",
    variables: ["role", "role_name"],
    schema_types: ["Article", "HowTo"], prompt_version: "v1", min_words: 1100,
    sections: [
      SECTION("foundations", "Foundations", "Foundation skills."),
      SECTION("intermediate", "Intermediate", "Intermediate stack."),
      SECTION("advanced", "Advanced", "Advanced stack."),
      SECTION("projects", "Portfolio Projects", "Portfolio plan."),
      SECTION("job", "Getting Hired", "Getting hired."),
    ],
  },
  {
    key: "skill", name: "Skill Guide", page_type: "skill",
    url_pattern: "/skill/{skill}",
    title_pattern: "{skill_name} — Skill Guide",
    meta_pattern: "What is {skill_name}, why it matters and how to master it.",
    h1_pattern: "{skill_name} Guide",
    variables: ["skill", "skill_name"],
    schema_types: ["Article", "FAQPage"], prompt_version: "v1", min_words: 800,
    sections: [
      SECTION("what", "What is {skill_name}", "Define {skill_name}."),
      SECTION("why", "Why It Matters", "Industry relevance."),
      SECTION("learn", "How to Learn", "Learning plan."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "salary_country", name: "Salary by Country", page_type: "salary",
    url_pattern: "/salary/{role}-{country}",
    title_pattern: "{role_name} Salary in {country_name}",
    meta_pattern: "{role_name} salary in {country_name} by experience, city and company.",
    h1_pattern: "{role_name} Salary in {country_name}",
    variables: ["role", "role_name", "country", "country_name"],
    schema_types: ["Article", "FAQPage"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("avg", "Average Salary", "Averages and ranges."),
      SECTION("exp", "By Experience", "Entry / mid / senior."),
      SECTION("company", "By Company", "Company ranges."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "salary_city", name: "Salary by City", page_type: "salary",
    url_pattern: "/salary/{role}-{city}",
    title_pattern: "{role_name} Salary in {city_name}",
    meta_pattern: "{role_name} salary in {city_name} by experience, company, and skills.",
    h1_pattern: "{role_name} Salary in {city_name}",
    variables: ["role", "role_name", "city", "city_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 800,
    sections: [
      SECTION("avg", "Average Salary", "Averages."),
      SECTION("exp", "By Experience", "Entry / mid / senior."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "college", name: "College Guide", page_type: "college",
    url_pattern: "/college/{college}",
    title_pattern: "{college_name} — Programs, Fees, Placements",
    meta_pattern: "Guide to {college_name}: courses, fees, placements and reviews.",
    h1_pattern: "{college_name}",
    variables: ["college", "college_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("about", "About", "About {college_name}."),
      SECTION("programs", "Top Programs", "Top programs."),
      SECTION("placements", "Placements", "Placements."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "university", name: "University Guide", page_type: "university",
    url_pattern: "/university/{university}",
    title_pattern: "{university_name} — Programs, Rankings, Fees",
    meta_pattern: "Guide to {university_name}: programs, rankings, fees and outcomes.",
    h1_pattern: "{university_name}",
    variables: ["university", "university_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("about", "About", "About {university_name}."),
      SECTION("programs", "Programs", "Programs."),
      SECTION("outcomes", "Outcomes", "Career outcomes."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "company_hiring", name: "Company Hiring", page_type: "company_hiring",
    url_pattern: "/company/{company}-hiring-process",
    title_pattern: "{company_name} Hiring Process — Roles & Salaries",
    meta_pattern: "How {company_name} hires: roles, salary bands, and application tips.",
    h1_pattern: "{company_name} Hiring",
    variables: ["company", "company_name"],
    schema_types: ["Article", "FAQPage"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("roles", "Top Roles", "Top open roles."),
      SECTION("process", "Hiring Process", "Process."),
      SECTION("comp", "Compensation", "Comp bands."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "company_hiring_tech", name: "Companies Hiring Technology", page_type: "company_hiring",
    url_pattern: "/companies-hiring-{technology}",
    title_pattern: "Top Companies Hiring {technology_name} Engineers",
    meta_pattern: "Companies actively hiring {technology_name} engineers with pay bands.",
    h1_pattern: "Companies Hiring {technology_name} Engineers",
    variables: ["technology", "technology_name"],
    schema_types: ["ItemList", "Article"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("list", "Top 20 Companies", "Top 20."),
      SECTION("comp", "Compensation", "Comp bands."),
      SECTION("apply", "How to Apply", "Application tips."),
    ],
  },
  {
    key: "job_role", name: "Job Role", page_type: "job_role",
    url_pattern: "/jobs/{role}",
    title_pattern: "{role_name} Jobs — Skills, Salary, Companies",
    meta_pattern: "Everything about {role_name} jobs: skills, salary, top companies.",
    h1_pattern: "{role_name} Jobs",
    variables: ["role", "role_name"],
    schema_types: ["JobPosting", "Article"], prompt_version: "v1", min_words: 800,
    sections: [
      SECTION("overview", "Overview", "Overview."),
      SECTION("skills", "Skills", "Skills."),
      SECTION("salary", "Salary", "Salary."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "industry", name: "Industry", page_type: "industry",
    url_pattern: "/industry/{industry}",
    title_pattern: "{industry_name} Industry — Careers & Trends",
    meta_pattern: "{industry_name} industry: careers, trends, top companies, and outlook.",
    h1_pattern: "{industry_name} Industry",
    variables: ["industry", "industry_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 1000,
    sections: [
      SECTION("overview", "Overview", "Industry overview."),
      SECTION("careers", "Careers", "Careers."),
      SECTION("trends", "Trends", "Trends."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "tool", name: "Tool Guide", page_type: "tool",
    url_pattern: "/tool/{tool}",
    title_pattern: "{tool_name} — Guide, Alternatives, Pricing",
    meta_pattern: "Everything about {tool_name}: features, pricing, alternatives, and how to use.",
    h1_pattern: "{tool_name} Guide",
    variables: ["tool", "tool_name"],
    schema_types: ["Product", "Article", "FAQPage"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("what", "What is {tool_name}", "Overview."),
      SECTION("features", "Features", "Features."),
      SECTION("pricing", "Pricing", "Pricing tiers."),
      SECTION("alt", "Alternatives", "Top alternatives."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "comparison", name: "Comparison", page_type: "comparison",
    url_pattern: "/compare/{technology_a}-vs-{technology_b}",
    title_pattern: "{technology_a_name} vs {technology_b_name} — Which to Choose?",
    meta_pattern: "Detailed comparison of {technology_a_name} vs {technology_b_name}: features, use-cases and performance.",
    h1_pattern: "{technology_a_name} vs {technology_b_name}",
    variables: ["technology_a", "technology_a_name", "technology_b", "technology_b_name"],
    schema_types: ["Article", "FAQPage"], prompt_version: "v1", min_words: 1000,
    sections: [
      SECTION("overview", "Overview", "Overview of both."),
      SECTION("table", "Comparison Table", "Feature-by-feature comparison."),
      SECTION("usecase", "When to Choose Which", "Use-cases."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "trending", name: "Trending Technology", page_type: "trending",
    url_pattern: "/trending/{technology}",
    title_pattern: "{technology_name} in {year} — Why It's Trending",
    meta_pattern: "Why {technology_name} is trending in {year}: adoption, jobs, salaries.",
    h1_pattern: "{technology_name} Trends {year}",
    variables: ["technology", "technology_name", "year"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("why", "Why It's Trending", "Reasons."),
      SECTION("adopt", "Industry Adoption", "Adoption."),
      SECTION("jobs", "Jobs & Salary", "Jobs & salary."),
    ],
  },
  {
    key: "location", name: "Location Page", page_type: "location",
    url_pattern: "/{course}-in-{city}",
    title_pattern: "{course_name} in {city_name} — Courses, Fees & Jobs",
    meta_pattern: "Learn {course_name} in {city_name}: top courses, fees, jobs, and salaries.",
    h1_pattern: "{course_name} in {city_name}",
    variables: ["course", "course_name", "city", "city_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("why", "Why {city_name}", "Why the city."),
      SECTION("courses", "Top Courses", "Top courses."),
      SECTION("jobs", "Jobs & Salary", "Jobs & salary."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "event", name: "Event", page_type: "event",
    url_pattern: "/events/{event}",
    title_pattern: "{event_name} — Dates, Speakers, Highlights",
    meta_pattern: "About {event_name}: agenda, speakers, and how to attend.",
    h1_pattern: "{event_name}",
    variables: ["event", "event_name"],
    schema_types: ["Event"], prompt_version: "v1", min_words: 700,
    sections: [
      SECTION("about", "About", "About the event."),
      SECTION("agenda", "Agenda", "Agenda highlights."),
      SECTION("speakers", "Speakers", "Speakers."),
    ],
  },
  {
    key: "scholarship", name: "Scholarship", page_type: "scholarship",
    url_pattern: "/scholarship/{scholarship}",
    title_pattern: "{scholarship_name} — Eligibility & Apply",
    meta_pattern: "{scholarship_name}: eligibility, amount, and how to apply.",
    h1_pattern: "{scholarship_name} Scholarship",
    variables: ["scholarship", "scholarship_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 800,
    sections: [
      SECTION("about", "About", "About the scholarship."),
      SECTION("elig", "Eligibility", "Eligibility."),
      SECTION("apply", "How to Apply", "Application steps."),
      SECTION("faq", "FAQs", "5 FAQs."),
    ],
  },
  {
    key: "internship", name: "Internship", page_type: "internship",
    url_pattern: "/internship/{role}",
    title_pattern: "{role_name} Internship — Skills, Stipend, Companies",
    meta_pattern: "Land a {role_name} internship: skills, stipend, top companies.",
    h1_pattern: "{role_name} Internship Guide",
    variables: ["role", "role_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 800,
    sections: [
      SECTION("what", "What You Do", "Day-to-day."),
      SECTION("skills", "Skills", "Skills."),
      SECTION("stipend", "Stipend", "Stipend range."),
    ],
  },
  {
    key: "placement", name: "Placement", page_type: "placement",
    url_pattern: "/placement/{topic}",
    title_pattern: "{topic_name} Placement Guide",
    meta_pattern: "Placement guide for {topic_name}: process, tips, and success stories.",
    h1_pattern: "{topic_name} Placement Guide",
    variables: ["topic", "topic_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 800,
    sections: [
      SECTION("process", "Placement Process", "Process."),
      SECTION("tips", "Preparation Tips", "Tips."),
      SECTION("stories", "Success Stories", "Short success stories."),
    ],
  },
  {
    key: "success_story", name: "Success Story", page_type: "success_story",
    url_pattern: "/story/{slug}",
    title_pattern: "{learner_name} — {role_name} at {company_name}",
    meta_pattern: "How {learner_name} became a {role_name} at {company_name}.",
    h1_pattern: "{learner_name} — {role_name} at {company_name}",
    variables: ["slug", "learner_name", "role_name", "company_name"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 700,
    sections: [
      SECTION("bg", "Background", "Background."),
      SECTION("journey", "Learning Journey", "Journey."),
      SECTION("advice", "Advice", "Advice for learners."),
    ],
  },
  {
    key: "case_study", name: "Case Study", page_type: "case_study",
    url_pattern: "/case-study/{slug}",
    title_pattern: "{title}",
    meta_pattern: "A detailed case study on {title}.",
    h1_pattern: "{title}",
    variables: ["slug", "title"],
    schema_types: ["Article"], prompt_version: "v1", min_words: 900,
    sections: [
      SECTION("context", "Context", "Context."),
      SECTION("approach", "Approach", "Approach."),
      SECTION("results", "Results", "Results."),
      SECTION("lessons", "Lessons", "Lessons learned."),
    ],
  },
];

export async function seedTemplates(): Promise<{ inserted: number; updated: number; total: number }> {
  const admin = await getAdmin();
  let inserted = 0, updated = 0;
  for (const s of TEMPLATE_SEEDS) {
    const { data: existing } = await admin.from("pseo_templates").select("id").eq("key", s.key).maybeSingle();
    const row = {
      key: s.key, name: s.name, page_type: s.page_type,
      url_pattern: s.url_pattern, title_pattern: s.title_pattern,
      meta_pattern: s.meta_pattern, h1_pattern: s.h1_pattern,
      variables: s.variables, sections: s.sections,
      schema_types: s.schema_types, prompt_version: s.prompt_version,
      min_words: s.min_words, is_active: s.is_active ?? true,
      updated_at: new Date().toISOString(),
    };
    if (existing?.id) {
      await admin.from("pseo_templates").update(row).eq("id", existing.id);
      updated++;
    } else {
      await admin.from("pseo_templates").insert(row);
      inserted++;
    }
  }
  return { inserted, updated, total: TEMPLATE_SEEDS.length };
}

export async function listTemplates(pageType?: PseoPageTypeEx): Promise<PseoTemplate[]> {
  const admin = await getAdmin();
  let q = admin.from("pseo_templates").select("*").eq("is_active", true);
  if (pageType) q = q.eq("page_type", pageType);
  const { data } = await q.order("page_type");
  return (data ?? []) as unknown as PseoTemplate[];
}

export async function getTemplate(id: string): Promise<PseoTemplate | null> {
  const admin = await getAdmin();
  const { data } = await admin.from("pseo_templates").select("*").eq("id", id).maybeSingle();
  return (data as unknown as PseoTemplate) ?? null;
}
