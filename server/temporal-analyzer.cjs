/**
 * Временной анализатор для приоритизации свежих данных и новостей
 * Определяет актуальность информации и приоритеты поиска
 */

/**
 * Анализ временных требований запроса
 */
function analyzeTemporalRequirements(query, queryAnalysis) {
  try {
    console.log('⏰ [TEMPORAL] Анализ временных требований');
    
    const temporal = {
      timeFrame: 'any',
      freshnessPriority: 'normal',
      temporalKeywords: [],
      isBreakingNews: false,
      needsRealTime: false,
      dateRange: null,
      priorityScore: 0,
      searchStrategy: 'standard'
    };
    
    const queryLower = query.toLowerCase();
    
    // Анализ временных индикаторов
    temporal.temporalKeywords = extractTemporalKeywords(queryLower);
    temporal.timeFrame = determineTimeFrame(queryLower, temporal.temporalKeywords);
    temporal.freshnessPriority = calculateFreshnessPriority(queryLower, temporal.temporalKeywords);
    temporal.isBreakingNews = detectBreakingNewsRequest(queryLower);
    temporal.needsRealTime = detectRealTimeRequirement(queryLower);
    temporal.dateRange = extractDateRange(queryLower);
    temporal.priorityScore = calculateTemporalPriority(temporal);
    temporal.searchStrategy = determineSearchStrategy(temporal);
    
    console.log('⏰ [TEMPORAL] Анализ завершен:', {
      timeFrame: temporal.timeFrame,
      freshnessPriority: temporal.freshnessPriority,
      needsRealTime: temporal.needsRealTime,
      priorityScore: temporal.priorityScore
    });
    
    return temporal;
    
  } catch (error) {
    console.error('❌ [TEMPORAL] Ошибка анализа:', error);
    return createDefaultTemporalAnalysis();
  }
}

/**
 * Извлечение временных ключевых слов
 */
function extractTemporalKeywords(queryLower) {
  const temporalPatterns = {
    immediate: ['сейчас', 'сегодня', 'прямо сейчас', 'в данный момент', 'актуальный',
               'now', 'today', 'right now', 'current', 'latest', 'live'],
    recent: ['недавно', 'последний', 'свежий', 'новый', 'только что', 'вчера',
            'recently', 'latest', 'fresh', 'new', 'just', 'yesterday', 'recent'],
    breaking: ['срочно', 'экстренно', 'только что', 'breaking', 'urgent', 'emergency'],
    specific: ['вчера', 'позавчера', 'на прошлой неделе', 'в прошлом месяце',
              'yesterday', 'last week', 'last month', 'ago'],
    future: ['завтра', 'на следующей неделе', 'в будущем', 'планы', 'прогноз',
            'tomorrow', 'next week', 'future', 'forecast', 'prediction'],
    realtime: ['онлайн', 'в реальном времени', 'live', 'real-time', 'streaming']
  };
  
  const foundKeywords = [];
  
  Object.entries(temporalPatterns).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (queryLower.includes(keyword)) {
        foundKeywords.push({ keyword, category });
      }
    });
  });
  
  return foundKeywords;
}

/**
 * Определение временного фрейма
 */
function determineTimeFrame(queryLower, temporalKeywords) {
  const categoryPriority = {
    immediate: 'immediate',
    breaking: 'immediate',
    realtime: 'immediate',
    recent: 'recent',
    specific: 'specific',
    future: 'future'
  };
  
  // Проверяем категории в порядке приоритета
  for (const keyword of temporalKeywords) {
    if (categoryPriority[keyword.category]) {
      return categoryPriority[keyword.category];
    }
  }
  
  // Дополнительная проверка на основе контекста
  if (queryLower.includes('новост') || queryLower.includes('событи') || queryLower.includes('news')) {
    return 'recent';
  }
  
  if (queryLower.includes('погода') || queryLower.includes('weather')) {
    return 'immediate';
  }
  
  if (queryLower.includes('курс') || queryLower.includes('цена') || queryLower.includes('price')) {
    return 'immediate';
  }
  
  return 'any';
}

/**
 * Расчет приоритета свежести данных
 */
