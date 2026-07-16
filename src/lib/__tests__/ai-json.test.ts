/**
 * Standalone tests for the AI JSON parser.
 * Run with:  bun run src/lib/__tests__/ai-json.test.ts
 * (No test framework required — asserts throw and print PASS/FAIL.)
 */
import { AiJsonParseError, detectTruncation, parseAiJson } from "../ai-json";

let passed = 0;
let failed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e: any) {
    failed++;
    console.error(`  ✗ ${name}\n    ${e?.message ?? e}`);
  }
}
function assert(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}
function eq(a: any, b: any, msg = "not equal") {
  if (a !== b) throw new Error(`${msg}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`);
}

// --- basic cases ---
test("parses clean JSON object", () => {
  const out = parseAiJson<{ a: number }>('{"a":1}');
  eq(out.a, 1);
});

test("strips ```json fences", () => {
  const out = parseAiJson<{ ok: boolean }>("```json\n{\"ok\":true}\n```");
  eq(out.ok, true);
});

test("strips prose before and after JSON", () => {
  const out = parseAiJson<{ x: string }>('Sure! Here is the answer:\n{"x":"hi"}\nHope that helps.');
  eq(out.x, "hi");
});

test("repairs trailing commas", () => {
  const out = parseAiJson<{ a: number; b: number[] }>('{"a":1,"b":[1,2,],}');
  eq(out.a, 1);
  eq(out.b.length, 2);
});

test("escapes raw newlines in string values (markdown body)", () => {
  const raw = '{"body":"# Heading\nA paragraph with a newline."}';
  const out = parseAiJson<{ body: string }>(raw);
  assert(out.body.includes("\n"), "newline preserved");
  assert(out.body.startsWith("# Heading"), "heading preserved");
});

test("escapes raw tabs in string values", () => {
  const raw = '{"body":"col1\tcol2"}';
  const out = parseAiJson<{ body: string }>(raw);
  eq(out.body, "col1\tcol2");
});

test("escapes stray backslashes (bad escape char)", () => {
  // A regex fragment like \d inside the markdown body is the canonical
  // 'Bad escaped character in JSON' trigger.
  const raw = '{"body":"Regex: \\d+ matches digits, and a windows path C:\\Users\\me"}';
  const out = parseAiJson<{ body: string }>(raw);
  assert(out.body.includes("\\d+"), "regex kept");
  assert(out.body.includes("C:\\Users"), "path kept");
});

test("detects truncation on unbalanced braces", () => {
  eq(detectTruncation('{"a":1,"b":{'), true);
  eq(detectTruncation('{"a":1}'), false);
});

test("throws AiJsonParseError with field diagnostic", () => {
  const raw = '{"title":"ok","body_markdown":"broken \\x nope"';
  try {
    parseAiJson(raw);
    throw new Error("should have thrown");
  } catch (e: any) {
    assert(e instanceof AiJsonParseError, "wrong error type");
    assert(e.raw === raw, "raw preserved");
    assert(typeof e.truncated === "boolean", "truncated flag present");
  }
});

// --- large-payload test (>15,000 chars) ---
test("parses large markdown body (>15,000 chars) with escapes", () => {
  const bodyLines: string[] = [];
  for (let i = 0; i < 400; i++) {
    bodyLines.push(`## Section ${i}`);
    bodyLines.push(`This is paragraph ${i} with a tab\there and a regex \\d+ token.`);
    bodyLines.push("- bullet one");
    bodyLines.push("- bullet two");
    bodyLines.push("");
    bodyLines.push("| col a | col b |");
    bodyLines.push("|-------|-------|");
    bodyLines.push("| x     | y     |");
    bodyLines.push("");
  }
  const body = bodyLines.join("\n");
  assert(body.length > 15000, `body should exceed 15k, got ${body.length}`);

  // Simulate the AI response: JSON envelope with raw markdown embedded.
  // NOTE the raw \n, \t and \d — the exact defect that produces
  // 'Bad escaped character in JSON'.
  const raw = `\`\`\`json\n{"title":"Huge Article","slug":"huge","body_markdown":"${body
    .replace(/"/g, '\\"')}"}\n\`\`\``;

  const out = parseAiJson<{ title: string; slug: string; body_markdown: string }>(raw);
  eq(out.title, "Huge Article");
  eq(out.slug, "huge");
  assert(out.body_markdown.length > 15000, "body preserved through parse");
  assert(out.body_markdown.includes("\\d+"), "regex fragment preserved");
  assert(out.body_markdown.includes("\t"), "tab preserved");
});

