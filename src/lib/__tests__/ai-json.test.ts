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

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
