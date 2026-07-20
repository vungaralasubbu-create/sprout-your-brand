
-- Extend automation_workflows
ALTER TABLE public.automation_workflows
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS template_key text,
  ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS retry_policy jsonb NOT NULL DEFAULT '{"count":2,"delaySeconds":30}'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule jsonb,
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS run_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS success_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category text;

-- Extend automation_workflow_runs
ALTER TABLE public.automation_workflow_runs
  ADD COLUMN IF NOT EXISTS current_step_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS error_message text,
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trigger_source text,
  ADD COLUMN IF NOT EXISTS trigger_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS output jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS duration_ms integer;

-- ================= automation_templates =================
CREATE TABLE IF NOT EXISTS public.automation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  icon text,
  graph jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}'::jsonb,
  trigger jsonb NOT NULL DEFAULT '{}'::jsonb,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT true,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usage_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_templates TO authenticated;
GRANT ALL ON public.automation_templates TO service_role;
ALTER TABLE public.automation_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public templates are readable"
  ON public.automation_templates FOR SELECT TO authenticated
  USING (is_public = true OR owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Owners manage own templates"
  ON public.automation_templates FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.automation_templates
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();

-- ================= automation_workflow_versions =================
CREATE TABLE IF NOT EXISTS public.automation_workflow_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  version integer NOT NULL,
  name text,
  graph jsonb NOT NULL,
  trigger jsonb NOT NULL DEFAULT '{}'::jsonb,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workflow_id, version)
);

