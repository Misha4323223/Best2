
/**
 * Система кэширования для поисковых запросов
 * Уменьшает нагрузку на API и ускоряет повторные запросы
 */

class SearchCache {
  constructor(maxAge = 30 * 60 * 1000) { // 30 минут по умолчанию
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  /**
   * Генерирует ключ кэша для запроса
   */
  generateKey(query, searchType = 'general') {
    return `${searchType}:${query.toLowerCase().trim()}`;
  }

  /**
   * Получает результат из кэша
   */
  get(query, searchType) {
    const key = this.generateKey(query, searchType);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // Проверяем актуальность
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`🎯 [CACHE] Найден кэшированный результат для: ${query}`);
    return cached.data;
  }

  /**
   * Сохраняет результат в кэш
   */
  set(query, searchType, data) {
    const key = this.generateKey(query, searchType);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    console.log(`💾 [CACHE] Сохранен результат для: ${query}`);
    
    // Очищаем старые записи
    this.cleanup();
  }

  /**
   * Очищает устаревшие записи
   */
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Получает статистику кэша
   */
  getStats() {
    return {
      size: this.cache.size,
      maxAge: this.maxAge,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Глобальный экземпляр кэша
const searchCache = new SearchCache();

module.exports = { SearchCache, searchCache };
