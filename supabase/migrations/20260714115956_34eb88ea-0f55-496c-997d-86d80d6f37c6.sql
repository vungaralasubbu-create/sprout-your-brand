
DO $$
DECLARE
  ml_id uuid := 'fd8acc36-4926-4440-b119-7f2d22f5a0f3';
BEGIN
  UPDATE courses SET
    short_description = 'Master the algorithms and systems that power modern intelligent products — from prediction and personalization to real-time decisioning.',
    full_description = 'A rigorous, career-focused Machine Learning program that takes you from statistical foundations to production-grade ML systems. Build end-to-end pipelines, deploy models, and ship portfolio work benchmarked against real industry problems in fintech, e-commerce, and SaaS.',
    is_bestseller = true,
    is_featured = true
  WHERE id = ml_id;

  INSERT INTO course_modules (course_id, number, name, description, duration, display_order) VALUES
    (ml_id, 1, 'Foundations of ML & Python for Data', 'Refresh Python, NumPy, pandas, and the math intuition — linear algebra, probability, and statistics — that every ML engineer relies on daily.', '2 weeks', 1),
    (ml_id, 2, 'Supervised Learning', 'Regression and classification with linear models, tree ensembles, and gradient boosting. Feature engineering, cross-validation, and metric selection.', '3 weeks', 2),
    (ml_id, 3, 'Unsupervised Learning', 'Clustering, dimensionality reduction, and anomaly detection applied to segmentation and fraud detection.', '2 weeks', 3),
    (ml_id, 4, 'Deep Learning Essentials', 'Neural networks, backpropagation, CNNs and RNNs using PyTorch — with a focus on when deep learning is the right tool.', '3 weeks', 4),
    (ml_id, 5, 'NLP & Modern Transformers', 'Text pipelines, embeddings, and fine-tuning transformer models for classification, summarization, and search.', '2 weeks', 5),
    (ml_id, 6, 'MLOps & Model Deployment', 'Experiment tracking, model registries, containerization, and serving models behind a REST API with monitoring.', '2 weeks', 6),
    (ml_id, 7, 'Applied Case Studies', 'Recommendation systems, demand forecasting, churn prediction, and credit risk — modeled end-to-end.', '2 weeks', 7),
    (ml_id, 8, 'Capstone Project', 'Ship a production-ready ML system with a written case study you can defend in interviews.', '2 weeks', 8);

  -- Ensure skills exist (by name), then link
  WITH skill_names(name, ord) AS (VALUES
    ('Python for ML',1), ('Statistical Modeling',2), ('Feature Engineering',3), ('Scikit-learn',4),
    ('PyTorch',5), ('Deep Learning',6), ('NLP',7), ('Model Evaluation',8),
    ('MLOps',9), ('Model Deployment',10), ('Experiment Tracking',11), ('Data Storytelling',12)
  ),
  ensured AS (
    INSERT INTO skills (name, slug)
    SELECT sn.name, lower(regexp_replace(sn.name, '[^a-zA-Z0-9]+', '-', 'g'))
    FROM skill_names sn
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  )
  INSERT INTO course_skills (course_id, skill_id, display_order)
  SELECT ml_id, e.id, sn.ord
  FROM skill_names sn JOIN ensured e ON e.name = sn.name
  ON CONFLICT DO NOTHING;

  WITH tool_names(name, ord) AS (VALUES
    ('Python',1), ('Jupyter',2), ('scikit-learn',3), ('PyTorch',4),
    ('Pandas',5), ('MLflow',6), ('Docker',7), ('FastAPI',8)
  ),
  ensured AS (
    INSERT INTO tools (name, slug)
    SELECT tn.name, lower(regexp_replace(tn.name, '[^a-zA-Z0-9]+', '-', 'g'))
    FROM tool_names tn
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, name
  )
  INSERT INTO course_tools (course_id, tool_id, display_order)
  SELECT ml_id, e.id, tn.ord
  FROM tool_names tn JOIN ensured e ON e.name = tn.name
  ON CONFLICT DO NOTHING;

  WITH role_data(title, description, smin, smax, ord) AS (VALUES
    ('Machine Learning Engineer', 'Build, ship, and maintain ML systems in production across teams.', 900000, 2800000, 1),
    ('Data Scientist', 'Translate business questions into models, experiments, and measurable outcomes.', 800000, 2400000, 2),
    ('Applied ML Researcher', 'Prototype and evaluate modeling approaches for high-value product problems.', 1200000, 3500000, 3),
    ('MLOps Engineer', 'Own the infrastructure that makes ML reliable, reproducible, and observable.', 1000000, 2800000, 4),
    ('AI Product Analyst', 'Bridge product and modeling teams — measure impact and shape roadmap.', 700000, 1800000, 5),
    ('NLP Engineer', 'Design language and search systems powered by modern transformer models.', 1000000, 3000000, 6)
  ),
  ensured AS (
    INSERT INTO career_roles (title, slug, description, salary_min, salary_max, currency, salary_period)
    SELECT rd.title, lower(regexp_replace(rd.title, '[^a-zA-Z0-9]+', '-', 'g')), rd.description, rd.smin, rd.smax, 'INR', 'yearly'
    FROM role_data rd
    ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, salary_min = EXCLUDED.salary_min, salary_max = EXCLUDED.salary_max
    RETURNING id, title
  )
  INSERT INTO course_career_roles (course_id, career_role_id, display_order)
  SELECT ml_id, e.id, rd.ord
  FROM role_data rd JOIN ensured e ON e.title = rd.title
  ON CONFLICT DO NOTHING;

  INSERT INTO course_faqs (course_id, question, answer, display_order) VALUES
    (ml_id, 'Do I need prior programming experience?', 'Comfort with basic Python is helpful. The first module refreshes the essentials so learners with limited exposure can catch up quickly.', 1),
    (ml_id, 'How is the program delivered?', 'A blend of live mentor sessions, structured self-paced modules, weekly assignments, and hands-on projects reviewed by industry mentors.', 2),
    (ml_id, 'What kind of projects will I build?', 'End-to-end projects spanning prediction, recommendation, NLP, and MLOps — each modeled on real industry problems and defensible in interviews.', 3),
    (ml_id, 'Will I get placement support?', 'Yes. Portfolio reviews, mock interviews, resume audits, and referrals to hiring partners are included as part of the program.', 4),
    (ml_id, 'Are EMI options available?', 'Yes, flexible EMI plans are available so you can pay in comfortable monthly installments.', 5);

  INSERT INTO course_certifications (course_id, name, description, issuer) VALUES
    (ml_id, 'Machine Learning Professional Certificate', 'Awarded on successful completion of coursework, projects, and capstone — verifiable via a shareable link.', 'Glintr');

  INSERT INTO course_placement_support (course_id, support_type, description, display_order) VALUES
    (ml_id, '1:1 Mentor Reviews', 'Weekly reviews with practicing ML engineers on your code, models, and portfolio work.', 1),
    (ml_id, 'Interview Preparation', 'Mock interviews covering ML fundamentals, case studies, and system design.', 2),
    (ml_id, 'Resume & Portfolio Audit', 'Structured audit of your resume, GitHub, and case study writeups.', 3),
    (ml_id, 'Hiring Partner Referrals', 'Introductions to hiring partners actively looking for ML talent.', 4);
END $$;
