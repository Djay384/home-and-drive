CREATE TABLE public.vehicle_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  changed_by_email text,
  field text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehicle_audit_vehicle ON public.vehicle_audit(vehicle_id, created_at DESC);

GRANT SELECT ON public.vehicle_audit TO authenticated;
GRANT ALL ON public.vehicle_audit TO service_role;

ALTER TABLE public.vehicle_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view vehicle audit"
ON public.vehicle_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));