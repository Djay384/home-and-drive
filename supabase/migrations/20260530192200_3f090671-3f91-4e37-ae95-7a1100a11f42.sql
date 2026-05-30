
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.payment_mode AS ENUM ('deposit', 'full');
CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'cancelled', 'expired');
CREATE TYPE public.booking_type AS ENUM ('vehicle', 'property', 'both');

-- =========================
-- TIMESTAMP TRIGGER
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =========================
-- PICKUP LOCATIONS
-- =========================
CREATE TABLE public.pickup_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.pickup_locations TO anon, authenticated;
GRANT ALL ON public.pickup_locations TO service_role;

ALTER TABLE public.pickup_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pickup locations"
ON public.pickup_locations FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins manage pickup locations"
ON public.pickup_locations FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.pickup_locations (slug, name, display_order) VALUES
  ('aeroport', 'Aéroport Pôle Caraïbes', 1),
  ('port-pap', 'Port de Pointe-à-Pitre', 2),
  ('agence-abymes', 'Agence aux Abymes', 3);

-- =========================
-- VEHICLES
-- =========================
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  price_per_day NUMERIC(10,2) NOT NULL CHECK (price_per_day >= 0),
  transmission TEXT NOT NULL DEFAULT 'Automatique',
  seats INT NOT NULL DEFAULT 5,
  fuel TEXT NOT NULL DEFAULT 'Essence',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vehicles TO anon, authenticated;
GRANT ALL ON public.vehicles TO service_role;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active vehicles"
ON public.vehicles FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins manage vehicles"
ON public.vehicles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- PROPERTIES
-- =========================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_urls TEXT[] NOT NULL DEFAULT '{}',
  capacity INT NOT NULL DEFAULT 2,
  bedrooms INT NOT NULL DEFAULT 1,
  price_per_night NUMERIC(10,2) NOT NULL CHECK (price_per_night >= 0),
  location TEXT,
  amenities TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.properties TO anon, authenticated;
GRANT ALL ON public.properties TO service_role;

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active properties"
ON public.properties FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins manage properties"
ON public.properties FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- BOOKINGS
-- =========================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE DEFAULT ('RTH-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  booking_type booking_type NOT NULL,

  -- customer
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  flight_info TEXT,

  -- vehicle leg
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  pickup_location_id UUID REFERENCES public.pickup_locations(id),
  dropoff_location_id UUID REFERENCES public.pickup_locations(id),
  vehicle_start TIMESTAMPTZ,
  vehicle_end TIMESTAMPTZ,
  vehicle_total NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- property leg
  property_id UUID REFERENCES public.properties(id) ON DELETE RESTRICT,
  property_checkin DATE,
  property_checkout DATE,
  property_guests INT,
  property_total NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- payment
  total_amount NUMERIC(10,2) NOT NULL,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_mode payment_mode NOT NULL DEFAULT 'full',
  amount_charged NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,

  -- lifecycle
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_vehicle_dates ON public.bookings (vehicle_id, vehicle_start, vehicle_end)
  WHERE payment_status IN ('paid', 'pending');
CREATE INDEX idx_bookings_property_dates ON public.bookings (property_id, property_checkin, property_checkout)
  WHERE payment_status IN ('paid', 'pending');
CREATE INDEX idx_bookings_stripe_session ON public.bookings (stripe_session_id);

GRANT SELECT, INSERT ON public.bookings TO anon, authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Anonymous customers create bookings; reads are restricted (no PII leak)
CREATE POLICY "Anyone can create a booking"
ON public.bookings FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all bookings"
ON public.bookings FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update bookings"
ON public.bookings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
