-- Create partner_stores table
CREATE TABLE public.partner_stores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  affiliate_tag TEXT,
  search_template TEXT NOT NULL, -- e.g., "{{base_url}}/s?k={{query}}&tag={{affiliate_tag}}"
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add search_query to material_items (nullable, will fallback to name)
ALTER TABLE public.material_items 
ADD COLUMN search_query TEXT;

-- Create store_click_events for metrics
CREATE TABLE public.store_click_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.material_items(id) ON DELETE SET NULL,
  store_id UUID REFERENCES public.partner_stores(id) ON DELETE SET NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  list_id UUID REFERENCES public.material_lists(id) ON DELETE SET NULL,
  session_id TEXT,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_click_events ENABLE ROW LEVEL SECURITY;

-- Partner stores policies
CREATE POLICY "Anyone can view active partner stores"
ON public.partner_stores
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage partner stores"
ON public.partner_stores
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Store click events policies
CREATE POLICY "Anyone can track store clicks"
ON public.store_click_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view store click events"
ON public.store_click_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- School admins can view their school's click events
CREATE POLICY "School admins can view their school store clicks"
ON public.store_click_events
FOR SELECT
USING (is_school_admin(auth.uid(), school_id));

-- Add trigger for updated_at on partner_stores
CREATE TRIGGER update_partner_stores_updated_at
BEFORE UPDATE ON public.partner_stores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default partner stores (Amazon, Kalunga, Papelaria)
INSERT INTO public.partner_stores (name, base_url, affiliate_tag, search_template, order_index) VALUES
('Amazon', 'https://www.amazon.com.br', 'listaescolar-20', '{{base_url}}/s?k={{query}}&tag={{affiliate_tag}}', 1),
('Kalunga', 'https://www.kalunga.com.br', '', '{{base_url}}/pesquisa/{{query}}', 2),
('Shopee', 'https://shopee.com.br', '', '{{base_url}}/search?keyword={{query}}', 3);