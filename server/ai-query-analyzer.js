/**
 * Продвинутый анализатор запросов с контекстным пониманием намерений пользователя
 * Анализирует семантику, контекст и намерения для улучшения качества ответов
 */

const chatMemory = require('./chat-memory');

/**
 * Главная функция анализа запроса с контекстным пониманием
 */
async function analyzeQueryWithContext(query, sessionId = null, previousQueries = []) {
  try {
    console.log('🧠 [QUERY_ANALYZER] Начинаем контекстный анализ запроса');
    
    const analysis = {
      originalQuery: query,
      timestamp: new Date().toISOString(),
      
      // Базовый анализ
      basicAnalysis: performBasicAnalysis(query),
      
      // Анализ намерений
      intentAnalysis: analyzeUserIntent(query),
      
      // Контекстный анализ
      contextAnalysis: await analyzeContext(query, sessionId, previousQueries),
      
      // Временной анализ
      temporalAnalysis: analyzeTemporalAspects(query),
      
      // Языковой анализ
      languageAnalysis: analyzeLanguage(query),
      
      // Сложность запроса
      complexityScore: calculateComplexityScore(query),
      
      // Рекомендации для обработки
      processingRecommendations: generateProcessingRecommendations(query)
    };
    
    // Обогащаем анализ контекстом сессии
    if (sessionId) {
      analysis.sessionContext = await enrichWithSessionContext(analysis, sessionId);
    }
    
    console.log('🧠 [QUERY_ANALYZER] Анализ завершен:', {
      intent: analysis.intentAnalysis.primaryIntent,
      complexity: analysis.complexityScore,
      language: analysis.languageAnalysis.primaryLanguage,
      temporal: analysis.temporalAnalysis.isTimeDependent
    });
    
    return analysis;
    
  } catch (error) {
    console.error('❌ [QUERY_ANALYZER] Ошибка анализа:', error);
    return createFallbackAnalysis(query);
  }
}

/**
 * Базовый анализ запроса
 */
function performBasicAnalysis(query) {
  const words = query.toLowerCase().split(/\s+/);
  const chars = query.length;
  
  return {
    wordCount: words.length,
    charCount: chars,
    hasQuestionMarks: query.includes('?'),
    hasExclamation: query.includes('!'),
    containsNumbers: /\d/.test(query),
    containsUrls: /https?:\/\//.test(query),
    containsEmails: /@/.test(query),
    keyWords: extractKeyWords(words),
    entities: extractNamedEntities(query)
  };
}

/**
 * Анализ намерений пользователя
 */
