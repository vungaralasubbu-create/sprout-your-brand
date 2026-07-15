
WITH cs AS (SELECT id FROM course_categories WHERE slug='computer-science')
INSERT INTO courses (category_id, name, slug, short_description, full_description, status, is_published, is_featured, is_trending, is_popular, display_order, duration, learning_mode, level, language, format, target_audience, base_price, offer_price, currency, emi_available, seo_title, seo_description)
SELECT cs.id, v.name, v.slug, v.short_description, v.full_description, 'published', true, true, true, true, v.display_order, '2 months', 'Online', 'Beginner to Advanced', 'English', 'Self-paced with mentor support', v.target_audience, 18000, 12000, 'INR', true, v.seo_title, v.seo_description
FROM cs, (VALUES
  ('ChatGPT','chatgpt',
    'Learn to use ChatGPT for structured prompting, research, content workflows, productivity, analysis and practical AI-assisted work.',
    'A practical program on conversational AI. ChatGPT is a trademark of OpenAI; this program is educational and not affiliated with or endorsed by OpenAI.',
    9,'Professionals, students and creators who want to work more effectively with conversational AI.',
    'ChatGPT Course | Glintr','Practical program on structured prompting and ChatGPT workflows.'),
  ('Claude AI','claude-ai',
    'Explore Claude for structured reasoning workflows, document-based tasks, writing, analysis and practical AI-assisted work.',
    'A practical program on document-focused AI workflows. Claude is a trademark of Anthropic; this program is educational and not affiliated with or endorsed by Anthropic.',
    10,'Analysts, writers, researchers and professionals working with documents.',
    'Claude AI Course | Glintr','Practical program on AI workflows for documents and structured analysis with Claude.'),
  ('Gemini AI','gemini-ai',
    'Explore Gemini AI for multimodal concepts, research workflows, productivity and practical AI-assisted tasks.',
    'A practical program on multimodal AI concepts. Gemini is a trademark of Google; this program is educational and not affiliated with or endorsed by Google.',
    11,'Professionals, students and creators interested in multimodal AI.',
    'Gemini AI Course | Glintr','Practical program on multimodal AI concepts with Gemini AI.')
) AS v(name, slug, short_description, full_description, display_order, target_audience, seo_title, seo_description)
ON CONFLICT DO NOTHING;

INSERT INTO course_modules (course_id, number, name, description, display_order)
SELECT c.id, m.n, m.name, m.description, m.n - 1
FROM courses c, (VALUES
  (1,'Introduction To Conversational AI','Understanding what conversational AI is and how it differs from search.'),
  (2,'Understanding ChatGPT','Overview of ChatGPT capabilities, versions and safe use.'),
  (3,'Prompt Fundamentals','How prompts shape AI responses — goals, roles, tone.'),
  (4,'Goals And Instructions','Writing clear objectives and explicit instructions.'),
  (5,'Providing Useful Context','Adding relevant background so responses stay grounded.'),
  (6,'Prompt Structure','Composing multi-part prompts with sections and constraints.'),
  (7,'Output Formatting','Guiding structure — lists, tables, JSON, outlines.'),
  (8,'Prompt Refinement','Iterating and correcting responses effectively.'),
  (9,'Research Workflows','Using ChatGPT to explore, summarise and structure findings.'),
  (10,'Content Workflows','Drafting, editing and repurposing content responsibly.'),
  (11,'Productivity Workflows','Meeting prep, planning, writing assistance.'),
  (12,'Analysis Workflows','Breaking down problems, comparing options, structured reasoning.'),
  (13,'Working With Documents','Extracting insight from pasted or attached content.'),
  (14,'Responsible AI Use','Bias, privacy, disclosure and safe practice.'),
  (15,'Limitations And Verification','Hallucinations, factual checking and human review.'),
  (16,'Building Repeatable AI Workflows','Turning good prompts into reusable playbooks.'),
  (17,'Practical Projects','Applying concepts to real work.'),
  (18,'Final Learning Experience','Consolidation project and reflection.')
) AS m(n,name,description)
WHERE c.slug='chatgpt';

INSERT INTO course_modules (course_id, number, name, description, display_order)
SELECT c.id, m.n, m.name, m.description, m.n - 1
FROM courses c, (VALUES
  (1,'Introduction To Claude AI','What Claude is and where it fits among AI assistants.'),
  (2,'Understanding AI Assistants','How modern assistants reason over instructions and context.'),
  (3,'Prompt Fundamentals','Foundations of clear, effective prompting.'),
  (4,'Context And Instructions','Combining source material with directions.'),
  (5,'Working With Longer Information','Handling long inputs and layered context.'),
  (6,'Document-Based Workflows','Using Claude on briefs, reports and structured documents.'),
  (7,'Structuring Analysis','Frameworks for breaking down and analysing information.'),
  (8,'Writing Workflows','Drafting, editing and refining long-form writing.'),
  (9,'Research Support','Supporting research with structured questioning.'),
  (10,'Summarising Information','Producing accurate, faithful summaries.'),
  (11,'Comparing Information','Side-by-side analysis and reasoning.'),
  (12,'Building Repeatable Workflows','Templated Claude workflows for recurring tasks.'),
  (13,'Reviewing AI Output','Critical review and correction techniques.'),
  (14,'Limitations And Verification','Understanding limits and verifying claims.'),
  (15,'Responsible AI Use','Ethics, privacy and disclosure.'),
  (16,'Practical Projects','Applying Claude to real information tasks.'),
  (17,'Final Learning Experience','Consolidation project and reflection.')
) AS m(n,name,description)
WHERE c.slug='claude-ai';

