CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- first registered user becomes admin
CREATE OR REPLACE FUNCTION public.handle_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_first_admin();

CREATE TABLE public.menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price integer NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.menus TO anon, authenticated;
GRANT ALL ON public.menus TO service_role;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active menus" ON public.menus FOR SELECT TO anon, authenticated USING (is_active OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE,
  customer_name text NOT NULL,
  whatsapp text NOT NULL,
  menu_id uuid REFERENCES public.menus(id),
  menu_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price integer NOT NULL,
  promo_code text,
  subtotal integer NOT NULL,
  discount integer NOT NULL DEFAULT 0,
  total_price integer NOT NULL,
  pickup_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'Baru' CHECK (status IN ('Baru','Dikonfirmasi','Diproses','Siap Diambil','Selesai','Dibatalkan')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.menus (name, description, price, stock, image_url) VALUES
('Nasi Ayam Geprek Mbak Sari', 'Ayam goreng tepung digeprek dengan sambal bawang, nasi hangat, dan lalapan.', 15000, 30, '/images/geprek.jpg'),
('Mie Godog Pak Darto', 'Mie rebus kuah kental ala Jawa dengan telur, sayur, dan suwiran ayam.', 12000, 25, '/images/miegodog.jpg'),
('Nasi Bakar Cakalang Bu Rina', 'Nasi gurih isi cakalang suwir pedas dibakar dalam daun pisang.', 18000, 20, '/images/nasibakar.jpg'),
('Paket Iga Bakar Kantin Teknik', 'Iga sapi bakar madu, nasi, sambal matah, dan es teh manis.', 25000, 15, '/images/iga.jpg'),
('Pecel Lele Mas Joko', 'Lele goreng garing dengan sambal terasi, tempe, dan lalapan segar.', 10000, 40, '/images/pecellele.jpg');