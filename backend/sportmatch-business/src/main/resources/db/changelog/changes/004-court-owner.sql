-- liquibase formatted sql

-- changeset sportmatch:004-court-owner
alter table court add column owner_login varchar(64);
create index idx_court_owner on court (owner_login);
-- rollback alter table court drop column owner_login;

-- Terrains de DÉMONSTRATION confiés au prestataire de démo (compte Keycloak ibou.business).
-- changeset sportmatch:004-seed-court-owner context:!prod
update court set owner_login = 'ibou.business'
where venue_id in ('0b8a7c1e-0001-4a00-9000-000000000001', '0b8a7c1e-0005-4a00-9000-000000000005');
-- rollback update court set owner_login = null;
