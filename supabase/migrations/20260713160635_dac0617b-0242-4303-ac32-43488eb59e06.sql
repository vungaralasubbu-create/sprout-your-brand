
DO $$
DECLARE
  cid uuid := 'a01ad562-2380-4eb9-9732-da65b20bd9b3';
  mid uuid;
BEGIN

UPDATE public.courses SET
  short_description = 'Step into the world of intelligent machines shaping tomorrow. Build production-grade AI systems across healthcare, finance, and automation.',
  full_description = 'A hands-on Artificial Intelligence program that takes you from Python fundamentals to deploying Generative AI, NLP, and Computer Vision systems in production. Learn from top industry mentors, build 10+ portfolio projects inspired by real company use cases, and earn a career-ready certification aligned with roles in AI Engineering, Applied ML, and Generative AI.',
  duration = '4 Months',
  level = 'Beginner to Advanced',
  learning_mode = 'Live + Self-Paced',
  language = 'English',
  weekly_commitment = '6-8 hours / week',
  format = 'Cohort-based',
  prerequisites = 'Basic programming familiarity helps but is not required. We start from Python fundamentals.',
  eligibility = 'Students, working professionals, and career switchers aiming to break into AI, ML, or Generative AI roles.',
  target_audience = 'Aspiring AI Engineers, Sales professionals transitioning to tech, Freshers, and Working professionals upskilling into AI.',
  emi_available = true,
  emi_starting = 2999,
  scholarship_available = true,
  pricing_notes = 'Scholarship up to 30% available for early enrolments. No-cost EMI options available.'
WHERE id = cid;

DELETE FROM course_faqs WHERE course_id = cid;
DELETE FROM course_placement_support WHERE course_id = cid;
DELETE FROM course_certifications WHERE course_id = cid;
DELETE FROM course_career_roles WHERE course_id = cid;
DELETE FROM course_projects WHERE course_id = cid;
DELETE FROM course_skills WHERE course_id = cid;
DELETE FROM course_tools WHERE course_id = cid;
DELETE FROM course_topics WHERE module_id IN (SELECT id FROM course_modules WHERE course_id = cid);
DELETE FROM course_modules WHERE course_id = cid;

INSERT INTO course_modules (course_id, number, name, description, duration, display_order, is_published)
VALUES (cid, 1, 'Foundations of AI & Python for AI', 'Build your AI mindset and master Python for data-driven work.', '3 weeks', 1, true) RETURNING id INTO mid;
INSERT INTO course_topics (module_id, name, description, display_order) VALUES
(mid, 'What is Artificial Intelligence?', 'AI vs. Machine Learning vs. Deep Learning and where each fits.', 1),
(mid, 'Industry Applications in 2026', 'How AI is transforming healthcare, finance, retail, and automation.', 2),
(mid, 'Python Essentials for AI', 'Data types, loops, functions, and clean code habits.', 3),
(mid, 'NumPy, Pandas & Matplotlib', 'The core data science stack for real-world work.', 4);

INSERT INTO course_modules (course_id, number, name, description, duration, display_order, is_published)
VALUES (cid, 2, 'Data Preparation & Feature Engineering', 'Turn messy data into signal-rich features that models can learn from.', '2 weeks', 2, true) RETURNING id INTO mid;
INSERT INTO course_topics (module_id, name, description, display_order) VALUES
(mid, 'Data Cleaning & Transformation', 'Missing values, outliers, encoding, and normalization.', 1),
(mid, 'Feature Scaling & Selection', 'Techniques that meaningfully lift model performance.', 2),
(mid, 'Working with Large Datasets', 'Kaggle, Hugging Face Datasets, and streaming pipelines.', 3),
(mid, 'Ethics & Bias in Data', 'Fairness tooling and responsible AI practices.', 4);

INSERT INTO course_modules (course_id, number, name, description, duration, display_order, is_published)
VALUES (cid, 3, 'Machine Learning & Generative AI', 'From classical ML to modern generative models.', '3 weeks', 3, true) RETURNING id INTO mid;
INSERT INTO course_topics (module_id, name, description, display_order) VALUES
(mid, 'Supervised & Unsupervised Learning', 'Regression, classification, clustering, and evaluation.', 1),
(mid, 'Deep Learning with PyTorch', 'Neural networks, backpropagation, and training tricks.', 2),
(mid, 'Generative AI Foundations', 'Diffusion models, transformers, and prompt engineering.', 3),
(mid, 'AI Code Acceleration', 'Ship faster with GitHub Copilot, Codex, and Tabnine.', 4);

