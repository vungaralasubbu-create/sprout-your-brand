
DO $$ BEGIN
  CREATE TYPE public.community_audience AS ENUM ('public','students','partners','mentors','brand_owners','staff');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_thread_kind AS ENUM ('discussion','question','poll','announcement','event');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.community_status AS ENUM ('pending','approved','hidden','deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.community_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

CREATE OR REPLACE FUNCTION public.community_can_view_audience(_audience public.community_audience, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE _audience
    WHEN 'public' THEN true
    WHEN 'students' THEN _user IS NOT NULL AND (public.has_role(_user,'student'::app_role) OR public.has_role(_user,'admin'::app_role) OR public.has_role(_user,'super_admin'::app_role))
    WHEN 'partners' THEN _user IS NOT NULL AND (public.has_role(_user,'partner'::app_role) OR public.has_role(_user,'partner_manager'::app_role) OR public.has_role(_user,'admin'::app_role) OR public.has_role(_user,'super_admin'::app_role))
    WHEN 'mentors' THEN _user IS NOT NULL AND (public.has_role(_user,'instructor'::app_role) OR public.has_role(_user,'counsellor'::app_role) OR public.has_role(_user,'admin'::app_role) OR public.has_role(_user,'super_admin'::app_role))
    WHEN 'brand_owners' THEN _user IS NOT NULL AND (public.has_role(_user,'brand_owner'::app_role) OR public.has_role(_user,'wl_owner'::app_role) OR public.has_role(_user,'admin'::app_role) OR public.has_role(_user,'super_admin'::app_role))
    WHEN 'staff' THEN _user IS NOT NULL AND (public.has_role(_user,'admin'::app_role) OR public.has_role(_user,'super_admin'::app_role))
    ELSE false END
$$;

CREATE OR REPLACE FUNCTION public.is_community_moderator(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND (public.has_role(_user,'admin'::app_role) OR public.has_role(_user,'super_admin'::app_role))
$$;

CREATE TABLE public.community_spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  cover_url text,
  audience public.community_audience NOT NULL DEFAULT 'public',
  is_featured boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  thread_count integer NOT NULL DEFAULT 0,
  member_count integer NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 100,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_spaces TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_spaces TO authenticated;
GRANT ALL ON public.community_spaces TO service_role;
ALTER TABLE public.community_spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spaces read" ON public.community_spaces FOR SELECT USING (
  NOT is_archived AND public.community_can_view_audience(audience, auth.uid())
);
CREATE POLICY "spaces moderate" ON public.community_spaces FOR ALL USING (public.is_community_moderator(auth.uid())) WITH CHECK (public.is_community_moderator(auth.uid()));
CREATE TRIGGER community_spaces_touch BEFORE UPDATE ON public.community_spaces FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
CREATE INDEX idx_spaces_audience ON public.community_spaces(audience) WHERE NOT is_archived;

CREATE TABLE public.community_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES public.community_spaces(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.community_thread_kind NOT NULL DEFAULT 'discussion',
  slug text NOT NULL,
  title text NOT NULL,
  body_md text NOT NULL DEFAULT '',
  excerpt text,
  tags text[] NOT NULL DEFAULT '{}',
  status public.community_status NOT NULL DEFAULT 'approved',
  moderation_reason text,
  moderation_score numeric(3,2),
  is_pinned boolean NOT NULL DEFAULT false,
  is_locked boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  accepted_post_id uuid,
  view_count integer NOT NULL DEFAULT 0,
  upvote_count integer NOT NULL DEFAULT 0,
  post_count integer NOT NULL DEFAULT 0,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  seo_title text,
  seo_description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (space_id, slug)
);
GRANT SELECT ON public.community_threads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_threads TO authenticated;
GRANT ALL ON public.community_threads TO service_role;
ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "threads read" ON public.community_threads FOR SELECT USING (
  status = 'approved' AND EXISTS (
    SELECT 1 FROM public.community_spaces s
    WHERE s.id = space_id AND NOT s.is_archived AND public.community_can_view_audience(s.audience, auth.uid())
  )
);
CREATE POLICY "threads read own" ON public.community_threads FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "threads insert self" ON public.community_threads FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (SELECT 1 FROM public.community_spaces s WHERE s.id = space_id AND NOT s.is_archived AND public.community_can_view_audience(s.audience, auth.uid()))
);
CREATE POLICY "threads update own" ON public.community_threads FOR UPDATE USING (auth.uid() = author_id AND status <> 'deleted') WITH CHECK (auth.uid() = author_id);
CREATE POLICY "threads delete own" ON public.community_threads FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "threads moderate" ON public.community_threads FOR ALL USING (public.is_community_moderator(auth.uid())) WITH CHECK (public.is_community_moderator(auth.uid()));

CREATE TRIGGER community_threads_touch BEFORE UPDATE ON public.community_threads FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
CREATE INDEX idx_threads_space_activity ON public.community_threads(space_id, last_activity_at DESC) WHERE status = 'approved';
CREATE INDEX idx_threads_kind ON public.community_threads(kind) WHERE status = 'approved';
CREATE INDEX idx_threads_status ON public.community_threads(status) WHERE status <> 'approved';
CREATE INDEX idx_threads_tags ON public.community_threads USING gin(tags);
CREATE INDEX idx_threads_fulltext ON public.community_threads USING gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(body_md,'')));
CREATE INDEX idx_threads_author ON public.community_threads(author_id);

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.community_threads(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_post_id uuid REFERENCES public.community_posts(id) ON DELETE SET NULL,
  body_md text NOT NULL,
  status public.community_status NOT NULL DEFAULT 'approved',
  moderation_reason text,
  moderation_score numeric(3,2),
  upvote_count integer NOT NULL DEFAULT 0,
  is_accepted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts read" ON public.community_posts FOR SELECT USING (
  status = 'approved' AND EXISTS (
    SELECT 1 FROM public.community_threads t JOIN public.community_spaces s ON s.id = t.space_id
    WHERE t.id = thread_id AND t.status = 'approved' AND NOT s.is_archived AND public.community_can_view_audience(s.audience, auth.uid())
  )
);
CREATE POLICY "posts read own" ON public.community_posts FOR SELECT USING (auth.uid() = author_id);
CREATE POLICY "posts insert self" ON public.community_posts FOR INSERT WITH CHECK (
  auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM public.community_threads t JOIN public.community_spaces s ON s.id = t.space_id
    WHERE t.id = thread_id AND t.status = 'approved' AND NOT t.is_locked AND NOT s.is_archived AND public.community_can_view_audience(s.audience, auth.uid())
  )
);
CREATE POLICY "posts update own" ON public.community_posts FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts delete own" ON public.community_posts FOR DELETE USING (auth.uid() = author_id);
CREATE POLICY "posts moderate" ON public.community_posts FOR ALL USING (public.is_community_moderator(auth.uid())) WITH CHECK (public.is_community_moderator(auth.uid()));
CREATE TRIGGER community_posts_touch BEFORE UPDATE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
CREATE INDEX idx_posts_thread ON public.community_posts(thread_id, created_at ASC) WHERE status = 'approved';
CREATE INDEX idx_posts_author ON public.community_posts(author_id);
CREATE INDEX idx_posts_moderation ON public.community_posts(status) WHERE status <> 'approved';

