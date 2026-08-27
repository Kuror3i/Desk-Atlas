DROP SCHEMA IF EXISTS public CASCADE;

CREATE SCHEMA public AUTHORIZATION postgres;

GRANT USAGE ON SCHEMA public
TO postgres, anon, authenticated, service_role;

GRANT ALL ON SCHEMA public
TO postgres, service_role;