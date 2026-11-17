-- liquibase formatted sql

-- Données de démonstration FICTIVES (mêmes terrains que le prototype). Jamais chargées en production.
-- changeset sportmatch:002-seed-venues-demo context:!prod
insert into venue (id, name, district, sport, price_per_hour_fcfa, rating) values
  ('0b8a7c1e-0001-4a00-9000-000000000001', 'Arena Almadies Five',     'Almadies',  'FOOTBALL',   30000, 4.8),
  ('0b8a7c1e-0002-4a00-9000-000000000002', 'Complexe Mermoz Sport',   'Mermoz',    'FOOTBALL',   25000, 4.6),
  ('0b8a7c1e-0003-4a00-9000-000000000003', 'Gymnase Liberté Indoor',  'Liberté 6', 'BASKETBALL', 35000, 4.5),
  ('0b8a7c1e-0004-4a00-9000-000000000004', 'Tennis Club Corniche',    'Fann',      'TENNIS',     15000, 4.7),
  ('0b8a7c1e-0005-4a00-9000-000000000005', 'Padel House Ngor',        'Ngor',      'PADEL',      20000, 4.9),
  ('0b8a7c1e-0006-4a00-9000-000000000006', 'City Court Ouakam',       'Ouakam',    'BASKETBALL',  8000, 4.2),
  ('0b8a7c1e-0007-4a00-9000-000000000007', 'Stade Municipal de Yoff', 'Yoff',      'FOOTBALL',   90000, 4.3),
  ('0b8a7c1e-0008-4a00-9000-000000000008', 'Point E Futsal Club',     'Point E',   'FOOTBALL',   28000, 4.4);
-- rollback delete from venue where id::text like '0b8a7c1e-%';