function analyzeUserIntent(query) {
  const queryLower = query.toLowerCase();
  
  const intentPatterns = {
    // Информационные запросы
    information: {
      keywords: ['что', 'как', 'почему', 'где', 'когда', 'кто', 'какой', 'сколько', 
                'explain', 'what', 'how', 'why', 'where', 'when', 'who', 'which'],
      weight: 0
    },
    
    // Создание контента
    creation: {
      keywords: ['создай', 'сделай', 'нарисуй', 'сгенерируй', 'придумай', 'напиши',
                'create', 'make', 'generate', 'draw', 'write', 'design'],
      weight: 0
    },
    
    // Поиск и исследование
    search: {
      keywords: ['найди', 'поищи', 'покажи', 'найти', 'информация', 'данные',
                'find', 'search', 'look', 'show', 'information', 'data'],
      weight: 0
    },
    
    // Анализ и сравнение
    analysis: {
      keywords: ['сравни', 'проанализируй', 'оцени', 'объясни разницу', 'плюсы', 'минусы',
                'compare', 'analyze', 'evaluate', 'pros', 'cons', 'difference'],
      weight: 0
    },
    
    // Решение проблем
    problemSolving: {
      keywords: ['помоги', 'как решить', 'проблема', 'ошибка', 'не работает', 'исправить',
                'help', 'solve', 'problem', 'error', 'fix', 'troubleshoot'],
      weight: 0
    },
    
    // Обучение
    learning: {
      keywords: ['научи', 'объясни', 'расскажи', 'покажи как', 'урок', 'tutorial',
                'teach', 'explain', 'show how', 'lesson', 'guide'],
      weight: 0
    },
    
    // Развлечение
    entertainment: {
      keywords: ['развлеки', 'шутка', 'игра', 'веселье', 'интересно',
                'entertain', 'joke', 'game', 'fun', 'interesting'],
      weight: 0
    }
  };
  
  // Подсчитываем вес каждого намерения
  Object.keys(intentPatterns).forEach(intent => {
    intentPatterns[intent].weight = intentPatterns[intent].keywords.reduce((weight, keyword) => {
      if (queryLower.includes(keyword)) {
        return weight + 1;
      }
      return weight;
    }, 0);
  });
  
  // Определяем основное намерение
  const sortedIntents = Object.entries(intentPatterns)
    .sort(([,a], [,b]) => b.weight - a.weight)
    .map(([intent, data]) => ({ intent, weight: data.weight }));
  
  const primaryIntent = sortedIntents[0];
  const secondaryIntents = sortedIntents.slice(1, 3).filter(i => i.weight > 0);
  
  return {
    primaryIntent: primaryIntent.intent,
    confidence: Math.min(primaryIntent.weight / 3, 1), // Нормализуем от 0 до 1
    secondaryIntents: secondaryIntents.map(i => i.intent),
    allIntents: sortedIntents,
    isMultiIntent: sortedIntents.filter(i => i.weight > 0).length > 1
  };
}

/**
 * Контекстный анализ с учетом предыдущих запросов
 */
async function analyzeContext(query, sessionId, previousQueries) {
  const context = {
    isFollowUp: false,
    refersToPrevious: false,
    contextClues: [],
    sessionFlow: 'new',
    topicContinuity: false
  };
  
  // Анализируем ссылки на предыдущий контекст
  const contextKeywords = ['это', 'этот', 'такой', 'также', 'еще', 'дальше', 'продолжи',
                          'this', 'that', 'also', 'more', 'continue', 'further'];
  
  context.refersToPrevious = contextKeywords.some(keyword => 
    query.toLowerCase().includes(keyword));
  
  // Анализируем последовательность вопросов
  if (previousQueries.length > 0) {
    const lastQuery = previousQueries[previousQueries.length - 1];
    context.isFollowUp = analyzeIfFollowUp(query, lastQuery);
    context.topicContinuity = analyzeTopicContinuity(query, previousQueries);
  }
  
  // Определяем тип потока сессии
  if (previousQueries.length === 0) {
    context.sessionFlow = 'new';
  } else if (context.topicContinuity) {
    context.sessionFlow = 'continuing';
  } else {
    context.sessionFlow = 'topic_switch';
  }
  
  return context;
}

/**
 * Анализ временных аспектов запроса
 */
function analyzeTemporalAspects(query) {
  const temporal = {
    isTimeDependent: false,
    timeFrame: null,
    needsFreshData: false,
    temporalKeywords: []
  };
  
  const timeKeywords = {
    current: ['сейчас', 'сегодня', 'текущий', 'актуальный', 'последний', 'свежий',
             'now', 'today', 'current', 'latest', 'recent', 'fresh'],
    past: ['вчера', 'раньше', 'было', 'история', 'прошлый',
           'yesterday', 'before', 'was', 'history', 'past'],
    future: ['завтра', 'будет', 'планы', 'прогноз', 'будущее',
            'tomorrow', 'will', 'plans', 'forecast', 'future'],
    specific: ['2024', '2025', 'январь', 'декабрь', 'понедельник', 'выходные']
  };
  
  Object.entries(timeKeywords).forEach(([timeType, keywords]) => {
    keywords.forEach(keyword => {
      if (query.toLowerCase().includes(keyword)) {
        temporal.isTimeDependent = true;
        temporal.timeFrame = timeType;
        temporal.temporalKeywords.push(keyword);
        
        if (timeType === 'current') {
          temporal.needsFreshData = true;
        }
      }
    });
  });
  
  return temporal;
}