function calculateFreshnessPriority(queryLower, temporalKeywords) {
  let priority = 'normal';
  
  // Высокий приоритет для срочных запросов
  const urgentPatterns = ['срочно', 'экстренно', 'breaking', 'urgent', 'emergency'];
  if (urgentPatterns.some(pattern => queryLower.includes(pattern))) {
    priority = 'critical';
  }
  
  // Высокий приоритет для запросов реального времени
  else if (temporalKeywords.some(k => k.category === 'immediate' || k.category === 'realtime')) {
    priority = 'high';
  }
  
  // Повышенный приоритет для недавних событий
  else if (temporalKeywords.some(k => k.category === 'recent')) {
    priority = 'elevated';
  }
  
  // Нормальный приоритет для исторических данных
  else if (temporalKeywords.some(k => k.category === 'specific')) {
    priority = 'normal';
  }
  
  return priority;
}

/**
 * Определение запроса на экстренные новости
 */
function detectBreakingNewsRequest(queryLower) {
  const breakingPatterns = [
    'breaking news', 'срочные новости', 'экстренные новости',
    'что происходит', 'последние события', 'urgent news',
    'latest breaking', 'emergency news'
  ];
  
  return breakingPatterns.some(pattern => queryLower.includes(pattern));
}

/**
 * Определение требования данных реального времени
 */
function detectRealTimeRequirement(queryLower) {
  const realTimePatterns = [
    'в реальном времени', 'real-time', 'live data', 'онлайн данные',
    'актуальный курс', 'текущая цена', 'сейчас происходит',
    'live stream', 'current status', 'right now'
  ];
  
  return realTimePatterns.some(pattern => queryLower.includes(pattern));
}

/**
 * Извлечение диапазона дат из запроса
 */
function extractDateRange(queryLower) {
  const datePatterns = {
    // Относительные даты
    today: ['сегодня', 'today'],
    yesterday: ['вчера', 'yesterday'],
    thisWeek: ['на этой неделе', 'this week', 'текущая неделя'],
    lastWeek: ['на прошлой неделе', 'last week', 'прошлая неделя'],
    thisMonth: ['в этом месяце', 'this month', 'текущий месяц'],
    lastMonth: ['в прошлом месяце', 'last month', 'прошлый месяц'],
    thisYear: ['в этом году', 'this year', 'текущий год'],
    lastYear: ['в прошлом году', 'last year', 'прошлый год']
  };
  
  for (const [period, patterns] of Object.entries(datePatterns)) {
    if (patterns.some(pattern => queryLower.includes(pattern))) {
      return {
        period,
        relative: true,
        specific: null
      };
    }
  }
  
  // Проверка конкретных дат
  const specificDateMatch = queryLower.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
  if (specificDateMatch) {
    return {
      period: 'specific',
      relative: false,
      specific: specificDateMatch[0]
    };
  }
  
  // Проверка годов
  const yearMatch = queryLower.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return {
      period: 'year',
      relative: false,
      specific: yearMatch[0]
    };
  }
  
  return null;
}

/**
 * Расчет общего временного приоритета
 */
function calculateTemporalPriority(temporal) {
  let score = 0;
  
  // Базовый счет по временному фрейму
  const frameScores = {
    immediate: 10,
    recent: 8,
    specific: 5,
    future: 3,
    any: 1
  };
  score += frameScores[temporal.timeFrame] || 0;
  
  // Дополнительные баллы за приоритет свежести
  const freshnessScores = {
    critical: 10,
    high: 8,
    elevated: 6,
    normal: 3
  };
  score += freshnessScores[temporal.freshnessPriority] || 0;
  
  // Бонусы за специальные требования
  if (temporal.isBreakingNews) score += 5;
  if (temporal.needsRealTime) score += 5;
  if (temporal.dateRange) score += 2;
  
  return Math.min(score, 30); // Максимум 30 баллов
}

/**
 * Определение стратегии поиска на основе временного анализа
 */
function determineSearchStrategy(temporal) {
  if (temporal.priorityScore >= 20) {
    return 'realtime_priority';
  } else if (temporal.priorityScore >= 15) {
    return 'fresh_data_priority';
  } else if (temporal.priorityScore >= 10) {
    return 'recent_focus';
  } else if (temporal.dateRange) {
    return 'date_filtered';
  } else {
    return 'standard';
  }
}

/**
 * Применение временного приоритета к результатам поиска
 */
