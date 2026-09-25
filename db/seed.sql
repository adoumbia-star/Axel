BEGIN;

INSERT INTO stations (code, name, city, latitude, longitude)
VALUES ('ABJ-COC', 'Station Cocody', 'Abidjan', 5.348400, -3.986700)
ON CONFLICT (code) DO NOTHING;

INSERT INTO vehicles (registration, capacity_liters, compartment_count)
VALUES ('TR-458', 45000, 5)
ON CONFLICT (registration) DO NOTHING;

INSERT INTO missions (
  reference,
  loading_reference,
  destination_station_id,
  vehicle_id,
  driver_name,
  status,
  declared_volume_liters,
  telemetry_volume_liters,
  scheduled_at
)
SELECT
  'MS-2026-0918',
  'BC-GES-250926-1842',
  s.id,
  v.id,
  'Yao Kouassi',
  'transit',
  45000,
  44880,
  '2026-09-25T09:54:00Z'
FROM stations s
CROSS JOIN vehicles v
WHERE s.code = 'ABJ-COC' AND v.registration = 'TR-458'
ON CONFLICT (reference) DO NOTHING;

INSERT INTO mission_compartments (
  mission_id,
  compartment_number,
  product,
  declared_volume_liters,
  telemetry_volume_liters,
  received_volume_liters
)
SELECT
  m.id,
  values.compartment_number,
  values.product,
  9000,
  values.telemetry,
  values.received
FROM missions m
CROSS JOIN (
  VALUES
    (1, 'Gasoil', 8980, 8980),
    (2, 'Gasoil', 8975, 8975),
    (3, 'Super',   8990, 8990),
    (4, 'Super',   8950, 8950),
    (5, 'Gasoil',  8985, 8985)
) AS values(compartment_number, product, telemetry, received)
WHERE m.reference = 'MS-2026-0918'
ON CONFLICT (mission_id, compartment_number) DO NOTHING;

INSERT INTO tanks (station_id, code, product, capacity_liters, current_volume_liters)
SELECT s.id, values.code, values.product, 20000, values.current_volume
FROM stations s
CROSS JOIN (
  VALUES
    ('CUVE 01', 'Gasoil', 18200),
    ('CUVE 02', 'Super',  13120),
    ('CUVE 03', 'Gasoil', 12600)
) AS values(code, product, current_volume)
WHERE s.code = 'ABJ-COC'
ON CONFLICT (station_id, code) DO NOTHING;

COMMIT;
