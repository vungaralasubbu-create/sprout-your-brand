/**
 * Per-category career insights used on Programs & Category pages.
 * Editorial data, curated — not auto-generated. Keep values realistic and
 * India-market oriented (INR, INR lakhs where relevant).
 */

export interface CategoryInsights {
  /** Compact list surfaced on the /programs category cards. */
  topCareerOutcomes: string[];
  /** Approx. entry-to-senior salary band, formatted for display. */
  averageSalary: string;
  /** Roles hiring most actively for this category. */
  topRoles: string[];
  /** Well-known hiring companies (mix of enterprise + startups). */
  companies: string[];
  /** Approx. counts to enrich category cards without a live query. */
  learningPathsCount: number;
}

const INSIGHTS: Record<string, CategoryInsights> = {
  "computer-science": {
    topCareerOutcomes: [
      "AI / ML Engineer",
      "Full-Stack Developer",
      "Prompt Engineer",
      "Mobile App Developer",
    ],
    averageSalary: "₹6–28 LPA",
    topRoles: [
      "AI Engineer",
      "Machine Learning Engineer",
      "Full-Stack Developer",
      "Data Scientist",
      "iOS / Android Engineer",
    ],
    companies: ["Google", "Microsoft", "Amazon", "Flipkart", "Zoho", "Razorpay", "Freshworks"],
    learningPathsCount: 6,
  },
  "electronics-electrical": {
    topCareerOutcomes: [
      "VLSI Design Engineer",
      "Embedded Systems Engineer",
      "Power Electronics Engineer",
      "IoT Systems Engineer",
    ],
    averageSalary: "₹5–22 LPA",
    topRoles: [
      "VLSI Design Engineer",
      "Verification Engineer",
      "Embedded Engineer",
      "Power Systems Engineer",
      "IoT Engineer",
    ],
    companies: ["Intel", "Qualcomm", "Texas Instruments", "NXP", "Bosch", "Siemens", "L&T"],
    learningPathsCount: 4,
  },
  "mechanical-engineering": {
    topCareerOutcomes: [
      "Design Engineer (CAD/CAM)",
      "CAE / Simulation Engineer",
      "Manufacturing Engineer",
      "Product Development Engineer",
    ],
    averageSalary: "₹4–18 LPA",
    topRoles: [
      "Design Engineer",
      "CAE Engineer",
      "Manufacturing Engineer",
      "Automotive R&D Engineer",
      "Robotics Engineer",
    ],
    companies: ["Tata Motors", "Mahindra", "Bosch", "L&T", "Siemens", "Ather", "Ola Electric"],
    learningPathsCount: 4,
  },
  management: {
    topCareerOutcomes: [
      "Digital Marketing Manager",
      "Product Manager",
      "HR Business Partner",
      "Finance Analyst",
    ],
    averageSalary: "₹5–24 LPA",
    topRoles: [
      "Product Manager",
      "Digital Marketer",
      "HR Business Partner",
      "Financial Analyst",
      "Operations Manager",
    ],
    companies: ["Deloitte", "EY", "Accenture", "Zomato", "Swiggy", "HDFC", "ICICI"],
    learningPathsCount: 5,
  },
};

export function getCategoryInsights(slug: string): CategoryInsights | null {
  return INSIGHTS[slug] ?? null;
}
