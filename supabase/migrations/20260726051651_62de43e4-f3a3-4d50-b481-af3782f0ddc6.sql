
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('practitioner', 'studio_owner', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by anyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile + default practitioner role on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'practitioner'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Studios
CREATE TABLE public.studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  continent text NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  address text,
  latitude double precision,
  longitude double precision,
  hours jsonb DEFAULT '{}'::jsonb,
  email text,
  phone text,
  website text,
  socials jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.studios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studios TO authenticated;
GRANT ALL ON public.studios TO service_role;
ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved studios public" ON public.studios FOR SELECT USING (status = 'approved' OR auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Studio owners insert" ON public.studios FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id AND public.has_role(auth.uid(),'studio_owner'));
CREATE POLICY "Studio owners update own" ON public.studios FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Studio owners delete own" ON public.studios FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_studios_geo ON public.studios (continent, country, city);
CREATE INDEX idx_studios_status ON public.studios (status);

-- Studio photos
CREATE TABLE public.studio_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.studio_photos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.studio_photos TO authenticated;
GRANT ALL ON public.studio_photos TO service_role;
ALTER TABLE public.studio_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Photos public" ON public.studio_photos FOR SELECT USING (true);
CREATE POLICY "Owner manage photos" ON public.studio_photos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.studios s WHERE s.id = studio_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.studios s WHERE s.id = studio_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE INDEX idx_photos_studio ON public.studio_photos (studio_id, position);

-- Contact messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read messages" ON public.contact_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_studios_updated BEFORE UPDATE ON public.studios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
