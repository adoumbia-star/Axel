BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE mission_status AS ENUM (
    'draft',
    'loaded',
    'transit',
    'arrived',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  city text NOT NULL,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration text NOT NULL UNIQUE,
  capacity_liters integer NOT NULL CHECK (capacity_liters > 0),
  compartment_count smallint NOT NULL CHECK (compartment_count > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  loading_reference text,
  origin_name text NOT NULL DEFAULT 'GESTOCI Vridi',
  destination_station_id uuid NOT NULL REFERENCES stations(id),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id),
  driver_name text NOT NULL,
  status mission_status NOT NULL DEFAULT 'draft',
  declared_volume_liters integer NOT NULL CHECK (declared_volume_liters >= 0),
  telemetry_volume_liters integer CHECK (telemetry_volume_liters >= 0),
  received_volume_liters integer CHECK (received_volume_liters >= 0),
  scheduled_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mission_compartments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  compartment_number smallint NOT NULL CHECK (compartment_number > 0),
  product text NOT NULL,
  declared_volume_liters integer NOT NULL CHECK (declared_volume_liters >= 0),
  telemetry_volume_liters integer CHECK (telemetry_volume_liters >= 0),
  received_volume_liters integer CHECK (received_volume_liters >= 0),
  UNIQUE (mission_id, compartment_number)
);

CREATE TABLE mission_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  volume_liters integer,
  actor_name text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE tanks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  code text NOT NULL,
  product text NOT NULL,
  capacity_liters integer NOT NULL CHECK (capacity_liters > 0),
  current_volume_liters integer NOT NULL DEFAULT 0 CHECK (current_volume_liters >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (station_id, code)
);

CREATE TABLE pump_readings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  station_id uuid NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  pump_code text NOT NULL,
  product text NOT NULL,
  reading_type text NOT NULL CHECK (reading_type IN ('opening', 'closing')),
  index_liters numeric(14, 2) NOT NULL CHECK (index_liters >= 0),
  actor_name text NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mission_events_mission_at_idx ON mission_events (mission_id, event_at DESC);
CREATE INDEX missions_station_scheduled_idx ON missions (destination_station_id, scheduled_at DESC);
CREATE INDEX pump_readings_station_recorded_idx ON pump_readings (station_id, recorded_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER missions_updated_at
BEFORE UPDATE ON missions
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