// --- 4,000-word article integration test with FAQs + SEO + image prompts ---
// This reproduces the EXACT failure mode reported by the user: Gemini
// returning a JSON envelope containing markdown with regex/LaTeX/Windows-path
// backslashes. Before the fix, JSON.parse throws "Bad escaped character in
// JSON" here. After the fix, parseAiJson repairs and returns the full draft.
test("parses simulated 4,000-word AI draft (FAQs + SEO + image prompts + regex + LaTeX)", () => {
  const paras: string[] = [];
  let words = 0;
  let i = 0;
  while (words < 4000) {
    i++;
    const p =
      `## Section ${i}: Deep Dive\n\n` +
      `Paragraph ${i} discusses regex like \\d+ and \\w+, LaTeX like \\alpha and \\sum_{n=1}^{k}, ` +
      `and Windows paths such as C:\\Users\\model\\weights.bin. It also uses tabs\there\tand newlines.\n\n` +
      "| Metric | Value |\n|--------|-------|\n| Accuracy | 92% |\n| F1 | 0.88 |\n\n" +
      "> **Note:** Always validate your training data.\n\n" +
      "- Bullet with a \\backslash\n- Bullet with quotes \"inline\"\n- Bullet with a link [Glintr](/programs)\n\n";
    paras.push(p);
    words += p.split(/\s+/).filter(Boolean).length;
  }
  const body = ["{{HERO_IMAGE}}\n", ...paras, "{{SECTION_IMAGE_1}}", "{{SECTION_IMAGE_2}}"].join("\n");
  assert(body.split(/\s+/).filter(Boolean).length >= 4000, "body should be >= 4000 words");

  // Simulate the raw AI response: single JSON envelope with body_markdown,
  // faqs (with quotes and backslashes), seo, and image_plan.prompt strings.
  const faqs = [
    { question: 'What does \\d+ mean?', answer: "It matches one or more digits.\nExample:\t\\d{2,4}" },
    { question: "How do I set PYTHONPATH on Windows?", answer: "Use C:\\Users\\you\\envs on the path." },
    { question: "What is the loss function?", answer: "We minimize \\sum_i (y_i - \\hat y_i)^2." },
  ];
  const draft = {
    title: "The 4,000-Word Test Article",
    slug: "four-thousand-word-test",
    seo_title: "4,000-Word Test — Regex, LaTeX, Paths",
    seo_description: "A stress test with regex \\d+, LaTeX \\alpha, and Windows paths C:\\Users.",
    body_markdown: body,
    faqs,
    keywords: ["regex", "\\d+", "latex", "training"],
    image_plan: {
      hero: { prompt: "cyber-editorial hero, no text, C:\\Users lighting hint", alt: "Hero" },
      sections: [
        { key: "SECTION_IMAGE_1", prompt: "diagram of \\alpha decay", alt: "Alpha" },
        { key: "SECTION_IMAGE_2", prompt: "matrix showing \\sum operator", alt: "Sum" },
      ],
    },
  };

  // Build the raw response the way the model emits it: JSON.stringify would
  // escape correctly, but we deliberately break it — inject a single-backslash
  // \d and \alpha and C:\Users the way Gemini sometimes does under load —
  // to prove the parser can repair the exact defect.
  const proper = JSON.stringify(draft);
  const corrupted = proper
    // Reintroduce single-backslash escapes the model tends to emit:
    .replace(/\\\\d\+/g, "\\d+")
    .replace(/\\\\w\+/g, "\\w+")
    .replace(/\\\\alpha/g, "\\alpha")
    .replace(/\\\\sum/g, "\\sum")
    .replace(/\\\\hat/g, "\\hat")
    .replace(/C:\\\\Users/g, "C:\\Users");
  const raw = "```json\n" + corrupted + "\n```";
  assert(raw.length > 15000, `raw payload should be large, got ${raw.length}`);

  // Sanity: strict JSON.parse must FAIL on the corrupted payload — this is
  // the exact "Bad escaped character in JSON" scenario.
  let strictFailed = false;
  try {
    JSON.parse(corrupted);
  } catch (e: any) {
    strictFailed = true;
    assert(/bad escaped|unexpected|invalid|escape/i.test(e.message), `unexpected error: ${e.message}`);
  }
  assert(strictFailed, "strict JSON.parse should fail on corrupted payload");

  // The robust parser must recover the full draft.
  const out = parseAiJson<any>(raw);
  eq(out.title, "The 4,000-Word Test Article");
  eq(out.slug, "four-thousand-word-test");
  assert(out.faqs.length === 3, "faqs preserved");
  assert(out.keywords.includes("regex"), "keywords preserved");
  assert(out.body_markdown.length > 10000, `body preserved, got ${out.body_markdown.length}`);
  assert(out.body_markdown.includes("{{HERO_IMAGE}}"), "hero token preserved");
  assert(out.body_markdown.includes("{{SECTION_IMAGE_1}}"), "section token preserved");
  assert(out.image_plan?.hero?.prompt, "image_plan.hero.prompt preserved");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
