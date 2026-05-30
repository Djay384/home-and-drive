
-- Tighten public booking INSERT (no longer USING (true))
DROP POLICY "Anyone can create a booking" ON public.bookings;
CREATE POLICY "Anyone can create a pending booking"
ON public.bookings FOR INSERT TO anon, authenticated
WITH CHECK (
  length(customer_name) > 0
  AND length(customer_email) > 3
  AND customer_email LIKE '%@%'
  AND total_amount >= 0
  AND amount_charged >= 0
  AND payment_status = 'pending'
  AND stripe_session_id IS NULL
  AND paid_at IS NULL
);

-- Lock down has_role: RLS engine uses it as definer-owner; public callers don't need EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
