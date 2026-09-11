-- PostGIS must exist before any table declares a geography column, so this runs as migration 0000.
CREATE EXTENSION IF NOT EXISTS postgis;

-- Domain over geography(Point,4326). See src/infrastructure/db/schema/geography.ts for why the
-- schema points at a domain instead of the parameterised type.
DO $$
BEGIN
  CREATE DOMAIN geography_point AS geography(Point, 4326);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;
