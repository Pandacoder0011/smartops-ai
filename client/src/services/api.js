import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('🔑 Token expired or unauthorized request. Logging out user... 🛡️');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Dispatch custom event to trigger React state updates
      window.dispatchEvent(new CustomEvent('unauthorized-redirect'));
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------
// Auth Services
// ------------------------------------------
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  }
};

// ------------------------------------------
// Dashboard Metrics Services
// ------------------------------------------
export const dashboardService = {
  getMetrics: async () => {
    const response = await api.get('/dashboard/metrics');
    return response.data;
  },
  
  updateMetric: async (metricData) => {
    const response = await api.post('/dashboard/metrics', metricData);
    return response.data;
  },
  
  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/dashboard/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// ------------------------------------------
// Analytics Services
// ------------------------------------------
export const analyticsService = {
  getOverview: async () => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },

  getSalesTrend: async (period = '30d') => {
    const response = await api.get(`/analytics/sales-trend?period=${period}`);
    return response.data;
  },

  getTopProducts: async (limit = 10) => {
    const response = await api.get(`/analytics/top-products?limit=${limit}`);
    return response.data;
  },

  getCustomerSegments: async () => {
    const response = await api.get('/analytics/customer-segments');
    return response.data;
  },

  getInventoryStatus: async () => {
    const response = await api.get('/analytics/inventory-status');
    return response.data;
  },

  getRevenueByRegion: async () => {
    const response = await api.get('/analytics/revenue-by-region');
    return response.data;
  },

  getEmployeePerformance: async () => {
    const response = await api.get('/analytics/employee-performance');
    return response.data;
  },

  getFinancialSummary: async () => {
    const response = await api.get('/analytics/financial-summary');
    return response.data;
  }
};

// ------------------------------------------
// AI Services
// ------------------------------------------
export const aiService = {
  getInsights: async () => {
    const response = await api.get('/ai/insights');
    return response.data;
  },

  getPredictions: async () => {
    const response = await api.get('/ai/predict');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/ai/history');
    return response.data;
  }
};

// ------------------------------------------
// Products Services
// ------------------------------------------
export const productsService = {
  getAll: async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/products', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
  bulkDelete: async (ids) => {
    const response = await api.post('/products/bulk-delete', { ids });
    return response.data;
  },
  bulkUpdateStatus: async (ids, status) => {
    const response = await api.post('/products/bulk-status', { ids, status });
    return response.data;
  }
};

// ------------------------------------------
// Customers Services
// ------------------------------------------
export const customersService = {
  getAll: async (params) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/customers', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/customers/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },
  bulkDelete: async (ids) => {
    const response = await api.post('/customers/bulk-delete', { ids });
    return response.data;
  }
};

// ------------------------------------------
// Sales Services
// ------------------------------------------
export const salesService = {
  getAll: async (params) => {
    const response = await api.get('/sales', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/sales', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/sales/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  }
};

// ------------------------------------------
// Employees Services
// ------------------------------------------
export const employeesService = {
  getAll: async (params) => {
    const response = await api.get('/employees', { params });
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/employees', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
  bulkDelete: async (ids) => {
    const response = await api.post('/employees/bulk-delete', { ids });
    return response.data;
  }
};

export default api;
