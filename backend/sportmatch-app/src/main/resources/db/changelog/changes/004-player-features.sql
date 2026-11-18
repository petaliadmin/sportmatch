-- liquibase formatted sql

-- changeset sportmatch:004-names-and-series
alter table sport_match add column organizer_name varchar(120);
alter table sport_match add column series_id uuid;
alter table match_participant add column player_name varchar(120);
-- Présence constatée par l'organisateur après le match : null = non renseignée.
alter table match_participant add column attended boolean;
create index idx_match_participant_player on match_participant (player_id);
-- rollback drop index idx_match_participant_player; alter table match_participant drop column attended; alter table match_participant drop column player_name; alter table sport_match drop column series_id; alter table sport_match drop column organizer_name;

-- changeset sportmatch:004-player-profile
create table player_profile (
    user_id        varchar(64) primary key,
    display_name   varchar(120) not null,
    favorite_sport varchar(30),
    level          varchar(30),
    district       varchar(80),
    bio            varchar(280),
    updated_at     timestamptz not null default now()
);
-- rollback drop table player_profile;
