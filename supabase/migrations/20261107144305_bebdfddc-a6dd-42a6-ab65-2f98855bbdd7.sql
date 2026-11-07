CREATE OR REPLACE FUNCTION public.angelo_init_user(_uid uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.angelo_settings (user_id) VALUES (_uid) ON CONFLICT DO NOTHING;
  INSERT INTO public.mm_schedules (user_id) VALUES (_uid) ON CONFLICT DO NOTHING;
  INSERT INTO public.angelo_reminder_rules (user_id, level, days_overdue, firmness, instructions) VALUES
    (_uid, 1, 1, 'courtois', 'Rappel courtois : la facture est arrivée à échéance, inviter au règlement rapide.'),
    (_uid, 2, 15, 'ferme', 'Relance ferme : rappeler les conditions générales de vente et les pénalités de retard.'),
    (_uid, 3, 30, 'mise_en_demeure', 'Dernière relance avant mise en demeure : rappeler la législation applicable et les suites possibles.')
  ON CONFLICT DO NOTHING;
END; $$;

CREATE OR REPLACE FUNCTION public.check_appointment_conflict() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.end_at <= NEW.start_at THEN
    RAISE EXCEPTION 'La fin doit être après le début';
  END IF;
  IF NEW.status <> 'annule' AND EXISTS (
    SELECT 1 FROM public.crm_appointments a
    WHERE a.user_id = NEW.user_id AND a.id <> NEW.id AND a.status <> 'annule'
      AND a.start_at < NEW.end_at + make_interval(mins => NEW.buffer_min)
      AND NEW.start_at < a.end_at + make_interval(mins => a.buffer_min)
  ) THEN
    RAISE EXCEPTION 'CONFLIT: ce créneau chevauche un rendez-vous existant';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.is_address_available(_local text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.sendy_mailboxes WHERE local_part = lower(trim(_local)))
$$;

CREATE OR REPLACE FUNCTION public.validate_share_security() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.permission NOT IN ('view', 'download') THEN RAISE EXCEPTION 'Invalid share permission'; END IF;
 IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.file_id IS DISTINCT FROM OLD.file_id OR NEW.token IS DISTINCT FROM OLD.token) THEN RAISE EXCEPTION 'Share identity cannot be changed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.skycloud_files f WHERE f.id = NEW.file_id AND f.user_id = NEW.user_id AND f.deleted_at IS NULL AND NOT f.encrypted AND split_part(f.storage_path, '/', 1) = NEW.user_id::text) THEN RAISE EXCEPTION 'Sharing denied: foreign, deleted or encrypted file'; END IF;
 IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN RAISE EXCEPTION 'Share expiry must be in the future'; END IF;
 RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.validate_file_security() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.storage_path IS DISTINCT FROM OLD.storage_path OR NEW.encrypted IS DISTINCT FROM OLD.encrypted) THEN
   RAISE EXCEPTION 'File owner, storage path and encryption state cannot be changed';
 END IF;
 IF split_part(NEW.storage_path, '/', 1) <> NEW.user_id::text THEN RAISE EXCEPTION 'Invalid storage owner'; END IF;
 IF NEW.folder_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.skycloud_folders WHERE id = NEW.folder_id AND user_id = NEW.user_id) THEN
   RAISE EXCEPTION 'Folder access denied';
 END IF;
 RETURN NEW;
END; $$;