ALTER TABLE public.community_threads
  ADD CONSTRAINT community_threads_accepted_post_fkey
  FOREIGN KEY (accepted_post_id) REFERENCES public.community_posts(id) ON DELETE SET NULL;

CREATE TABLE public.community_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('thread','post')),
  target_id uuid NOT NULL,
  reaction text NOT NULL CHECK (reaction IN ('upvote','downvote','helpful','love','celebrate')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id, reaction)
);
GRANT SELECT ON public.community_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_reactions TO authenticated;
GRANT ALL ON public.community_reactions TO service_role;
ALTER TABLE public.community_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reactions read" ON public.community_reactions FOR SELECT USING (true);
CREATE POLICY "reactions own write" ON public.community_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions own delete" ON public.community_reactions FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_reactions_target ON public.community_reactions(target_type, target_id);

CREATE TABLE public.community_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.community_threads(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  vote_count integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.community_poll_options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_poll_options TO authenticated;
GRANT ALL ON public.community_poll_options TO service_role;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll options read" ON public.community_poll_options FOR SELECT USING (true);
CREATE POLICY "poll options author write" ON public.community_poll_options FOR ALL USING (
  EXISTS (SELECT 1 FROM public.community_threads t WHERE t.id = thread_id AND t.author_id = auth.uid()) OR public.is_community_moderator(auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.community_threads t WHERE t.id = thread_id AND t.author_id = auth.uid()) OR public.is_community_moderator(auth.uid())
);
CREATE INDEX idx_poll_options_thread ON public.community_poll_options(thread_id, sort_order);

CREATE TABLE public.community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.community_threads(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);
GRANT SELECT ON public.community_poll_votes TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_poll_votes TO authenticated;
GRANT ALL ON public.community_poll_votes TO service_role;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "poll votes read" ON public.community_poll_votes FOR SELECT USING (true);
CREATE POLICY "poll votes own write" ON public.community_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "poll votes own delete" ON public.community_poll_votes FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.community_events (
  thread_id uuid PRIMARY KEY REFERENCES public.community_threads(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  join_url text,
  is_online boolean NOT NULL DEFAULT true,
  attendee_count integer NOT NULL DEFAULT 0
);
GRANT SELECT ON public.community_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_events TO authenticated;
GRANT ALL ON public.community_events TO service_role;
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events read" ON public.community_events FOR SELECT USING (true);
CREATE POLICY "events author write" ON public.community_events FOR ALL USING (
  EXISTS (SELECT 1 FROM public.community_threads t WHERE t.id = thread_id AND t.author_id = auth.uid()) OR public.is_community_moderator(auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.community_threads t WHERE t.id = thread_id AND t.author_id = auth.uid()) OR public.is_community_moderator(auth.uid())
);
CREATE INDEX idx_events_starts ON public.community_events(starts_at);

CREATE TABLE public.community_event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.community_threads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('going','maybe','declined')) DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (thread_id, user_id)
);
GRANT SELECT ON public.community_event_rsvps TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_event_rsvps TO authenticated;
GRANT ALL ON public.community_event_rsvps TO service_role;
ALTER TABLE public.community_event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvps read" ON public.community_event_rsvps FOR SELECT USING (true);
CREATE POLICY "rsvps own write" ON public.community_event_rsvps FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.community_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text,
  tier text NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_badges TO anon;
