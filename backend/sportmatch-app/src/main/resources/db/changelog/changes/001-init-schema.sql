-- liquibase formatted sql

-- changeset sportmatch:001-venue
create table venue (
    id                  uuid primary key,
    name                varchar(120) not null,
    district            varchar(80)  not null,
    sport               varchar(30)  not null,
    price_per_hour_fcfa integer      not null check (price_per_hour_fcfa >= 0),
    rating              numeric(2, 1),
    created_at          timestamptz  not null default now()
);
create index idx_venue_sport on venue (sport);
-- rollback drop table venue;

-- changeset sportmatch:001-sport-match
create table sport_match (
    id               uuid primary key,
    venue_id         uuid         not null references venue (id),
    sport            varchar(30)  not null,
    starts_at        timestamptz  not null,
    duration_minutes integer      not null,
    max_players      integer      not null check (max_players between 2 and 30),
    level            varchar(30)  not null,
    organizer_id     varchar(64)  not null,
    status           varchar(20)  not null default 'OPEN',
    created_at       timestamptz  not null default now()
);
create index idx_sport_match_status_starts on sport_match (status, starts_at);
-- rollback drop table sport_match;

-- changeset sportmatch:001-match-participant
create table match_participant (
    match_id  uuid        not null references sport_match (id) on delete cascade,
    player_id varchar(64) not null,
    joined_at timestamptz not null default now(),
    primary key (match_id, player_id)
);
-- rollback drop table match_participant;

-- changeset sportmatch:001-outbox
create table outbox_event (
    id             uuid primary key,
    topic          varchar(200) not null,
    aggregate_type varchar(60)  not null,
    aggregate_id   varchar(64)  not null,
    event_type     varchar(80)  not null,
    payload        text         not null,
    created_at     timestamptz  not null default now(),
    published_at   timestamptz
);
create index idx_outbox_pending on outbox_event (created_at) where published_at is null;
-- rollback drop table outbox_event;
