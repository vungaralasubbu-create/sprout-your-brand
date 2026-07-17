
-- Conversations
CREATE TABLE public.ai_sales_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web','whatsapp','instagram','messenger','sms','telegram','other')),
  provider TEXT,
  external_id TEXT,
  language TEXT DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','handover','enrolled','closed','dormant')),
  lead_score TEXT DEFAULT 'cold' CHECK (lead_score IN ('hot','warm','cold','dormant')),
  intent_summary TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_country TEXT,
  contact_city TEXT,
  recommended_course_ids UUID[] DEFAULT '{}'::uuid[],
  qualification JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  handover_requested BOOLEAN DEFAULT false,
  handover_reason TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_sales_conversations_session_idx ON public.ai_sales_conversations(session_token);
CREATE INDEX ai_sales_conversations_user_idx ON public.ai_sales_conversations(user_id);
CREATE INDEX ai_sales_conversations_status_idx ON public.ai_sales_conversations(status, last_message_at DESC);
CREATE INDEX ai_sales_conversations_channel_idx ON public.ai_sales_conversations(channel, provider, external_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sales_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_sales_conversations TO anon;
GRANT ALL ON public.ai_sales_conversations TO service_role;
ALTER TABLE public.ai_sales_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_conversations" ON public.ai_sales_conversations FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_no_read" ON public.ai_sales_conversations FOR SELECT TO anon USING (false);
CREATE POLICY "auth_manage_own" ON public.ai_sales_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (true);

-- Messages
CREATE TABLE public.ai_sales_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_sales_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content TEXT NOT NULL,
  quick_replies JSONB,
  cards JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_sales_messages_conv_idx ON public.ai_sales_messages(conversation_id, created_at);

GRANT SELECT, INSERT ON public.ai_sales_messages TO authenticated;
GRANT SELECT, INSERT ON public.ai_sales_messages TO anon;
GRANT ALL ON public.ai_sales_messages TO service_role;
ALTER TABLE public.ai_sales_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_msgs" ON public.ai_sales_messages FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_no_read_msgs" ON public.ai_sales_messages FOR SELECT TO anon USING (false);
CREATE POLICY "auth_read_own_msgs" ON public.ai_sales_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.ai_sales_conversations c
            WHERE c.id = conversation_id AND (c.user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')))
  );
CREATE POLICY "auth_insert_msgs" ON public.ai_sales_messages FOR INSERT TO authenticated WITH CHECK (true);

-- Leads (aggregated qualified profiles)
CREATE TABLE public.ai_sales_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_sales_conversations(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  country TEXT,
  city TEXT,
  qualification TEXT,
  branch TEXT,
  graduation_year TEXT,
  experience TEXT,
  career_goal TEXT,
  preferred_tech TEXT,
  budget TEXT,
  learning_mode TEXT,
  availability TEXT,
  expected_joining TEXT,
  interest_level TEXT,
  score TEXT DEFAULT 'cold' CHECK (score IN ('hot','warm','cold','dormant')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','nurturing','enrolled','lost')),
  assigned_partner_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_sales_leads_score_idx ON public.ai_sales_leads(score, status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sales_leads TO authenticated;
GRANT ALL ON public.ai_sales_leads TO service_role;
ALTER TABLE public.ai_sales_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_leads" ON public.ai_sales_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'partner'))
  WITH CHECK (true);

-- Follow-ups
CREATE TABLE public.ai_sales_followups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.ai_sales_leads(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.ai_sales_conversations(id) ON DELETE CASCADE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  channel TEXT NOT NULL DEFAULT 'web',
  message_template TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','sent','skipped','failed')),
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_sales_followups_due_idx ON public.ai_sales_followups(status, scheduled_for);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sales_followups TO authenticated;
GRANT ALL ON public.ai_sales_followups TO service_role;
ALTER TABLE public.ai_sales_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_followups" ON public.ai_sales_followups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'partner'))
  WITH CHECK (true);

-- Unanswered questions
CREATE TABLE public.ai_sales_unanswered (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.ai_sales_conversations(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  ai_response TEXT,
  admin_answer TEXT,
  answered_at TIMESTAMPTZ,
  answered_by UUID,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','answered','ignored')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_sales_unanswered_status_idx ON public.ai_sales_unanswered(status, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sales_unanswered TO authenticated;
GRANT ALL ON public.ai_sales_unanswered TO service_role;
ALTER TABLE public.ai_sales_unanswered ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_manage_unanswered" ON public.ai_sales_unanswered FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (true);

-- Curated knowledge (admin adds Q&A that AI uses)
CREATE TABLE public.ai_sales_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}'::text[],
  language TEXT DEFAULT 'en',
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_sales_knowledge_active_idx ON public.ai_sales_knowledge(active, priority DESC);

GRANT SELECT ON public.ai_sales_knowledge TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_sales_knowledge TO authenticated;
GRANT ALL ON public.ai_sales_knowledge TO service_role;
ALTER TABLE public.ai_sales_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_active_kb" ON public.ai_sales_knowledge FOR SELECT USING (active = true);
CREATE POLICY "admins_manage_kb" ON public.ai_sales_knowledge FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Events
CREATE TABLE public.ai_sales_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.ai_sales_conversations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_sales_events_type_idx ON public.ai_sales_events(event_type, created_at DESC);

GRANT SELECT, INSERT ON public.ai_sales_events TO authenticated;
GRANT SELECT, INSERT ON public.ai_sales_events TO anon;
GRANT ALL ON public.ai_sales_events TO service_role;
ALTER TABLE public.ai_sales_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_insert_events" ON public.ai_sales_events FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "admins_read_events" ON public.ai_sales_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- updated_at triggers
CREATE TRIGGER ai_sales_conv_updated BEFORE UPDATE ON public.ai_sales_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ai_sales_leads_updated BEFORE UPDATE ON public.ai_sales_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER ai_sales_kb_updated BEFORE UPDATE ON public.ai_sales_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
