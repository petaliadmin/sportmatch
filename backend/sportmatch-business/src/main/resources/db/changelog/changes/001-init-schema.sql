-- liquibase formatted sql

-- changeset sportmatch:001-provider
create table provider (
    id         uuid primary key,
    owner_id   varchar(64)  not null,
    name       varchar(160) not null,
    district   varchar(80)  not null,
    verified   boolean      not null default false,
    created_at timestamptz  not null default now()
);
-- rollback drop table provider;
