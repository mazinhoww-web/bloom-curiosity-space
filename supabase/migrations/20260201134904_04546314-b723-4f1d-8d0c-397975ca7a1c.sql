-- Add cart_strategy to partner_stores
ALTER TABLE public.partner_stores 
ADD COLUMN cart_strategy TEXT NOT NULL DEFAULT 'SEARCH' 
CHECK (cart_strategy IN ('SEARCH', 'ADD_TO_CART'));

-- Add comment for clarity
COMMENT ON COLUMN public.partner_stores.cart_strategy IS 'SEARCH = opens search page, ADD_TO_CART = direct add to cart (future)';