GRANT SELECT ON public.community_badges TO authenticated;
GRANT ALL ON public.community_badges TO service_role;
ALTER TABLE public.community_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges read" ON public.community_badges FOR SELECT USING (true);
CREATE POLICY "badges moderate" ON public.community_badges FOR ALL USING (public.is_community_moderator(auth.uid())) WITH CHECK (public.is_community_moderator(auth.uid()));

CREATE TABLE public.community_user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.community_badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  awarded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  UNIQUE (user_id, badge_id)
);
GRANT SELECT ON public.community_user_badges TO anon;
GRANT SELECT ON public.community_user_badges TO authenticated;
GRANT ALL ON public.community_user_badges TO service_role;
ALTER TABLE public.community_user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user badges read" ON public.community_user_badges FOR SELECT USING (true);
CREATE POLICY "user badges moderate" ON public.community_user_badges FOR ALL USING (public.is_community_moderator(auth.uid())) WITH CHECK (public.is_community_moderator(auth.uid()));

CREATE TABLE public.community_reputation (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  headline text,
  points integer NOT NULL DEFAULT 0,
  threads_created integer NOT NULL DEFAULT 0,
  posts_created integer NOT NULL DEFAULT 0,
  upvotes_received integer NOT NULL DEFAULT 0,
  answers_accepted integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_reputation TO anon;
GRANT SELECT, INSERT, UPDATE ON public.community_reputation TO authenticated;
GRANT ALL ON public.community_reputation TO service_role;
ALTER TABLE public.community_reputation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reputation read" ON public.community_reputation FOR SELECT USING (true);
CREATE POLICY "reputation own write" ON public.community_reputation FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reputation moderate" ON public.community_reputation FOR ALL USING (public.is_community_moderator(auth.uid())) WITH CHECK (public.is_community_moderator(auth.uid()));
CREATE TRIGGER community_reputation_touch BEFORE UPDATE ON public.community_reputation FOR EACH ROW EXECUTE FUNCTION public.community_touch_updated_at();
CREATE INDEX idx_reputation_points ON public.community_reputation(points DESC);

CREATE TABLE public.community_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('space','thread','user')),
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);
GRANT SELECT, INSERT, DELETE ON public.community_follows TO authenticated;
GRANT ALL ON public.community_follows TO service_role;
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows own" ON public.community_follows FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_follows_target ON public.community_follows(target_type, target_id);

