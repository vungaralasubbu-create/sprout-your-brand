
-- ============ market_trends ============
CREATE TABLE public.market_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  topic TEXT NOT NULL,
  category TEXT,
  industry TEXT,
  source TEXT,
  region TEXT DEFAULT 'global',
  language TEXT DEFAULT 'en',
  timeframe TEXT DEFAULT 'weekly',
  popularity NUMERIC DEFAULT 0,
  growth_rate NUMERIC DEFAULT 0,
  velocity NUMERIC DEFAULT 0,
  competition NUMERIC DEFAULT 0,
  difficulty NUMERIC DEFAULT 0,
  business_relevance NUMERIC DEFAULT 0,
  opportunity_score NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_trends TO authenticated;
GRANT ALL ON public.market_trends TO service_role;
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_trends_owner_all" ON public.market_trends FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_market_trends_owner ON public.market_trends(owner_id);
CREATE INDEX idx_market_trends_industry ON public.market_trends(industry);
CREATE INDEX idx_market_trends_score ON public.market_trends(opportunity_score DESC);

-- ============ industry_news ============
CREATE TABLE public.industry_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  headline TEXT NOT NULL,
  summary TEXT,
  url TEXT,
  source TEXT,
  industry TEXT,
  published_at TIMESTAMPTZ,
  ai_summary TEXT,
  impact TEXT,
  business_relevance NUMERIC DEFAULT 0,
  marketing_opportunities TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommended_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.industry_news TO authenticated;
GRANT ALL ON public.industry_news TO service_role;
ALTER TABLE public.industry_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "industry_news_owner_all" ON public.industry_news FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_industry_news_owner ON public.industry_news(owner_id);
CREATE INDEX idx_industry_news_published ON public.industry_news(published_at DESC);

-- ============ keyword_trends ============
CREATE TABLE public.keyword_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  keyword TEXT NOT NULL,
  category TEXT,
  industry TEXT,
  monthly_volume INTEGER DEFAULT 0,
  growth_percent NUMERIC DEFAULT 0,
  direction TEXT DEFAULT 'stable',
  intent TEXT,
  difficulty NUMERIC DEFAULT 0,
  seasonality JSONB DEFAULT '{}'::jsonb,
  regions TEXT[] DEFAULT ARRAY[]::TEXT[],
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.keyword_trends TO authenticated;
GRANT ALL ON public.keyword_trends TO service_role;
ALTER TABLE public.keyword_trends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "keyword_trends_owner_all" ON public.keyword_trends FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_keyword_trends_owner ON public.keyword_trends(owner_id);
CREATE INDEX idx_keyword_trends_direction ON public.keyword_trends(direction);

-- ============ content_opportunities ============
CREATE TABLE public.content_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'blog',
  topic TEXT,
  industry TEXT,
  target_keyword TEXT,
  supporting_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority_score NUMERIC DEFAULT 0,
  estimated_reach INTEGER DEFAULT 0,
  competition NUMERIC DEFAULT 0,
  rationale TEXT,
  status TEXT DEFAULT 'suggested',
  source_trend_id UUID REFERENCES public.market_trends(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_opportunities TO authenticated;
GRANT ALL ON public.content_opportunities TO service_role;
ALTER TABLE public.content_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_opportunities_owner_all" ON public.content_opportunities FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_content_opp_owner ON public.content_opportunities(owner_id);
CREATE INDEX idx_content_opp_type ON public.content_opportunities(type);
CREATE INDEX idx_content_opp_priority ON public.content_opportunities(priority_score DESC);

-- ============ market_reports ============
CREATE TABLE public.market_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  title TEXT,
  metrics JSONB DEFAULT '{}'::jsonb,
  highlights TEXT[] DEFAULT ARRAY[]::TEXT[],
  recommendations TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'ready',
  generated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.market_reports TO authenticated;
GRANT ALL ON public.market_reports TO service_role;
ALTER TABLE public.market_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_reports_owner_all" ON public.market_reports FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_market_reports_owner ON public.market_reports(owner_id);

-- ============ trend_alerts ============
CREATE TABLE public.trend_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN NOT NULL DEFAULT false,
  source_trend_id UUID REFERENCES public.market_trends(id) ON DELETE SET NULL,
  source_news_id UUID REFERENCES public.industry_news(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trend_alerts TO authenticated;
GRANT ALL ON public.trend_alerts TO service_role;
ALTER TABLE public.trend_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trend_alerts_owner_all" ON public.trend_alerts FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_trend_alerts_owner ON public.trend_alerts(owner_id, is_read);

-- ============ updated_at triggers ============
CREATE TRIGGER update_market_trends_ua BEFORE UPDATE ON public.market_trends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_industry_news_ua BEFORE UPDATE ON public.industry_news
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_keyword_trends_ua BEFORE UPDATE ON public.keyword_trends
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_content_opp_ua BEFORE UPDATE ON public.content_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_market_reports_ua BEFORE UPDATE ON public.market_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
