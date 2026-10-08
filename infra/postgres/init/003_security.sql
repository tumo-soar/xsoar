REVOKE ALL ON SCHEMA public FROM PUBLIC;

SELECT format('REVOKE ALL ON DATABASE %I FROM PUBLIC', current_database())
\gexec
SELECT format('GRANT CONNECT ON DATABASE %I TO svc_api, svc_collector, svc_orchestrator',
              current_database())
\gexec

-- SELECT on api.collector_sources is granted by the api migration that creates the view.
GRANT USAGE ON SCHEMA api TO svc_collector;