INSERT INTO course_modules (course_id, number, name, description, duration, display_order, is_published)
VALUES (cid, 4, 'Natural Language Processing & LLMs', 'Build with the language models powering modern AI.', '3 weeks', 4, true) RETURNING id INTO mid;
INSERT INTO course_topics (module_id, name, description, display_order) VALUES
(mid, 'Text Processing & Embeddings', 'Tokenization, vector representations, and semantic search.', 1),
(mid, 'Working with LLMs', 'OpenAI, Anthropic, and open-source model APIs.', 2),
(mid, 'RAG & Vector Databases', 'Retrieval-augmented generation with Pinecone, Weaviate, pgvector.', 3),
(mid, 'Building AI Agents', 'Tool use, function calling, and multi-step reasoning.', 4);

INSERT INTO course_modules (course_id, number, name, description, duration, display_order, is_published)
VALUES (cid, 5, 'Computer Vision & Multi-Modal AI', 'Give machines the ability to see, read, and understand.', '2 weeks', 5, true) RETURNING id INTO mid;
INSERT INTO course_topics (module_id, name, description, display_order) VALUES
(mid, 'Image Classification & Detection', 'CNNs, YOLO, and transfer learning.', 1),
(mid, 'Face Recognition & Biometrics', 'Applied identity verification pipelines.', 2),
(mid, 'Vision-Language Models', 'CLIP, BLIP, and multi-modal reasoning.', 3),
(mid, 'AI in Automation', 'Reinforcement learning and real-world automation use cases.', 4);

INSERT INTO course_modules (course_id, number, name, description, duration, display_order, is_published)
VALUES (cid, 6, 'MLOps, Deployment & Capstone', 'Ship AI systems the way real companies do.', '3 weeks', 6, true) RETURNING id INTO mid;
INSERT INTO course_topics (module_id, name, description, display_order) VALUES
(mid, 'Model Deployment on Cloud', 'FastAPI, Docker, AWS, and serverless inference.', 1),
(mid, 'Blue-Green & Zero-Downtime Releases', 'Production-grade deployment patterns.', 2),
(mid, 'Monitoring & Observability', 'Drift detection, evaluation, and cost control.', 3),
(mid, 'Capstone Project', 'Ship a portfolio-worthy AI product end-to-end.', 4);

INSERT INTO skills (name, slug, is_active) VALUES
('Python','ai-python',true),('Machine Learning','ai-machine-learning',true),
('Deep Learning','ai-deep-learning',true),('Generative AI','ai-generative-ai',true),
('Prompt Engineering','ai-prompt-engineering',true),('NLP','ai-nlp',true),
('Computer Vision','ai-computer-vision',true),('MLOps','ai-mlops',true),
('Data Analysis','ai-data-analysis',true),('RAG & Vector DBs','ai-rag-vector-dbs',true)
ON CONFLICT (slug) DO UPDATE SET is_active = true;

INSERT INTO course_skills (course_id, skill_id, display_order)
SELECT cid, s.id, row_number() OVER (ORDER BY s.name)
FROM skills s WHERE s.slug IN
('ai-python','ai-machine-learning','ai-deep-learning','ai-generative-ai','ai-prompt-engineering','ai-nlp','ai-computer-vision','ai-mlops','ai-data-analysis','ai-rag-vector-dbs');

