-- liquibase formatted sql

-- changeset sportmatch:002-conversation-match-unique
create unique index uq_conversation_match on conversation (match_id);
-- rollback drop index uq_conversation_match;

-- changeset sportmatch:002-conversation-member
create table conversation_member (
    conversation_id uuid        not null references conversation (id) on delete cascade,
    user_id         varchar(64) not null,
    joined_at       timestamptz not null default now(),
    primary key (conversation_id, user_id)
);
create index idx_member_user on conversation_member (user_id);
-- rollback drop table conversation_member;

-- changeset sportmatch:002-processed-event
create table processed_event (
    event_id     uuid primary key,
    event_type   varchar(80) not null,
    processed_at timestamptz not null default now()
);
-- rollback drop table processed_event;