CREATE INDEX IF NOT EXISTS idx_wf_versions_workflow ON public.automation_workflow_versions(workflow_id, version DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_workflow_versions TO authenticated;
GRANT ALL ON public.automation_workflow_versions TO service_role;
ALTER TABLE public.automation_workflow_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own workflow versions"
  ON public.automation_workflow_versions FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

-- ================= automation_webhooks =================
CREATE TABLE IF NOT EXISTS public.automation_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.automation_workflows(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  is_enabled boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  trigger_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_slug ON public.automation_webhooks(slug) WHERE is_enabled;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_webhooks TO authenticated;
GRANT ALL ON public.automation_webhooks TO service_role;
ALTER TABLE public.automation_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own webhooks"
  ON public.automation_webhooks FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (owner_id = auth.uid() OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER trg_webhooks_updated BEFORE UPDATE ON public.automation_webhooks
  FOR EACH ROW EXECUTE FUNCTION public.automation_touch_updated_at();

-- ================= Seed templates =================
INSERT INTO public.automation_templates (key, name, description, category, icon, graph, tags)
VALUES
  ('monthly-marketing', 'Monthly Marketing Rollout',
    'Generate a monthly plan, produce content, route through approval, then publish across connected platforms.',
    'marketing', 'CalendarClock',
    '{"nodes":[
      {"id":"n1","type":"trigger","position":{"x":80,"y":80},"data":{"kind":"scheduled","label":"1st of month, 9am","cron":"0 9 1 * *"}},
      {"id":"n2","type":"action","position":{"x":320,"y":80},"data":{"kind":"generate-plan","label":"Generate marketing plan"}},
      {"id":"n3","type":"action","position":{"x":580,"y":80},"data":{"kind":"generate-content","label":"Generate 8 posts","count":8}},
      {"id":"n4","type":"action","position":{"x":840,"y":80},"data":{"kind":"queue-approval","label":"Send to Approval"}},
      {"id":"n5","type":"action","position":{"x":1100,"y":80},"data":{"kind":"publish","label":"Publish approved"}},
      {"id":"n6","type":"action","position":{"x":1360,"y":80},"data":{"kind":"notify","label":"Notify team","channel":"in-app"}}
    ],
    "edges":[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"}
    ]}'::jsonb,
    ARRAY['marketing','monthly','publishing']),
  ('admissions-campaign','Admissions Campaign',
    'Nurture new leads with drip content, timed follow-ups, and stage moves in CRM.',
    'admissions','GraduationCap',
    '{"nodes":[
      {"id":"n1","type":"trigger","position":{"x":80,"y":80},"data":{"kind":"event","event":"lead.created","label":"New lead"}},
      {"id":"n2","type":"action","position":{"x":320,"y":80},"data":{"kind":"send-email","label":"Welcome email"}},
      {"id":"n3","type":"delay","position":{"x":580,"y":80},"data":{"amount":1,"unit":"days","label":"Wait 1 day"}},
      {"id":"n4","type":"action","position":{"x":840,"y":80},"data":{"kind":"send-email","label":"Program brochure"}},
      {"id":"n5","type":"delay","position":{"x":1100,"y":80},"data":{"amount":3,"unit":"days","label":"Wait 3 days"}},
      {"id":"n6","type":"condition","position":{"x":1360,"y":80},"data":{"label":"Lead score > 60","expression":"lead.score > 60"}},
      {"id":"n7","type":"action","position":{"x":1620,"y":40},"data":{"kind":"crm-stage","label":"Move → Hot","stage":"hot"}},
      {"id":"n8","type":"action","position":{"x":1620,"y":140},"data":{"kind":"send-email","label":"Extra nurture"}}
    ],
    "edges":[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"},
      {"id":"e6","source":"n6","target":"n7","label":"yes"},
      {"id":"e7","source":"n6","target":"n8","label":"no"}
    ]}'::jsonb,
    ARRAY['admissions','crm','nurture']),
  ('blog-automation','Blog Automation',
    'Every Monday, generate an SEO blog draft, run QA, and queue it for editorial review.',
    'content','FileText',
    '{"nodes":[
      {"id":"n1","type":"trigger","position":{"x":80,"y":80},"data":{"kind":"scheduled","label":"Weekly Monday 8am","cron":"0 8 * * 1"}},
      {"id":"n2","type":"action","position":{"x":320,"y":80},"data":{"kind":"generate-blog","label":"Draft blog"}},
      {"id":"n3","type":"action","position":{"x":580,"y":80},"data":{"kind":"ai-analysis","label":"SEO QA scan"}},
      {"id":"n4","type":"action","position":{"x":840,"y":80},"data":{"kind":"queue-approval","label":"Send to editor"}}
    ],
    "edges":[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"}
    ]}'::jsonb,
    ARRAY['content','seo','blog']),
  ('lead-nurturing','Lead Nurturing Drip',
    'A five-touch email sequence with timezone-aware delays and unsubscribe branch.',
    'crm','Users',
    '{"nodes":[
      {"id":"n1","type":"trigger","position":{"x":80,"y":80},"data":{"kind":"event","event":"lead.created","label":"New lead"}},
      {"id":"n2","type":"action","position":{"x":320,"y":80},"data":{"kind":"send-email","label":"Day 0"}},
      {"id":"n3","type":"delay","position":{"x":580,"y":80},"data":{"amount":2,"unit":"days","label":"+2d"}},
      {"id":"n4","type":"action","position":{"x":840,"y":80},"data":{"kind":"send-email","label":"Day 2"}},
      {"id":"n5","type":"delay","position":{"x":1100,"y":80},"data":{"amount":5,"unit":"days","label":"+5d"}},
      {"id":"n6","type":"action","position":{"x":1360,"y":80},"data":{"kind":"send-email","label":"Day 7"}}
    ],
    "edges":[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"}
    ]}'::jsonb,
    ARRAY['crm','email','drip']),
  ('product-launch','Product Launch',
    'Full launch playbook: teaser → announce → publish → nurture buyers.',
    'marketing','Rocket',
    '{"nodes":[
      {"id":"n1","type":"trigger","position":{"x":80,"y":80},"data":{"kind":"manual","label":"Manual start"}},
      {"id":"n2","type":"action","position":{"x":320,"y":80},"data":{"kind":"generate-content","label":"Teaser posts","count":3}},
      {"id":"n3","type":"delay","position":{"x":580,"y":80},"data":{"amount":3,"unit":"days","label":"Wait 3d"}},
      {"id":"n4","type":"action","position":{"x":840,"y":80},"data":{"kind":"publish","label":"Announce"}},
      {"id":"n5","type":"action","position":{"x":1100,"y":80},"data":{"kind":"generate-blog","label":"Blog post"}},
      {"id":"n6","type":"action","position":{"x":1360,"y":80},"data":{"kind":"notify","label":"Notify sales"}}
    ],
    "edges":[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"},
      {"id":"e3","source":"n3","target":"n4"},
      {"id":"e4","source":"n4","target":"n5"},
      {"id":"e5","source":"n5","target":"n6"}
    ]}'::jsonb,
    ARRAY['marketing','launch']),
  ('social-publishing','Social Publishing',
    'Publish approved content to Meta, LinkedIn, X on schedule.',
    'publishing','Share2',
    '{"nodes":[
      {"id":"n1","type":"trigger","position":{"x":80,"y":80},"data":{"kind":"event","event":"content.approved","label":"On approval"}},
      {"id":"n2","type":"action","position":{"x":320,"y":80},"data":{"kind":"publish","label":"Publish now"}},
      {"id":"n3","type":"action","position":{"x":580,"y":80},"data":{"kind":"notify","label":"Notify author"}}
    ],
    "edges":[
      {"id":"e1","source":"n1","target":"n2"},
      {"id":"e2","source":"n2","target":"n3"}
    ]}'::jsonb,
    ARRAY['publishing','social'])
ON CONFLICT (key) DO NOTHING;
