CREATE OR REPLACE FUNCTION public.enforce_order_status_flow()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE flow text[] := ARRAY['Baru','Dikonfirmasi','Diproses','Siap Diambil','Selesai'];
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF NEW.status = 'Dibatalkan' AND OLD.status NOT IN ('Selesai','Dibatalkan') THEN RETURN NEW; END IF;
  IF array_position(flow, NEW.status) = array_position(flow, OLD.status) + 1 THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'Perubahan status tidak valid: % -> %', OLD.status, NEW.status;
END $$;
CREATE TRIGGER orders_status_flow BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_order_status_flow();