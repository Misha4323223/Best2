
/**
 * API маршруты для мониторинга поисковой системы
 */

import express from 'express';
const router = express.Router();
import { searchCache } from './search-cache.js';
import { searchAnalytics } from './search-analytics.js';

/**
 * Получить статистику кэша
 */
router.get('/cache/stats', (req, res) => {
  try {
    const stats = searchCache.getStats();
    res.json({
      success: true,
      cache: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Очистить кэш
 */
router.post('/cache/clear', (req, res) => {
  try {
    searchCache.cache.clear();
    res.json({
      success: true,
      message: 'Кэш очищен'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Получить аналитику поиска
 */
router.get('/analytics', (req, res) => {
  try {
    const topQueries = searchAnalytics.getTopQueries(20);
    const performance = searchAnalytics.getPerformanceStats();
    const recommendations = searchAnalytics.getRecommendations();

    res.json({
      success: true,
      analytics: {
        topQueries,
        performance,
        recommendations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Получить популярные запросы
 */
router.get('/popular-queries', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const queries = searchAnalytics.getTopQueries(limit);
    
    res.json({
      success: true,
      queries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Тестовый поиск для проверки производительности
 */
router.post('/test', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: 'Требуется параметр query'
    });
  }

  try {
    const startTime = Date.now();
    const { performWebSearch } = await import('./web-search-provider.js');
    const results = await performWebSearch(query);
    const responseTime = Date.now() - startTime;

    // Записываем в аналитику
    searchAnalytics.recordQuery(
      query, 
      results.results?.length || 0, 
      responseTime, 
      'test-api'
    );

    res.json({
      success: true,
      query,
      results: results.results?.length || 0,
      responseTime,
      cached: results.cached || false
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