/**
 * Анализ языка запроса
 */
function analyzeLanguage(query) {
  const cyrillicCount = (query.match(/[а-яё]/gi) || []).length;
  const latinCount = (query.match(/[a-z]/gi) || []).length;
  const totalLetters = cyrillicCount + latinCount;
  
  let primaryLanguage = 'unknown';
  let confidence = 0;
  
  if (totalLetters > 0) {
    const cyrillicRatio = cyrillicCount / totalLetters;
    const latinRatio = latinCount / totalLetters;
    
    if (cyrillicRatio > 0.6) {
      primaryLanguage = 'russian';
      confidence = cyrillicRatio;
    } else if (latinRatio > 0.6) {
      primaryLanguage = 'english';
      confidence = latinRatio;
    } else {
      primaryLanguage = 'mixed';
      confidence = 0.5;
    }
  }
  
  return {
    primaryLanguage,
    confidence,
    isMixed: cyrillicCount > 0 && latinCount > 0,
    hasNumbers: /\d/.test(query),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(query)
  };
}

/**
 * Расчет сложности запроса
 */
function calculateComplexityScore(query) {
  let score = 0;
  
  // Длина запроса
  const words = query.split(/\s+/).length;
  if (words > 10) score += 2;
  else if (words > 5) score += 1;
  
  // Наличие сложных конструкций
  if (query.includes('?') && query.includes('и')) score += 1; // Множественные вопросы
  if (query.match(/\b(если|when|if)\b/i)) score += 1; // Условные конструкции
  if (query.match(/\b(потому что|because|поскольку)\b/i)) score += 1; // Причинно-следственные связи
  
  // Технические термины
  const techTerms = ['API', 'база данных', 'алгоритм', 'функция', 'переменная'];
  if (techTerms.some(term => query.toLowerCase().includes(term.toLowerCase()))) {
    score += 2;
  }
  
  // Множественные намерения
  const intentWords = ['и', 'также', 'еще', 'дополнительно', 'and', 'also'];
  if (intentWords.some(word => query.toLowerCase().includes(word))) {
    score += 1;
  }
  
  return Math.min(score, 10); // Максимум 10 баллов
}

/**
 * Генерация рекомендаций для обработки
 */
function generateProcessingRecommendations(query) {
  const recommendations = {
    needsSearch: false,
    needsAI: true,
    preferredProviders: [],
    searchType: null,
    priority: 'normal',
    specialHandling: []
  };
  
  const queryLower = query.toLowerCase();
  
  // Определяем необходимость поиска
  const searchIndicators = ['актуальный', 'последний', 'новости', 'погода', 'курс', 'цена',
                           'current', 'latest', 'news', 'weather', 'price', 'rate'];
  recommendations.needsSearch = searchIndicators.some(indicator => 
    queryLower.includes(indicator));
  
  // Определяем тип поиска
  if (recommendations.needsSearch) {
    if (queryLower.includes('новости') || queryLower.includes('событи')) {
      recommendations.searchType = 'news';
    } else if (queryLower.includes('погода')) {
      recommendations.searchType = 'weather';
    } else if (queryLower.includes('место') || queryLower.includes('адрес')) {
      recommendations.searchType = 'places';
    } else {
      recommendations.searchType = 'comprehensive';
    }
  }
  
  // Рекомендуемые провайдеры
  if (queryLower.includes('код') || queryLower.includes('программирование')) {
    recommendations.preferredProviders = ['Phind', 'DeepSpeek', 'DeepInfra_CodeLlama'];
  } else if (queryLower.includes('творчество') || queryLower.includes('придумай')) {
    recommendations.preferredProviders = ['GeminiPro', 'Claude', 'Liaobots'];
  } else {
    recommendations.preferredProviders = ['Qwen_Qwen_2_72B', 'Claude', 'GeminiPro'];
  }
  
  // Приоритет обработки
  if (queryLower.includes('срочно') || queryLower.includes('urgent')) {
    recommendations.priority = 'high';
  } else if (queryLower.includes('не спешите') || queryLower.includes('детально')) {
    recommendations.priority = 'low';
  }
  
  return recommendations;
}