INSERT INTO course_modules (course_id, number, name, description, display_order)
SELECT c.id, m.n, m.name, m.description, m.n - 1
FROM courses c, (VALUES
  (1,'Introduction To Gemini AI','What Gemini is and where multimodal AI fits.'),
  (2,'Understanding Generative AI','Foundations of generative and multimodal systems.'),
  (3,'Multimodal AI Concepts','Text, image and document modalities working together.'),
  (4,'Prompt Fundamentals','Clear prompting for multimodal tasks.'),
  (5,'Context And Instructions','Framing rich context across modalities.'),
  (6,'Text Workflows','Writing, editing and reasoning tasks.'),
  (7,'Visual Information Concepts','Working with images as inputs where supported.'),
  (8,'Document Workflows','Using Gemini with structured documents.'),
  (9,'Research Workflows','Research plans, sources and structured synthesis.'),
  (10,'Information Synthesis','Connecting information across modalities.'),
  (11,'Productivity Workflows','Practical productivity approaches.'),
  (12,'Structured Output','Directing consistent, structured responses.'),
  (13,'Reviewing AI Responses','Critical review of multimodal output.'),
  (14,'Limitations And Verification','Where Gemini can and cannot help — verification.'),
  (15,'Responsible AI Use','Ethics, privacy, disclosure and safe use.'),
  (16,'Practical Projects','Applied multimodal projects.'),
  (17,'Final Learning Experience','Consolidation project and reflection.')
) AS m(n,name,description)
WHERE c.slug='gemini-ai';

INSERT INTO skills (name, slug) VALUES
  ('Prompt Engineering','prompt-engineering'),
  ('AI Workflows','ai-workflows'),
  ('Context Design','context-design'),
  ('Structured Reasoning','structured-reasoning'),
  ('Document Analysis','document-analysis'),
  ('Multimodal AI','multimodal-ai'),
  ('Information Synthesis','information-synthesis'),
  ('Responsible AI Use','responsible-ai-use'),
  ('AI-Assisted Research','ai-assisted-research'),
  ('AI-Assisted Writing','ai-assisted-writing')
ON CONFLICT (name) DO NOTHING;

INSERT INTO course_skills (course_id, skill_id, display_order)
SELECT c.id, s.id, (ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY s.name))::int - 1
FROM courses c
JOIN skills s ON s.name = ANY(
  CASE c.slug
    WHEN 'chatgpt' THEN ARRAY['Prompt Engineering','AI Workflows','Context Design','AI-Assisted Research','AI-Assisted Writing','Responsible AI Use']
    WHEN 'claude-ai' THEN ARRAY['Prompt Engineering','Document Analysis','Structured Reasoning','AI-Assisted Writing','AI Workflows','Responsible AI Use']
    WHEN 'gemini-ai' THEN ARRAY['Prompt Engineering','Multimodal AI','Information Synthesis','AI-Assisted Research','AI Workflows','Responsible AI Use']
  END
)
WHERE c.slug IN ('chatgpt','claude-ai','gemini-ai');

INSERT INTO course_faqs (course_id, question, answer, display_order)
SELECT c.id, f.q, f.a, f.o FROM courses c, (VALUES
  ('Is this program affiliated with OpenAI?','No. ChatGPT is a trademark of OpenAI. This program is independent and educational.', 0),
  ('Do I need prior AI experience?','No. The program starts from fundamentals.', 1),
  ('Will I get a Glintr certificate?','Yes, on completion.', 2),
  ('Does the course include an OpenAI subscription?','No. You use your own ChatGPT access.', 3)
) AS f(q,a,o) WHERE c.slug='chatgpt';

INSERT INTO course_faqs (course_id, question, answer, display_order)
SELECT c.id, f.q, f.a, f.o FROM courses c, (VALUES
  ('Is this program affiliated with Anthropic?','No. Claude is a trademark of Anthropic. This program is independent and educational.', 0),
  ('Do I need prior AI experience?','No.', 1),
  ('Will I get a Glintr certificate?','Yes, on completion.', 2),
  ('Does the course include a Claude subscription?','No. You use your own access to Claude.', 3)
) AS f(q,a,o) WHERE c.slug='claude-ai';

INSERT INTO course_faqs (course_id, question, answer, display_order)
SELECT c.id, f.q, f.a, f.o FROM courses c, (VALUES
  ('Is this program affiliated with Google?','No. Gemini is a trademark of Google. This program is independent and educational.', 0),
  ('Are all Gemini features covered?','Concepts are covered; specific Gemini features may vary by product plan and region.', 1),
  ('Do I need prior AI experience?','No.', 2),
  ('Will I get a Glintr certificate?','Yes, on completion.', 3)
) AS f(q,a,o) WHERE c.slug='gemini-ai';
