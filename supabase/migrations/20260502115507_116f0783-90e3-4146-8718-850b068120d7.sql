REVOKE EXECUTE ON FUNCTION public.seed_demo_data() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.purge_demo_data() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_demo_org() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.seed_demo_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_demo_data() TO authenticated;