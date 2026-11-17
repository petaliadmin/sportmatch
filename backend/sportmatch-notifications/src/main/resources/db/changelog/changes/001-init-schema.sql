-- liquibase formatted sql

-- changeset sportmatch:001-processed-event
create table processed_event (
    event_id     uuid primary key,
    event_type   varchar(80) not null,
    processed_at timestamptz not null default now()
);
-- rollback drop table processed_event;

-- changeset sportmatch:001-notification
create table notification (
    id              uuid primary key,
    user_id         varchar(64)  not null,
    title           varchar(160) not null,
    body            text         not null,
    source_event_id uuid,
    created_at      timestamptz  not null default now(),
    read_at         timestamptz
);
create index idx_notification_user on notification (user_id, created_at desc);
-- rollback drop table notification;