/**
 * Обогащение анализа контекстом сессии
 */
async function enrichWithSessionContext(analysis, sessionId) {
  try {
    const sessionData = await chatMemory.getSessionContext(sessionId, 10);
    
    return {
      messageCount: sessionData.messageCount,
      sessionDuration: sessionData.sessionDuration,
      dominantTopics: extractSessionTopics(sessionData.context),
      userPreferences: extractUserPreferences(sessionData.context),
      conversationFlow: analyzeConversationFlow(sessionData.context)
    };
  } catch (error) {
    console.error('❌ Ошибка обогащения контекстом:', error);
    return null;
  }
}

/**
 * Вспомогательные функции
 */

function extractKeyWords(words) {
  // Удаляем стоп-слова и возвращаем ключевые
  const stopWords = ['и', 'в', 'на', 'с', 'по', 'для', 'от', 'к', 'о', 'а', 'но',
                     'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'];
  
  return words
    .filter(word => !stopWords.includes(word.toLowerCase()) && word.length > 2)
    .slice(0, 10); // Максимум 10 ключевых слов
}

function extractNamedEntities(query) {
  const entities = {
    persons: [],
    places: [],
    organizations: [],
    dates: []
  };
  
  // Простое извлечение дат
  const dateMatches = query.match(/\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}/g);
  if (dateMatches) {
    entities.dates = dateMatches;
  }
  
  // Можно добавить более сложную обработку именованных сущностей
  
  return entities;
}

function analyzeIfFollowUp(currentQuery, previousQuery) {
  const followUpWords = ['да', 'нет', 'это', 'также', 'еще', 'продолжи', 'дальше'];
  return followUpWords.some(word => currentQuery.toLowerCase().includes(word)) &&
         currentQuery.length < previousQuery.length * 1.5;
}

function analyzeTopicContinuity(currentQuery, previousQueries) {
  if (previousQueries.length === 0) return false;
  
  const currentWords = new Set(currentQuery.toLowerCase().split(/\s+/));
  const previousWords = new Set();
  
  previousQueries.slice(-3).forEach(query => {
    query.toLowerCase().split(/\s+/).forEach(word => previousWords.add(word));
  });
  
  const intersection = new Set([...currentWords].filter(x => previousWords.has(x)));
  return intersection.size >= 2; // Есть пересечение в 2+ словах
}

function extractSessionTopics(context) {
  // Упрощенное извлечение тем из контекста сессии
  return ['general']; // Можно улучшить с помощью более сложной обработки
}

function extractUserPreferences(context) {
  return {
    preferredLanguage: 'russian',
    responseStyle: 'detailed'
  };
}

function analyzeConversationFlow(context) {
  return 'informational'; // Можно улучшить анализ потока разговора
}

function createFallbackAnalysis(query) {
  return {
    originalQuery: query,
    timestamp: new Date().toISOString(),
    basicAnalysis: { wordCount: query.split(/\s+/).length },
    intentAnalysis: { primaryIntent: 'information', confidence: 0.5 },
    contextAnalysis: { isFollowUp: false },
    temporalAnalysis: { isTimeDependent: false },
    languageAnalysis: { primaryLanguage: 'russian' },
    complexityScore: 3,
    processingRecommendations: { needsSearch: false, needsAI: true }
  };
}

module.exports = {
  analyzeQueryWithContext
};