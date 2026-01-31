-- Create app_role enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table (for secure role management)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Schools table
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    cep TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Grades table (17 séries escolares)
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Material categories table
CREATE TABLE public.material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Material lists table (connects school + grade + year)
CREATE TABLE public.material_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    grade_id UUID REFERENCES public.grades(id) ON DELETE RESTRICT NOT NULL,
    year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (school_id, grade_id, year)
);

-- Material items table
CREATE TABLE public.material_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES public.material_lists(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit TEXT DEFAULT 'un',
    description TEXT,
    brand_suggestion TEXT,
    price_estimate DECIMAL(10,2),
    purchase_url TEXT,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Purchase events table (tracking clicks)
CREATE TABLE public.purchase_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES public.material_items(id) ON DELETE CASCADE NOT NULL,
    list_id UUID REFERENCES public.material_lists(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_agent TEXT,
    referrer TEXT
);

-- Share events table (tracking shares)
CREATE TABLE public.share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID REFERENCES public.material_lists(id) ON DELETE CASCADE NOT NULL,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
    share_type TEXT NOT NULL, -- 'whatsapp', 'copy_link', etc
    shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ policies (everyone can read active schools and lists)
CREATE POLICY "Anyone can view active schools" ON public.schools
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view grades" ON public.grades
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view categories" ON public.material_categories
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view active lists" ON public.material_lists
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view items from active lists" ON public.material_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.material_lists 
            WHERE id = material_items.list_id AND is_active = true
        )
    );

-- PUBLIC INSERT policies for events (anyone can track)
CREATE POLICY "Anyone can track purchase clicks" ON public.purchase_events
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can track shares" ON public.share_events
    FOR INSERT WITH CHECK (true);

-- ADMIN policies (full access)
CREATE POLICY "Admins can view all schools" ON public.schools
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert schools" ON public.schools
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update schools" ON public.schools
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete schools" ON public.schools
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage lists" ON public.material_lists
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage items" ON public.material_items
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage categories" ON public.material_categories
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all events" ON public.purchase_events
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all share events" ON public.share_events
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view user roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage user roles" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_schools_updated_at
    BEFORE UPDATE ON public.schools
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_lists_updated_at
    BEFORE UPDATE ON public.material_lists
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_material_items_updated_at
    BEFORE UPDATE ON public.material_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_schools_cep ON public.schools(cep);
CREATE INDEX idx_schools_slug ON public.schools(slug);
CREATE INDEX idx_schools_city_state ON public.schools(city, state);
CREATE INDEX idx_material_lists_school_grade ON public.material_lists(school_id, grade_id);
CREATE INDEX idx_material_items_list ON public.material_items(list_id);
CREATE INDEX idx_material_items_category ON public.material_items(category_id);
CREATE INDEX idx_purchase_events_item ON public.purchase_events(item_id);
CREATE INDEX idx_purchase_events_school ON public.purchase_events(school_id);
CREATE INDEX idx_share_events_list ON public.share_events(list_id);