INSERT INTO tools (name, slug, is_active) VALUES
('Python','ai-tool-python',true),('PyTorch','ai-tool-pytorch',true),('TensorFlow','ai-tool-tensorflow',true),
('Hugging Face','ai-tool-hugging-face',true),('OpenAI','ai-tool-openai',true),('LangChain','ai-tool-langchain',true),
('Pandas','ai-tool-pandas',true),('NumPy','ai-tool-numpy',true),('Docker','ai-tool-docker',true),
('AWS','ai-tool-aws',true),('GitHub Copilot','ai-tool-copilot',true),('Pinecone','ai-tool-pinecone',true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_tools (course_id, tool_id, display_order)
SELECT cid, t.id, row_number() OVER (ORDER BY t.name)
FROM tools t WHERE t.slug LIKE 'ai-tool-%';

INSERT INTO career_roles (title, slug, description, salary_min, salary_max, currency, salary_period, is_visible) VALUES
('AI Engineer','ai-role-ai-engineer','Design and deploy AI systems into production products.',800000,2200000,'INR','year',true),
('Machine Learning Engineer','ai-role-ml-engineer','Build, train, and optimize ML models at scale.',900000,2400000,'INR','year',true),
('Generative AI Developer','ai-role-genai-developer','Build LLM-powered products, agents, and RAG systems.',1000000,2800000,'INR','year',true),
('NLP Engineer','ai-role-nlp-engineer','Ship language understanding features into real products.',800000,2000000,'INR','year',true),
('Computer Vision Engineer','ai-role-cv-engineer','Build vision pipelines for automation, security, and healthcare.',800000,2100000,'INR','year',true),
('AI Product Analyst','ai-role-product-analyst','Bridge AI capability with business outcomes.',600000,1500000,'INR','year',true)
ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO course_career_roles (course_id, career_role_id, display_order)
SELECT cid, r.id, row_number() OVER (ORDER BY r.title)
FROM career_roles r WHERE r.slug LIKE 'ai-role-%';

INSERT INTO course_project_templates (name, slug, short_description, difficulty, duration, industry, project_type, is_active) VALUES
('Domain-Specific Compliant Chatbot','ai-proj-chatbot','Ship a RAG-powered chatbot that answers within industry regulations and data privacy standards.','Intermediate','2 weeks','Fintech / Healthcare','Capstone',true),
('Face Recognition Attendance System','ai-proj-face-attendance','Automate identity verification and attendance using facial biometrics with high accuracy.','Intermediate','1 week','Enterprise','Portfolio',true),
('Blue-Green Deployment of an ML Model','ai-proj-blue-green','Deploy ML models with zero downtime by switching traffic between blue and green environments.','Advanced','1 week','MLOps','Capstone',true),
('Generative AI Content Studio','ai-proj-genai-studio','Build a multi-modal content studio using LLMs and diffusion models.','Intermediate','2 weeks','Media','Portfolio',true),
('Financial Fraud Detection with ML','ai-proj-fraud','Detect anomalous transactions in real-time using classical and deep learning models.','Advanced','2 weeks','Fintech','Capstone',true),
('AI Resume Screener for Recruiters','ai-proj-resume','Automate resume shortlisting using embeddings and semantic search.','Beginner','1 week','HRTech','Portfolio',true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO course_projects (course_id, project_id, display_order)
SELECT cid, p.id, row_number() OVER (ORDER BY p.name)
FROM course_project_templates p WHERE p.slug LIKE 'ai-proj-%';

INSERT INTO course_certifications (course_id, name, description, issuer, verification_available, is_enabled) VALUES
(cid, 'Glintr Certified AI Practitioner', 'Awarded on successful completion of coursework, projects, and the capstone. Publicly verifiable via Glintr certificate lookup.', 'Glintr', true, true),
(cid, 'Industry-Aligned AI Portfolio Certificate', 'Recognizes shipped portfolio projects benchmarked against real-world industry use cases.', 'Glintr Career Services', true, true);

INSERT INTO course_placement_support (course_id, support_type, description, is_enabled, display_order) VALUES
(cid, '1:1 Career Mentorship', 'Personalized mentorship from working AI engineers throughout the program.', true, 1),
(cid, 'AI-Powered Mock Interviews', 'Unlimited technical and HR mock interviews with instant AI feedback.', true, 2),
(cid, 'Resume & LinkedIn Optimization', 'Recruiter-grade resume and portfolio review from career coaches.', true, 3),
(cid, 'Job Referral Network', 'Referrals into 200+ hiring partners across AI, SaaS, and enterprise.', true, 4),
(cid, 'Portfolio & Capstone Reviews', 'Live reviews to make your work stand out to hiring managers.', true, 5);

INSERT INTO course_faqs (course_id, question, answer, display_order, is_enabled) VALUES
(cid, 'Do I need a coding background to join this AI program?', 'No. We start from Python fundamentals and gradually move into ML, Deep Learning, and Generative AI. Anyone with basic logical thinking can succeed.', 1, true),
(cid, 'How long is the program and what is the weekly commitment?', 'The program runs for 4 months with a commitment of 6-8 hours per week, including live sessions and hands-on projects.', 2, true),
(cid, 'What kind of projects will I build?', 'You will ship 6+ industry-inspired projects including a domain-specific chatbot, face recognition attendance system, fraud detection, and a capstone AI product deployed to production.', 3, true),
(cid, 'What certification will I receive?', 'You will earn the Glintr Certified AI Practitioner credential along with a portfolio certificate that recognises your shipped projects. Both are publicly verifiable.', 4, true),
(cid, 'Is placement support included?', 'Yes. You get 1:1 mentorship, AI-powered mock interviews, resume and LinkedIn reviews, and referrals into 200+ hiring partners.', 5, true),
(cid, 'Are scholarships or EMI available?', 'Yes. Scholarships up to 30% are offered for early enrolments and no-cost EMI options start from ₹2,999/month.', 6, true),
(cid, 'Will this course help me switch into an AI career?', 'Absolutely. The curriculum, projects, and career services are all designed for career switchers moving into AI Engineering, ML, or Generative AI roles.', 7, true),
(cid, 'What is the refund policy?', 'You can request a full refund within the first 7 days of the program if you are not satisfied, no questions asked.', 8, true);

END $$;
