-- liquibase formatted sql

-- changeset sportmatch:001-audit-log
create table audit_log (
    id         uuid primary key,
    actor_id   varchar(64)  not null,
    action     varchar(80)  not null,
    target     varchar(160),
    created_at timestamptz  not null default now()
);
-- rollback drop table audit_log;
