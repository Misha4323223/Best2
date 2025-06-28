
/**
 * Аналитика поисковых запросов
 * Отслеживает популярные запросы и эффективность поиска
 */

class SearchAnalytics {
  constructor() {
    this.queries = new Map();
    this.performance = [];
  }

  /**
   * Записывает выполненный поисковый запрос
   */
  recordQuery(query, results, responseTime, source) {
    const key = query.toLowerCase().trim();
    const existing = this.queries.get(key) || {
      query: key,
      count: 0,
      lastUsed: null,
      avgResponseTime: 0,
      successRate: 0,
      sources: new Set()
    };

    existing.count++;
    existing.lastUsed = new Date();
    existing.avgResponseTime = (existing.avgResponseTime + responseTime) / existing.count;
    existing.successRate = ((existing.successRate * (existing.count - 1)) + (results > 0 ? 1 : 0)) / existing.count;
    existing.sources.add(source);

    this.queries.set(key, existing);

    // Записываем общую производительность
    this.performance.push({
      timestamp: new Date(),
      query,
      resultCount: results,
      responseTime,
      source
    });

    // Ограничиваем размер массива производительности
    if (this.performance.length > 1000) {
      this.performance = this.performance.slice(-500);
    }
  }

  /**
   * Получает топ популярных запросов
   */
  getTopQueries(limit = 10) {
    return Array.from(this.queries.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Получает статистику производительности
   */
  getPerformanceStats() {
    if (this.performance.length === 0) return null;

    const responseTimes = this.performance.map(p => p.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const successfulQueries = this.performance.filter(p => p.resultCount > 0).length;
    const successRate = successfulQueries / this.performance.length;

    return {
      totalQueries: this.performance.length,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100),
      topSources: this.getTopSources()
    };
  }

  /**
   * Получает топ источников
   */
  getTopSources() {
    const sources = {};
    this.performance.forEach(p => {
      sources[p.source] = (sources[p.source] || 0) + 1;
    });

    return Object.entries(sources)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([source, count]) => ({ source, count }));
  }

  /**
   * Получает рекомендации по улучшению
   */
  getRecommendations() {
    const stats = this.getPerformanceStats();
    if (!stats) return [];

    const recommendations = [];

    if (stats.avgResponseTime > 5000) {
      recommendations.push('Среднее время ответа превышает 5 секунд. Рекомендуется оптимизация кэширования.');
    }

    if (stats.successRate < 80) {
      recommendations.push('Успешность поиска менее 80%. Рекомендуется добавить дополнительные источники.');
    }

    return recommendations;
  }
}

// Глобальный экземпляр аналитики
const searchAnalytics = new SearchAnalytics();

export { SearchAnalytics, searchAnalytics };
