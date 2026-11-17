-- liquibase formatted sql

-- changeset sportmatch:002-court
create table court (
    id                  uuid primary key,
    venue_id            uuid         not null,
    venue_name          varchar(120) not null,
    name                varchar(80)  not null,
    sport               varchar(30)  not null,
    price_per_hour_fcfa integer      not null check (price_per_hour_fcfa >= 0),
    open_hour           integer      not null check (open_hour between 0 and 23),
    close_hour          integer      not null check (close_hour between 1 and 24),
    created_at          timestamptz  not null default now()
);
create index idx_court_venue on court (venue_id);
-- rollback drop table court;

-- changeset sportmatch:002-booking
create table booking (
    id           uuid primary key,
    court_id     uuid         not null references court (id),
    user_id      varchar(64)  not null,
    user_email   varchar(160),
    starts_at    timestamptz  not null,
    ends_at      timestamptz  not null,
    price_fcfa   integer      not null,
    status       varchar(20)  not null,
    created_at   timestamptz  not null default now(),
    cancelled_at timestamptz,
    check (ends_at > starts_at)
);
create index idx_booking_court_time on booking (court_id, starts_at) where status = 'CONFIRMED';
create index idx_booking_user on booking (user_id, starts_at desc);
-- rollback drop table booking;

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
