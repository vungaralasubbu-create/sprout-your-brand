
-- Enterprise Success Stories module
CREATE TABLE IF NOT EXISTS public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  role text NOT NULL,
  company text NOT NULL,
  company_slug text,
  company_domain text,
  course text NOT NULL,
  course_category text,
  batch text,
  package_label text,
  package_lpa numeric,
  location text,
  graduation_year integer,
  rating smallint NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  quote text NOT NULL,
  linkedin_url text,
  story_url text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS success_stories_published_sort_idx
  ON public.success_stories (published, featured DESC, sort_order ASC, created_at DESC);
CREATE INDEX IF NOT EXISTS success_stories_course_category_idx
  ON public.success_stories (course_category);

GRANT SELECT ON public.success_stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.success_stories TO authenticated;
GRANT ALL ON public.success_stories TO service_role;

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published success stories"
  ON public.success_stories FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can read all success stories"
  ON public.success_stories FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert success stories"
  ON public.success_stories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can update success stories"
  ON public.success_stories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete success stories"
  ON public.success_stories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_success_stories_updated_at
  BEFORE UPDATE ON public.success_stories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed professional demo data
INSERT INTO public.success_stories
  (name, avatar_url, role, company, company_slug, company_domain, course, course_category, batch, package_label, package_lpa, location, graduation_year, rating, quote, featured, sort_order)
