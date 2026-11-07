ALTER TABLE public.crm_appointments RENAME TO calendsky_appointments;
CREATE OR REPLACE FUNCTION public.check_appointment_conflict() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_at <= NEW.start_at THEN
    RAISE EXCEPTION 'La fin doit être après le début';
  END IF;
  IF NEW.status <> 'annule' AND EXISTS (
    SELECT 1 FROM public.calendsky_appointments a
    WHERE a.user_id = NEW.user_id AND a.id <> NEW.id AND a.status <> 'annule'
      AND a.start_at < NEW.end_at + make_interval(mins => NEW.buffer_min)
      AND NEW.start_at < a.end_at + make_interval(mins => a.buffer_min)
  ) THEN
    RAISE EXCEPTION 'CONFLIT: ce créneau chevauche un rendez-vous existant';
  END IF;
  RETURN NEW;
END $$;