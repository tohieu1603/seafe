/**
 * API client cho hệ thống bán hải sản
 */

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'}/api`;

// ============================================
// TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url?: string;
  sort_order: number;
}

export interface Seafood {
  id: string;
  code: string;
  name: string;
  category_id?: string;
  category?: Category;
  unit_type: 'kg' | 'piece' | 'box';
  avg_unit_weight?: number;
  current_price: number;
  stock_quantity: number;
  description?: string;
  origin?: string;
  image_url?: string;
  tags: string[];
  status: string;
  created_at: string;
}

export interface ImportSource {
  id: string;
  name: string;
  source_type: string;
  contact_info: Record<string, any>;
  notes?: string;
}

export interface ImportBatch {
  id: string;
  seafood_id: string;
  seafood: Seafood;
  batch_code: string;
  import_source_id?: string;
  import_source?: ImportSource;
  import_date: string;
  import_price: number;
  sell_price: number;
  total_weight: number;
  remaining_weight: number;
  notes?: string;
  import_details: Record<string, any>;
  status: string;
}

export interface OrderItem {
  id?: string;
  seafood_id: string;
  seafood?: Seafood;
  import_batch_id?: string;
  quantity?: number;
  weight: number;
  unit_price: number;
  subtotal?: number;
  notes?: string;
}

export interface Order {
  id: string;
  order_code: string;
  customer_name?: string;
  customer_phone: string;
  customer_address?: string;
  payment_method?: string;
  payment_status: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  notes?: string;
  items: OrderItem[];
  created_at: string;
}

export interface DashboardStats {
  total_products: number;
  total_stock_value: number;
  today_orders: number;
  today_revenue: number;
  low_stock_products: number;
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Categories API
 */
export const categoriesAPI = {
  list: async (): Promise<Category[]> => {
    const res = await fetch(`${API_BASE_URL}/seafood/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  create: async (data: Partial<Category>, token?: string): Promise<Category> => {
    const res = await fetch(`${API_BASE_URL}/seafood/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create category');
    return res.json();
  },

  update: async (id: string, data: Partial<Category>, token?: string): Promise<Category> => {
    const res = await fetch(`${API_BASE_URL}/seafood/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update category');
    return res.json();
  },

  delete: async (id: string, token?: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/seafood/categories/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!res.ok) throw new Error('Failed to delete category');
  },
};

/**
 * Products API
 */
export const productsAPI = {
  list: async (params?: { category_id?: string; status?: string; search?: string }): Promise<Seafood[]> => {
    const query = new URLSearchParams();
    if (params?.category_id) query.set('category_id', params.category_id);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);

    const res = await fetch(`${API_BASE_URL}/seafood/products?${query}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  get: async (id: string): Promise<Seafood> => {
    const res = await fetch(`${API_BASE_URL}/seafood/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  create: async (data: Partial<Seafood>, token?: string): Promise<Seafood> => {
    const res = await fetch(`${API_BASE_URL}/seafood/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
  },

  update: async (id: string, data: Partial<Seafood>, token?: string): Promise<Seafood> => {
    const res = await fetch(`${API_BASE_URL}/seafood/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  delete: async (id: string, token?: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/seafood/products/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!res.ok) throw new Error('Failed to delete product');
  },
};

/**
 * Import Sources API
 */
export const importSourcesAPI = {
  list: async (): Promise<ImportSource[]> => {
    const res = await fetch(`${API_BASE_URL}/seafood/import-sources`);
    if (!res.ok) throw new Error('Failed to fetch import sources');
    return res.json();
  },

  create: async (data: Partial<ImportSource>, token?: string): Promise<ImportSource> => {
    const res = await fetch(`${API_BASE_URL}/seafood/import-sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create import source');
    return res.json();
  },
};

/**
 * Import Batches API
 */
export const importBatchesAPI = {
  list: async (seafood_id?: string): Promise<ImportBatch[]> => {
    const query = seafood_id ? `?seafood_id=${seafood_id}` : '';
    const res = await fetch(`${API_BASE_URL}/seafood/import-batches${query}`);
    if (!res.ok) throw new Error('Failed to fetch import batches');
    return res.json();
  },

  create: async (data: Partial<ImportBatch>, token?: string): Promise<ImportBatch> => {
    const res = await fetch(`${API_BASE_URL}/seafood/import-batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create import batch');
    return res.json();
  },
};

/**
 * Orders API (POS)
 */
export const ordersAPI = {
  list: async (params?: { status?: string; customer_phone?: string; limit?: number }): Promise<Order[]> => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.customer_phone) query.set('customer_phone', params.customer_phone);
    if (params?.limit) query.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/seafood/orders?${query}`);
    if (!res.ok) throw new Error('Failed to fetch orders');
    return res.json();
  },

  get: async (id: string): Promise<Order> => {
    const res = await fetch(`${API_BASE_URL}/seafood/orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch order');
    return res.json();
  },

  create: async (data: {
    customer_name?: string;
    customer_phone: string;
    customer_address?: string;
    payment_method?: string;
    payment_status?: string;
    discount_amount?: number;
    notes?: string;
    items: OrderItem[];
  }, token?: string): Promise<Order> => {
    const res = await fetch(`${API_BASE_URL}/seafood/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to create order');
    }
    return res.json();
  },

  update: async (id: string, data: Partial<Order>, token?: string): Promise<Order> => {
    const res = await fetch(`${API_BASE_URL}/seafood/orders/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update order');
    return res.json();
  },

  cancel: async (id: string, token?: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/seafood/orders/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
    if (!res.ok) throw new Error('Failed to cancel order');
  },
};

/**
 * Stats API
 */
export const statsAPI = {
  dashboard: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE_URL}/seafood/stats/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  products: async (limit = 10): Promise<any[]> => {
    const res = await fetch(`${API_BASE_URL}/seafood/stats/products?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch product stats');
    return res.json();
  },
};

/**
 * Helper function to format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Helper function to format weight
 */
export const formatWeight = (weight: number): string => {
  return `${weight.toFixed(2)} kg`;
};
