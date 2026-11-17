-- liquibase formatted sql

-- changeset sportmatch:001-conversation
create table conversation (
    id         uuid primary key,
    match_id   uuid,
    created_at timestamptz not null default now()
);
-- rollback drop table conversation;

-- changeset sportmatch:001-message
create table message (
    id              uuid primary key,
    conversation_id uuid         not null references conversation (id) on delete cascade,
    sender_id       varchar(64)  not null,
    body            text         not null,
    sent_at         timestamptz  not null default now()
);
create index idx_message_conversation on message (conversation_id, sent_at);
-- rollback drop table message;
