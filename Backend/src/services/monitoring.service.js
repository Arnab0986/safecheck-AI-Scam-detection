// backend/src/services/monitoring.service.js
const axios = require('axios');

class MonitoringService {
  async getPaymentMetrics() {
    try {
      const response = await axios.get(
        'https://api.cashfree.com/reporting/api/v1/merchant/transactions',
        {
          params: {
            start_date: '2024-01-01',
            end_date: '2024-01-31',
            settlement_status: 'all'
          },
          headers: this.headers
        }
      );
      
      return this.analyzeMetrics(response.data);
      
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return null;
    }
  }
  
  analyzeMetrics(data) {
    return {
      totalTransactions: data.length,
      successful: data.filter(t => t.status === 'SUCCESS').length,
      failed: data.filter(t => t.status === 'FAILED').length,
      totalAmount: data.reduce((sum, t) => sum + t.amount, 0),
      averageTransaction: this.calculateAverage(data),
      popularMethods: this.getPopularMethods(data)
    };
  }
}