-- liquibase formatted sql

-- changeset sportmatch:002-platform-event
create table platform_event (
    event_id     uuid primary key,
    event_type   varchar(80)  not null,
    source       varchar(60)  not null,
    aggregate_id varchar(64)  not null,
    occurred_at  timestamptz  not null,
    payload      text         not null,
    received_at  timestamptz  not null default now()
);
create index idx_platform_event_time on platform_event (occurred_at desc);
create index idx_platform_event_type on platform_event (event_type, occurred_at desc);
-- rollback drop table platform_event;
