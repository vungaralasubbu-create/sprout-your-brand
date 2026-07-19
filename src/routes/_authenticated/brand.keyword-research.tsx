import { createFileRoute } from "@tanstack/react-router";
import KeywordResearchPage from "./admin.keyword-research";

export const Route = createFileRoute("/_authenticated/brand/keyword-research")({
  component: BrandKeywordResearch,
});

function BrandKeywordResearch() {
  return <KeywordResearchPage />;
}
