-- Une base et un utilisateur par microservice (database-per-service).
-- En local tout tient sur une seule instance PostgreSQL ; en staging, une instance RDS, une base par service.
CREATE USER sm_app WITH PASSWORD 'sm_app';
CREATE DATABASE sportmatch_app OWNER sm_app;

CREATE USER sm_events WITH PASSWORD 'sm_events';
CREATE DATABASE sportmatch_events OWNER sm_events;

CREATE USER sm_business WITH PASSWORD 'sm_business';
CREATE DATABASE sportmatch_business OWNER sm_business;

CREATE USER sm_admin WITH PASSWORD 'sm_admin';
CREATE DATABASE sportmatch_admin OWNER sm_admin;

CREATE USER sm_notifications WITH PASSWORD 'sm_notifications';
CREATE DATABASE sportmatch_notifications OWNER sm_notifications;

CREATE USER sm_chat WITH PASSWORD 'sm_chat';
CREATE DATABASE sportmatch_chat OWNER sm_chat;