function applyTemporalPriority(searchResults, temporalAnalysis) {
  try {
    console.log('⏰ [TEMPORAL] Применяем временные приоритеты к результатам');
    
    if (!searchResults || searchResults.length === 0) {
      return searchResults;
    }
    
    const prioritizedResults = searchResults.map(result => {
      const temporalScore = calculateResultTemporalScore(result, temporalAnalysis);
      
      return {
        ...result,
        temporalScore,
        originalRelevance: result.relevanceScore || 0,
        adjustedRelevance: combineRelevanceScores(
          result.relevanceScore || 0,
          temporalScore,
          temporalAnalysis.priorityScore
        )
      };
    });
    
    // Сортируем по скорректированной релевантности
    const sortedResults = prioritizedResults.sort((a, b) => 
      b.adjustedRelevance - a.adjustedRelevance
    );
    
    console.log(`⏰ [TEMPORAL] Результаты пересортированы с учетом временных факторов`);
    
    return sortedResults;
    
  } catch (error) {
    console.error('❌ [TEMPORAL] Ошибка применения приоритетов:', error);
    return searchResults;
  }
}

/**
 * Расчет временного скора для результата поиска
 */
function calculateResultTemporalScore(result, temporalAnalysis) {
  let score = 0;
  
  // Анализируем дату публикации если есть
  const publishDate = extractPublishDate(result);
  if (publishDate) {
    const ageScore = calculateAgeScore(publishDate, temporalAnalysis.timeFrame);
    score += ageScore;
  }
  
  // Анализируем временные индикаторы в заголовке и тексте
  const content = (result.title + ' ' + (result.snippet || '')).toLowerCase();
  const temporalIndicators = temporalAnalysis.temporalKeywords.map(k => k.keyword);
  
  temporalIndicators.forEach(keyword => {
    if (content.includes(keyword)) {
      score += 2;
    }
  });
  
  // Бонус за источники новостей для новостных запросов
  if (temporalAnalysis.timeFrame === 'immediate' || temporalAnalysis.isBreakingNews) {
    const newsSource = isNewsSource(result.source || result.url || '');
    if (newsSource) {
      score += 3;
    }
  }
  
  return Math.min(score, 10); // Максимум 10 баллов
}

/**
 * Извлечение даты публикации из результата
 */
function extractPublishDate(result) {
  const content = result.title + ' ' + (result.snippet || '') + ' ' + (result.publishDate || '');
  
  // Поиск различных форматов даты
  const datePatterns = [
    /(\d{1,2})[./](\d{1,2})[./](\d{2,4})/,  // DD.MM.YYYY
    /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/,    // YYYY-MM-DD
    /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      return new Date(match[0]);
    }
  }
  
  return null;
}

/**
 * Расчет скора на основе возраста контента
 */
function calculateAgeScore(publishDate, timeFrame) {
  const now = new Date();
  const ageInHours = (now - publishDate) / (1000 * 60 * 60);
  
  if (timeFrame === 'immediate') {
    if (ageInHours <= 1) return 8;
    if (ageInHours <= 6) return 6;
    if (ageInHours <= 24) return 4;
    return 1;
  }
  
  if (timeFrame === 'recent') {
    if (ageInHours <= 24) return 8;
    if (ageInHours <= 72) return 6;
    if (ageInHours <= 168) return 4; // 1 неделя
    return 2;
  }
  
  return 3; // Нейтральный скор для других временных фреймов
}

/**
 * Проверка на новостной источник
 */
function isNewsSource(url) {
  const newsKeywords = [
    'news', 'новости', 'lenta', 'rbc', 'tass', 'ria', 'interfax', 'gazeta',
    'kommersant', 'vedomosti', 'bbc', 'cnn', 'reuters', 'ap', 'bloomberg'
  ];
  
  return newsKeywords.some(keyword => url.toLowerCase().includes(keyword));
}

/**
 * Объединение скоров релевантности и временности
 */
function combineRelevanceScores(relevanceScore, temporalScore, temporalPriority) {
  // Весовые коэффициенты зависят от временного приоритета
  const temporalWeight = temporalPriority >= 15 ? 0.4 : 0.2;
  const relevanceWeight = 1 - temporalWeight;
  
  return (relevanceScore * relevanceWeight) + (temporalScore * temporalWeight);
}

/**
 * Создание дефолтного временного анализа
 */
function createDefaultTemporalAnalysis() {
  return {
    timeFrame: 'any',
    freshnessPriority: 'normal',
    temporalKeywords: [],
    isBreakingNews: false,
    needsRealTime: false,
    dateRange: null,
    priorityScore: 3,
    searchStrategy: 'standard'
  };
}

module.exports = {
  analyzeTemporalRequirements,
  applyTemporalPriority
};