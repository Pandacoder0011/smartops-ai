import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { dashboardService } from '../services/api';
import toast from 'react-hot-toast';

export const useMetrics = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchMetrics = async () => {
    try {
      const response = await dashboardService.getMetrics();
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleMetricUpdate = (updatedMetric) => {
        setMetrics((prevMetrics) => {
          const index = prevMetrics.findIndex((m) => m.name === updatedMetric.name);
          if (index !== -1) {
            const updated = [...prevMetrics];
            updated[index] = updatedMetric;
            return updated;
          } else {
            return [...prevMetrics, updatedMetric];
          }
        });
      };

      socket.on('metric_update', handleMetricUpdate);

      return () => {
        socket.off('metric_update', handleMetricUpdate);
      };
    }
  }, [socket]);

  return { metrics, loading, refetch: fetchMetrics };
};

export default useMetrics;
