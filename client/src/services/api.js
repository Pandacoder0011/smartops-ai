import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

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

export const aiService = {
  queryCopilot: async (prompt) => {
    const response = await api.post('/ai/query', { prompt });
    return response.data;
  }
};

export default api;