CREATE TABLE public.community_moderation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  action text NOT NULL,
  reason text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.community_moderation_log TO authenticated;
GRANT ALL ON public.community_moderation_log TO service_role;
ALTER TABLE public.community_moderation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modlog read" ON public.community_moderation_log FOR SELECT USING (public.is_community_moderator(auth.uid()));
CREATE POLICY "modlog write" ON public.community_moderation_log FOR INSERT WITH CHECK (public.is_community_moderator(auth.uid()));

CREATE OR REPLACE FUNCTION public.community_thread_after_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_spaces SET thread_count = thread_count + 1 WHERE id = NEW.space_id;
    INSERT INTO public.community_reputation(user_id, threads_created, points) VALUES (NEW.author_id, 1, 2)
      ON CONFLICT (user_id) DO UPDATE SET threads_created = community_reputation.threads_created + 1, points = community_reputation.points + 2;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_spaces SET thread_count = GREATEST(thread_count - 1, 0) WHERE id = OLD.space_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER community_threads_counters AFTER INSERT OR DELETE ON public.community_threads FOR EACH ROW EXECUTE FUNCTION public.community_thread_after_change();

CREATE OR REPLACE FUNCTION public.community_post_after_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.community_threads SET post_count = post_count + 1, last_activity_at = now() WHERE id = NEW.thread_id;
    INSERT INTO public.community_reputation(user_id, posts_created, points) VALUES (NEW.author_id, 1, 1)
      ON CONFLICT (user_id) DO UPDATE SET posts_created = community_reputation.posts_created + 1, points = community_reputation.points + 1;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.community_threads SET post_count = GREATEST(post_count - 1, 0) WHERE id = OLD.thread_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER community_posts_counters AFTER INSERT OR DELETE ON public.community_posts FOR EACH ROW EXECUTE FUNCTION public.community_post_after_change();

