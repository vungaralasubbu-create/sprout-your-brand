import type { ComponentType } from "react";
import { AiCareerFinder } from "./impl/ai-career-finder";
import { LearningRoadmapTool } from "./impl/learning-roadmap";
import { SkillGapAnalyzer } from "./impl/skill-gap-analyzer";
import { AiPromptBuilder } from "./impl/ai-prompt-builder";
import { StudyPlanner } from "./impl/study-planner";
import { RevenueShareCalculator } from "./impl/revenue-share-calculator";
import { ResumeAnalyzer } from "./impl/resume-analyzer";
import { InterviewQuestions } from "./impl/interview-questions";
import { LearningTimeEstimator } from "./impl/learning-time-estimator";
import { CertificationPathFinder } from "./impl/certification-path-finder";
import { ProgramComparisonTool } from "./impl/program-comparison";

export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  "ai-career-finder": AiCareerFinder,
  "learning-roadmap": LearningRoadmapTool,
  "skill-gap-analyzer": SkillGapAnalyzer,
  "ai-prompt-builder": AiPromptBuilder,
  "study-planner": StudyPlanner,
  "revenue-share-calculator": RevenueShareCalculator,
  "resume-analyzer": ResumeAnalyzer,
  "interview-questions": InterviewQuestions,
  "learning-time-estimator": LearningTimeEstimator,
  "certification-path-finder": CertificationPathFinder,
  "program-comparison": ProgramComparisonTool,
};
