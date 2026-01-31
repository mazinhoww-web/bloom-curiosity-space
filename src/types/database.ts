// Database types for Lista Escolar

export interface School {
  id: string;
  name: string;
  slug: string;
  cep: string;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Grade {
  id: string;
  name: string;
  order_index: number;
  created_at: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  order_index: number;
  created_at: string;
}

export interface MaterialList {
  id: string;
  school_id: string;
  grade_id: string;
  year: number;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialItem {
  id: string;
  list_id: string;
  category_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  description: string | null;
  brand_suggestion: string | null;
  price_estimate: number | null;
  purchase_url: string | null;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseEvent {
  id: string;
  item_id: string;
  list_id: string;
  school_id: string;
  clicked_at: string;
  user_agent: string | null;
  referrer: string | null;
}

export interface ShareEvent {
  id: string;
  list_id: string;
  school_id: string;
  share_type: string;
  shared_at: string;
}

// Extended types with relations
export interface MaterialListWithDetails extends MaterialList {
  school?: School;
  grade?: Grade;
  items?: MaterialItemWithCategory[];
}

export interface MaterialItemWithCategory extends MaterialItem {
  category?: MaterialCategory;
}

export interface SchoolWithLists extends School {
  material_lists?: MaterialListWithDetails[];
}
