
ALTER FUNCTION public.set_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

DROP POLICY "Anyone can send" ON public.contact_messages;
CREATE POLICY "Anyone can send" ON public.contact_messages FOR INSERT
  WITH CHECK (length(name) BETWEEN 1 AND 100 AND length(email) BETWEEN 3 AND 255 AND length(message) BETWEEN 1 AND 5000);
