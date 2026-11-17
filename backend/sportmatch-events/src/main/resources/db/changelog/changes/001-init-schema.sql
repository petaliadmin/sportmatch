-- liquibase formatted sql

-- changeset sportmatch:001-tournament
create table tournament (
    id           uuid primary key,
    organizer_id varchar(64)  not null,
    name         varchar(160) not null,
    sport        varchar(30)  not null,
    starts_on    date         not null,
    status       varchar(20)  not null default 'DRAFT',
    created_at   timestamptz  not null default now()
);
-- rollback drop table tournament;
