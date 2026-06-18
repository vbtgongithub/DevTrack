import api from '../utils/axiosClient';

export const analyticsService = {
  async trackEvent(eventName: string, properties: Record<string, any> = {}) {
    try {
      await api.post('/analytics/event', { eventName, properties });
    } catch (err) {
      console.warn('Failed to track event:', eventName, err);
    }
  },

  async submitFeedback(rating: string, feedback: string, page: string) {
    try {
      const res = await api.post('/analytics/feedback', { rating, feedback, page });
      return res.data;
    } catch (err) {
      console.error('Failed to submit feedback', err);
      throw err;
    }
  },

  async getDashboardMetrics() {
    try {
      const res = await api.get('/analytics/dashboard');
      return res.data?.data;
    } catch (err) {
      console.error('Failed to fetch dashboard metrics', err);
      throw err;
    }
  }
};