CREATE OR REPLACE FUNCTION public.community_reaction_after_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _delta int; _author uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN _delta := 1; ELSE _delta := -1; END IF;
  IF (TG_OP = 'INSERT' AND NEW.reaction IN ('upvote','helpful','love','celebrate')) OR
     (TG_OP = 'DELETE' AND OLD.reaction IN ('upvote','helpful','love','celebrate')) THEN
    IF COALESCE(NEW.target_type, OLD.target_type) = 'thread' THEN
      UPDATE public.community_threads SET upvote_count = GREATEST(upvote_count + _delta, 0)
        WHERE id = COALESCE(NEW.target_id, OLD.target_id) RETURNING author_id INTO _author;
    ELSE
      UPDATE public.community_posts SET upvote_count = GREATEST(upvote_count + _delta, 0)
        WHERE id = COALESCE(NEW.target_id, OLD.target_id) RETURNING author_id INTO _author;
    END IF;
    IF _author IS NOT NULL THEN
      INSERT INTO public.community_reputation(user_id, upvotes_received, points) VALUES (_author, GREATEST(_delta,0), _delta)
        ON CONFLICT (user_id) DO UPDATE SET upvotes_received = GREATEST(community_reputation.upvotes_received + _delta, 0),
                                             points = GREATEST(community_reputation.points + _delta, 0);
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER community_reactions_counters AFTER INSERT OR DELETE ON public.community_reactions FOR EACH ROW EXECUTE FUNCTION public.community_reaction_after_change();

CREATE OR REPLACE FUNCTION public.community_poll_vote_after_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN UPDATE public.community_poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
  ELSIF TG_OP = 'DELETE' THEN UPDATE public.community_poll_options SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.option_id; END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER community_poll_votes_counters AFTER INSERT OR DELETE ON public.community_poll_votes FOR EACH ROW EXECUTE FUNCTION public.community_poll_vote_after_change();

CREATE OR REPLACE FUNCTION public.community_rsvp_after_change()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _going int;
BEGIN
  SELECT COUNT(*) INTO _going FROM public.community_event_rsvps WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id) AND status = 'going';
  UPDATE public.community_events SET attendee_count = _going WHERE thread_id = COALESCE(NEW.thread_id, OLD.thread_id);
  RETURN COALESCE(NEW, OLD);
END $$;
CREATE TRIGGER community_rsvps_counters AFTER INSERT OR UPDATE OR DELETE ON public.community_event_rsvps FOR EACH ROW EXECUTE FUNCTION public.community_rsvp_after_change();

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_poll_votes;

INSERT INTO public.community_spaces (slug, name, description, icon, audience, is_featured, sort_order) VALUES
  ('announcements', 'Announcements', 'Official updates from the Glintr team.', '📣', 'public', true, 5),
  ('general', 'General Discussion', 'Open conversations about learning, careers, and building in public.', '💬', 'public', true, 10),
  ('questions', 'Q&A', 'Ask anything — get answers from students, mentors, and industry pros.', '❓', 'public', true, 20),
  ('students', 'Student Lounge', 'For enrolled Glintr students — study groups, wins, and support.', '🎓', 'students', true, 30),
  ('partners', 'Sales Partners', 'Playbooks, wins, and daily coaching for Glintr sales partners.', '💼', 'partners', true, 40),
  ('mentors', 'Mentors Circle', 'Private space for Glintr mentors and instructors.', '🧭', 'mentors', false, 50),
  ('brand-owners', 'Brand Owners Roundtable', 'Ops, marketing and revenue talk for Glintr brand owners.', '🏢', 'brand_owners', false, 60),
  ('events', 'Events & Meetups', 'Live sessions, webinars, and community meetups.', '📅', 'public', true, 70)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.community_badges (slug, name, description, icon, tier, criteria) VALUES
  ('first-post', 'First Post', 'Made your first post in the community.', '✍️', 'bronze', '{"posts":1}'),
  ('curious-mind', 'Curious Mind', 'Asked your first question.', '❓', 'bronze', '{"questions":1}'),
  ('helper', 'Helper', 'Received 10 upvotes across your answers.', '🤝', 'silver', '{"upvotes":10}'),
  ('top-answerer', 'Top Answerer', 'Had 5 answers accepted as best.', '🏅', 'gold', '{"accepted":5}'),
  ('trailblazer', 'Trailblazer', 'Started 25 discussions.', '🚀', 'gold', '{"threads":25}'),
  ('community-legend', 'Community Legend', 'Earned 1000 reputation points.', '👑', 'platinum', '{"points":1000}')
ON CONFLICT (slug) DO NOTHING;
