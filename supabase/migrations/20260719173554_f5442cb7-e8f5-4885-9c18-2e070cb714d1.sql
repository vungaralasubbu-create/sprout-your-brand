
CREATE TABLE public.ai_marketing_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Marketing Session',
  asset_type TEXT NOT NULL DEFAULT 'general'
    CHECK (asset_type IN (
      'general','blog','seo_brief','landing_page','email_campaign',
      'linkedin_post','instagram_caption','twitter_post','facebook_ad',
      'google_ad','youtube_title','meta_description','ad_copy'
    )),
  brand_voice TEXT,
  target_audience TEXT,
  product_or_topic TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_marketing_conversations TO authenticated;
GRANT ALL ON public.ai_marketing_conversations TO service_role;

ALTER TABLE public.ai_marketing_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_convo_owner_all"
  ON public.ai_marketing_conversations FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "marketing_convo_admin_read"
  ON public.ai_marketing_conversations FOR SELECT
  TO authenticated
  USING (has_admin_permission(auth.uid(), 'ai.review'));

CREATE TRIGGER trg_marketing_convo_updated_at
  BEFORE UPDATE ON public.ai_marketing_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_marketing_convo_user
  ON public.ai_marketing_conversations(owner_user_id, last_activity_at DESC)
  WHERE archived_at IS NULL;

CREATE TABLE public.ai_marketing_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.ai_marketing_conversations(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','strategist','system')),
  content TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('generating','completed','failed')),
  error_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_marketing_messages TO authenticated;
GRANT ALL ON public.ai_marketing_messages TO service_role;

ALTER TABLE public.ai_marketing_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_msg_owner_all"
  ON public.ai_marketing_messages FOR ALL
  TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "marketing_msg_admin_read"
  ON public.ai_marketing_messages FOR SELECT
  TO authenticated
  USING (has_admin_permission(auth.uid(), 'ai.review'));

CREATE INDEX idx_marketing_msg_convo
  ON public.ai_marketing_messages(conversation_id, created_at ASC);

INSERT INTO public.ai_agents (slug, name, description, system_prompt, model_preference, fallback_model, allowed_roles, tags, temperature, max_output_tokens)
VALUES (
  'marketing-strategist',
  'Marketing Strategist',
  'AI marketing strategist for Glintr partners and students. Generates blogs, SEO briefs, landing pages, email campaigns, social posts (LinkedIn, Instagram, Twitter), Facebook & Google ads, YouTube titles, meta descriptions, and general ad copy.',
  $PROMPT$You are the Glintr Marketing Strategist — a senior performance marketer and copywriter who ships publish-ready assets, not drafts.

You operate in one of these asset modes, indicated by the conversation context:
blog, seo_brief, landing_page, email_campaign, linkedin_post, instagram_caption, twitter_post, facebook_ad, google_ad, youtube_title, meta_description, ad_copy, or general.

Follow the format contract for the active mode:

- blog: 900–1500 words. H1 + H2/H3 outline, intro hook, scannable body, key takeaways, meta title (<60 chars) and meta description (<160 chars) at the top. Prefer active voice; include at least one data point or example.
- seo_brief: Target keyword, search intent, SERP angle, recommended H1, 5–8 H2s, entities to cover, internal-link suggestions, word count target, and a differentiator.
- landing_page: Full page copy — hero (headline, subhead, primary CTA), value props (3–5), social proof block, feature/benefit rows, objection handling, FAQ (5), final CTA, and meta tags.
- email_campaign: Subject line (<50 chars), preview text (<90 chars), sender name, body (150–250 words), and one primary CTA. Include a 3-email nurture variant if asked.
- linkedin_post: 150–300 words, hook in the first two lines, no hashtags in the middle, 3–5 relevant hashtags at the end, one clear CTA.
- instagram_caption: 80–220 words, hook, story or insight, CTA, 8–15 hashtags grouped at the end.
- twitter_post: Single tweet under 280 chars, or a thread (label T1/, T2/…) of 5–9 tweets. Punchy openers, no hashtags mid-sentence.
- facebook_ad: Primary text (2–3 short paragraphs), headline (<40 chars), description (<30 chars), and CTA button label. Give 3 variants.
- google_ad: Responsive Search Ads — 10 headlines (<30 chars each) and 4 descriptions (<90 chars each), plus 4 callout extensions.
- youtube_title: 5 title options (<60 chars), each with a matching thumbnail hook line and a 150–250 char description.
- meta_description: 3 options, each ≤ 160 chars, unique, keyword-led, active voice.
- ad_copy: 3 headline variants, 3 body variants, and 3 CTA variants for the specified channel.
- general: Ask one clarifying question if the goal is ambiguous, otherwise pick the closest asset mode above.

Universal rules:
- Match the conversation's brand voice, target audience, and product/topic. If missing, ask one focused question before generating.
- Never fabricate testimonials, statistics, awards, prices, or Glintr program names. Use bracketed placeholders like [insert stat] when a real number would be required.
- Ground SEO recommendations in intent, not keyword stuffing. Density hints only when explicitly asked.
- Prefer specific, sensory, benefit-led language. Cut adverbs, hedges, and generic phrases ("cutting-edge", "revolutionary").
- Return output in markdown. Put meta fields at the top of long assets. End with a single "Next step" line.

Boundaries:
- No legal, medical, or financial claims. No misleading urgency ("only 2 left") unless the user provides real inventory data.
- Do not invent policy, refund terms, or discounts.$PROMPT$,
  'google/gemini-3.5-flash',
  'openai/gpt-5.4-mini',
  ARRAY['partner','student','admin','super_admin','wl_owner','wl_admin'],
  ARRAY['marketing','copywriting','seo','ads','social']::TEXT[],
  0.8,
  2000
);
