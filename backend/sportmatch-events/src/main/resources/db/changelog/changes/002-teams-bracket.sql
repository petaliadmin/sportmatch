-- liquibase formatted sql

-- changeset sportmatch:002-tournament-columns
alter table tournament add column max_teams integer not null default 8;
alter table tournament add column rounds integer;
alter table tournament add column champion_team_id uuid;
-- rollback alter table tournament drop column max_teams, drop column rounds, drop column champion_team_id;

-- changeset sportmatch:002-team
create table team (
    id            uuid primary key,
    tournament_id uuid        not null references tournament (id) on delete cascade,
    name          varchar(60) not null,
    captain_id    varchar(64) not null,
    registered_at timestamptz not null default now(),
    unique (tournament_id, name),
    unique (tournament_id, captain_id)
);
-- rollback drop table team;

-- changeset sportmatch:002-bracket-match
create table bracket_match (
    id             uuid primary key,
    tournament_id  uuid        not null references tournament (id) on delete cascade,
    round          integer     not null,
    position       integer     not null,
    home_team_id   uuid references team (id),
    away_team_id   uuid references team (id),
    home_score     integer,
    away_score     integer,
    winner_team_id uuid references team (id),
    status         varchar(20) not null,
    bye            boolean     not null default false,
    unique (tournament_id, round, position)
);
-- rollback drop table bracket_match;

-- changeset sportmatch:002-outbox
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
