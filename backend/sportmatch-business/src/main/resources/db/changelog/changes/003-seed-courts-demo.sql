-- liquibase formatted sql

-- Terrains de DÉMONSTRATION (fictifs), rattachés aux complexes du catalogue sportmatch-app.
-- changeset sportmatch:003-seed-courts-demo context:!prod
insert into court (id, venue_id, venue_name, name, sport, price_per_hour_fcfa, open_hour, close_hour) values
  ('c0a7c1e0-0001-4b00-9000-000000000001', '0b8a7c1e-0001-4a00-9000-000000000001', 'Arena Almadies Five', 'Terrain A', 'FOOTBALL', 30000, 8, 24),
  ('c0a7c1e0-0001-4b00-9000-000000000002', '0b8a7c1e-0001-4a00-9000-000000000001', 'Arena Almadies Five', 'Terrain B', 'FOOTBALL', 30000, 8, 24),
  ('c0a7c1e0-0001-4b00-9000-000000000003', '0b8a7c1e-0001-4a00-9000-000000000001', 'Arena Almadies Five', 'Terrain C', 'FOOTBALL', 30000, 8, 24),
  ('c0a7c1e0-0002-4b00-9000-000000000001', '0b8a7c1e-0002-4a00-9000-000000000002', 'Complexe Mermoz Sport', 'Five 1', 'FOOTBALL', 25000, 7, 23),
  ('c0a7c1e0-0002-4b00-9000-000000000002', '0b8a7c1e-0002-4a00-9000-000000000002', 'Complexe Mermoz Sport', 'Five 2', 'FOOTBALL', 25000, 7, 23),
  ('c0a7c1e0-0002-4b00-9000-000000000003', '0b8a7c1e-0002-4a00-9000-000000000002', 'Complexe Mermoz Sport', 'Grand terrain', 'FOOTBALL', 25000, 7, 23),
  ('c0a7c1e0-0003-4b00-9000-000000000001', '0b8a7c1e-0003-4a00-9000-000000000003', 'Gymnase Liberté Indoor', 'Salle principale', 'BASKETBALL', 35000, 8, 22),
  ('c0a7c1e0-0004-4b00-9000-000000000001', '0b8a7c1e-0004-4a00-9000-000000000004', 'Tennis Club Corniche', 'Court 1', 'TENNIS', 15000, 7, 22),
  ('c0a7c1e0-0004-4b00-9000-000000000002', '0b8a7c1e-0004-4a00-9000-000000000004', 'Tennis Club Corniche', 'Court 2', 'TENNIS', 15000, 7, 22),
  ('c0a7c1e0-0004-4b00-9000-000000000003', '0b8a7c1e-0004-4a00-9000-000000000004', 'Tennis Club Corniche', 'Court 3', 'TENNIS', 15000, 7, 22),
  ('c0a7c1e0-0004-4b00-9000-000000000004', '0b8a7c1e-0004-4a00-9000-000000000004', 'Tennis Club Corniche', 'Court 4', 'TENNIS', 15000, 7, 22),
  ('c0a7c1e0-0005-4b00-9000-000000000001', '0b8a7c1e-0005-4a00-9000-000000000005', 'Padel House Ngor', 'Piste 1', 'PADEL', 20000, 9, 23),
  ('c0a7c1e0-0005-4b00-9000-000000000002', '0b8a7c1e-0005-4a00-9000-000000000005', 'Padel House Ngor', 'Piste 2', 'PADEL', 20000, 9, 23),
  ('c0a7c1e0-0006-4b00-9000-000000000001', '0b8a7c1e-0006-4a00-9000-000000000006', 'City Court Ouakam', 'Court unique', 'BASKETBALL', 8000, 7, 22),
  ('c0a7c1e0-0007-4b00-9000-000000000001', '0b8a7c1e-0007-4a00-9000-000000000007', 'Stade Municipal de Yoff', 'Terrain d''honneur', 'FOOTBALL', 90000, 8, 22),
  ('c0a7c1e0-0008-4b00-9000-000000000001', '0b8a7c1e-0008-4a00-9000-000000000008', 'Point E Futsal Club', 'Salle futsal', 'FOOTBALL', 28000, 9, 23);
-- rollback delete from court where id::text like 'c0a7c1e0-%';
