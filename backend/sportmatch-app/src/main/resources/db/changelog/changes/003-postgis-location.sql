-- liquibase formatted sql

-- L'extension est créée par le superutilisateur (init PostgreSQL / conteneur postgres-setup en local,
-- Terraform sur RDS) ; IF NOT EXISTS la rend sans effet ici si elle existe déjà.
-- changeset sportmatch:003-postgis-extension
create extension if not exists postgis;
-- rollback select 1;

-- changeset sportmatch:003-venue-location
alter table venue add column location geography(Point, 4326);
create index idx_venue_location on venue using gist (location);
-- rollback alter table venue drop column location;

-- Coordonnées approximatives des quartiers de Dakar pour les terrains de DÉMONSTRATION.
-- changeset sportmatch:003-seed-venue-location context:!prod
update venue set location = ST_SetSRID(ST_MakePoint(-17.515, 14.7453), 4326)::geography where id = '0b8a7c1e-0001-4a00-9000-000000000001';
update venue set location = ST_SetSRID(ST_MakePoint(-17.4776, 14.7071), 4326)::geography where id = '0b8a7c1e-0002-4a00-9000-000000000002';
update venue set location = ST_SetSRID(ST_MakePoint(-17.4612, 14.727), 4326)::geography where id = '0b8a7c1e-0003-4a00-9000-000000000003';
update venue set location = ST_SetSRID(ST_MakePoint(-17.4652, 14.6905), 4326)::geography where id = '0b8a7c1e-0004-4a00-9000-000000000004';
update venue set location = ST_SetSRID(ST_MakePoint(-17.5128, 14.7505), 4326)::geography where id = '0b8a7c1e-0005-4a00-9000-000000000005';
update venue set location = ST_SetSRID(ST_MakePoint(-17.4931, 14.723), 4326)::geography where id = '0b8a7c1e-0006-4a00-9000-000000000006';
update venue set location = ST_SetSRID(ST_MakePoint(-17.473, 14.757), 4326)::geography where id = '0b8a7c1e-0007-4a00-9000-000000000007';
update venue set location = ST_SetSRID(ST_MakePoint(-17.457, 14.6962), 4326)::geography where id = '0b8a7c1e-0008-4a00-9000-000000000008';
-- rollback update venue set location = null;