VALUES
  ('Aarav Sharma', 'https://api.dicebear.com/9.x/initials/svg?seed=Aarav%20Sharma&backgroundType=gradientLinear&backgroundColor=0284c7,0ea5e9&fontFamily=Inter&fontWeight=600&radius=50', 'AI Engineer', 'Google', 'google', 'google.com', 'Artificial Intelligence Program', 'artificial-intelligence', '2026 Batch', '₹18 LPA', 18, 'Bengaluru', 2026, 5, 'Glintr completely changed my career. The live projects and interview preparation helped me secure my dream role at Google.', true, 1),
  ('Priya Reddy', 'https://api.dicebear.com/9.x/initials/svg?seed=Priya%20Reddy&backgroundType=gradientLinear&backgroundColor=db2777,f472b6&fontFamily=Inter&fontWeight=600&radius=50', 'Product Designer', 'Swiggy', 'swiggy', 'swiggy.com', 'Product Design Bootcamp', 'design', '2025 Batch', '₹14 LPA', 14, 'Hyderabad', 2025, 5, 'Weekly design critiques and 1:1 mentor sessions changed how I think about products. I landed my first design role in 4 months.', true, 2),
  ('Rahul Kumar', 'https://api.dicebear.com/9.x/initials/svg?seed=Rahul%20Kumar&backgroundType=gradientLinear&backgroundColor=1d4ed8,3b82f6&fontFamily=Inter&fontWeight=600&radius=50', 'Full Stack Engineer', 'Razorpay', 'razorpay', 'razorpay.com', 'Full Stack Web Development', 'web-development', '2025 Batch', '₹22 LPA', 22, 'Bengaluru', 2025, 5, 'Career coaching helped me package 3 years of hidden experience into a story recruiters actually wanted to hear.', true, 3),
  ('Sneha Patel', 'https://api.dicebear.com/9.x/initials/svg?seed=Sneha%20Patel&backgroundType=gradientLinear&backgroundColor=7c3aed,a78bfa&fontFamily=Inter&fontWeight=600&radius=50', 'ML Engineer', 'Flipkart', 'flipkart', 'flipkart.com', 'Machine Learning Advanced', 'machine-learning', '2026 Batch', '₹16 LPA', 16, 'Bengaluru', 2026, 5, 'The capstone project got me my first offer. I shipped a recommendation system that mirrored real production constraints.', false, 4),
  ('Akash Verma', 'https://api.dicebear.com/9.x/initials/svg?seed=Akash%20Verma&backgroundType=gradientLinear&backgroundColor=ea580c,fb923c&fontFamily=Inter&fontWeight=600&radius=50', 'Cloud DevOps Engineer', 'Amazon', 'amazon', 'amazon.com', 'Cloud & DevOps Mastery', 'cloud-computing', '2025 Batch', '₹20 LPA', 20, 'Hyderabad', 2025, 5, 'Live labs on AWS, GCP and Kubernetes gave me the muscle memory to walk into a DevOps role without hesitation.', true, 5),
  ('Neha Gupta', 'https://api.dicebear.com/9.x/initials/svg?seed=Neha%20Gupta&backgroundType=gradientLinear&backgroundColor=059669,10b981&fontFamily=Inter&fontWeight=600&radius=50', 'Digital Marketing Lead', 'Zomato', 'zomato', 'zomato.com', 'Digital Marketing Pro', 'digital-marketing', '2025 Batch', '₹12 LPA', 12, 'Gurugram', 2025, 5, 'I ran real campaigns during the program and shipped my first attribution dashboard. That is what got me hired.', false, 6),
  ('Ishaan Mehta', 'https://api.dicebear.com/9.x/initials/svg?seed=Ishaan%20Mehta&backgroundType=gradientLinear&backgroundColor=0f766e,14b8a6&fontFamily=Inter&fontWeight=600&radius=50', 'Cybersecurity Analyst', 'Accenture', 'accenture', 'accenture.com', 'Cyber Security Program', 'cyber-security', '2026 Batch', '₹11 LPA', 11, 'Pune', 2026, 5, 'The red-team labs made theoretical concepts stick. Cracked three interview loops within a month of graduating.', false, 7),
  ('Ananya Iyer', 'https://api.dicebear.com/9.x/initials/svg?seed=Ananya%20Iyer&backgroundType=gradientLinear&backgroundColor=9333ea,c084fc&fontFamily=Inter&fontWeight=600&radius=50', 'Data Analyst', 'PhonePe', 'phonepe', 'phonepe.com', 'Data Science & Analytics', 'data-science', '2025 Batch', '₹13 LPA', 13, 'Bengaluru', 2025, 5, 'From SQL basics to shipping dashboards used by leadership, the mentors held me accountable every single week.', false, 8),
  ('Karthik Nair', 'https://api.dicebear.com/9.x/initials/svg?seed=Karthik%20Nair&backgroundType=gradientLinear&backgroundColor=b91c1c,ef4444&fontFamily=Inter&fontWeight=600&radius=50', 'iOS Developer', 'Freshworks', 'freshworks', 'freshworks.com', 'Mobile App Development', 'app-development', '2025 Batch', '₹15 LPA', 15, 'Chennai', 2025, 5, 'Two shipped apps and a mock interview loop later, I was signing my offer. The community made all the difference.', false, 9),
  ('Divya Singh', 'https://api.dicebear.com/9.x/initials/svg?seed=Divya%20Singh&backgroundType=gradientLinear&backgroundColor=0369a1,38bdf8&fontFamily=Inter&fontWeight=600&radius=50', 'Business Analyst', 'TCS', 'tcs', 'tcs.com', 'Business Analytics', 'management', '2026 Batch', '₹9 LPA', 9, 'Mumbai', 2026, 5, 'The way case studies were structured helped me stand out in every consulting interview I attended.', false, 10),
  ('Rohit Bansal', 'https://api.dicebear.com/9.x/initials/svg?seed=Rohit%20Bansal&backgroundType=gradientLinear&backgroundColor=475569,94a3b8&fontFamily=Inter&fontWeight=600&radius=50', 'AI Research Engineer', 'Microsoft', 'microsoft', 'microsoft.com', 'Artificial Intelligence Program', 'artificial-intelligence', '2026 Batch', '₹24 LPA', 24, 'Hyderabad', 2026, 5, 'From no ML background to publishing a working transformer prototype. The program set a very high bar.', true, 11),
  ('Meera Krishnan', 'https://api.dicebear.com/9.x/initials/svg?seed=Meera%20Krishnan&backgroundType=gradientLinear&backgroundColor=c026d3,e879f9&fontFamily=Inter&fontWeight=600&radius=50', 'Frontend Engineer', 'Adobe', 'adobe', 'adobe.com', 'Full Stack Web Development', 'web-development', '2025 Batch', '₹17 LPA', 17, 'Noida', 2025, 5, 'The design-to-code sprints taught me how real teams collaborate. That shipped as day-one value at Adobe.', false, 12);
