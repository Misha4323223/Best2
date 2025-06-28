/**
 * Движок персонализации для учета предыдущих запросов пользователя
 * Анализирует паттерны поведения и предпочтения для улучшения ответов
 */

const chatMemory = require('./chat-memory');

/**
 * Анализ пользовательских предпочтений на основе истории
 */
async function analyzeUserPreferences(sessionId, recentQueries = []) {
  try {
    console.log('👤 [PERSONALIZATION] Анализ предпочтений пользователя');
    
    const preferences = {
      sessionId,
      timestamp: new Date().toISOString(),
      
      // Языковые предпочтения
      languagePreference: 'ru',
      communicationStyle: 'detailed',
      
      // Тематические интересы
      topicInterests: {},
      domainExpertise: {},
      
      // Поведенческие паттерны
      queryPatterns: {},
      responsePreferences: {},
      
      // Временные предпочтения
      timePatterns: {},
      
      // Контекстуальные предпочтения
      contextPreferences: {},
      
      // Общий профиль
      userProfile: 'general',
      confidenceScore: 0
    };
    
    // Загружаем историю сессии
    const sessionHistory = await chatMemory.getSessionContext(sessionId, 50);
    const allQueries = [...recentQueries, ...extractQueriesFromHistory(sessionHistory)];
    
    if (allQueries.length === 0) {
      return createDefaultPreferences(sessionId);
    }
    
    // Анализируем различные аспекты предпочтений
    preferences.languagePreference = analyzeLanguagePreference(allQueries);
    preferences.topicInterests = analyzeTopicInterests(allQueries);
    preferences.queryPatterns = analyzeQueryPatterns(allQueries);
    preferences.communicationStyle = analyzeCommunicationStyle(allQueries);
    preferences.domainExpertise = analyzeDomainExpertise(allQueries);
    preferences.timePatterns = analyzeTimePatterns(allQueries);
    preferences.contextPreferences = analyzeContextPreferences(allQueries);
    preferences.userProfile = determineUserProfile(preferences);
    preferences.confidenceScore = calculateConfidenceScore(preferences, allQueries.length);
    
    console.log('👤 [PERSONALIZATION] Анализ завершен:', {
      profile: preferences.userProfile,
      topTopics: Object.keys(preferences.topicInterests).slice(0, 3),
      confidence: preferences.confidenceScore
    });
    
    return preferences;
    
  } catch (error) {
    console.error('❌ [PERSONALIZATION] Ошибка анализа предпочтений:', error);
    return createDefaultPreferences(sessionId);
  }
}

/**
 * Извлечение запросов из истории сессии
 */
function extractQueriesFromHistory(sessionHistory) {
  const queries = [];
  
  if (sessionHistory && sessionHistory.context) {
    // Предполагаем, что контекст содержит историю сообщений
    const messages = sessionHistory.context.split('\n').filter(line => 
      line.startsWith('Пользователь:') || line.startsWith('User:')
    );
    
    messages.forEach(message => {
      const query = message.replace(/^(Пользователь:|User:)\s*/, '').trim();
      if (query.length > 0) {
        queries.push({
          text: query,
          timestamp: new Date(), // Упрощенная версия
          length: query.length
        });
      }
    });
  }
  
  return queries;
}

/**
 * Анализ языковых предпочтений
 */
function analyzeLanguagePreference(queries) {
  const languageStats = { ru: 0, en: 0, mixed: 0 };
  
  queries.forEach(query => {
    const text = query.text || query;
    const cyrillicCount = (text.match(/[а-яё]/gi) || []).length;
    const latinCount = (text.match(/[a-z]/gi) || []).length;
    const totalLetters = cyrillicCount + latinCount;
    
    if (totalLetters > 0) {
      const cyrillicRatio = cyrillicCount / totalLetters;
      if (cyrillicRatio > 0.7) {
        languageStats.ru++;
      } else if (cyrillicRatio < 0.3) {
        languageStats.en++;
      } else {
        languageStats.mixed++;
      }
    }
  });
  
  const dominant = Object.entries(languageStats).reduce((max, [lang, count]) => 
    count > max.count ? { lang, count } : max, { lang: 'ru', count: 0 }).lang;
  
  return dominant;
}

/**
 * Анализ тематических интересов
 */
function analyzeTopicInterests(queries) {
  const topics = {
    technology: { weight: 0, keywords: ['код', 'программирование', 'api', 'сервер', 'приложение', 'софт', 'tech', 'programming', 'software'] },
    science: { weight: 0, keywords: ['наука', 'исследование', 'эксперимент', 'научный', 'science', 'research', 'study'] },
    business: { weight: 0, keywords: ['бизнес', 'компания', 'рынок', 'продажи', 'бюджет', 'business', 'company', 'market'] },
    education: { weight: 0, keywords: ['учеба', 'обучение', 'курс', 'урок', 'экзамен', 'education', 'learning', 'course'] },
    entertainment: { weight: 0, keywords: ['фильм', 'игра', 'музыка', 'развлечение', 'movie', 'game', 'music', 'entertainment'] },
    health: { weight: 0, keywords: ['здоровье', 'медицина', 'лечение', 'врач', 'health', 'medicine', 'doctor'] },
    travel: { weight: 0, keywords: ['путешествие', 'поездка', 'отпуск', 'страна', 'город', 'travel', 'trip', 'country'] },
    food: { weight: 0, keywords: ['еда', 'рецепт', 'кухня', 'ресторан', 'готовить', 'food', 'recipe', 'cooking'] },
    news: { weight: 0, keywords: ['новости', 'событие', 'политика', 'экономика', 'news', 'politics', 'economy'] },
    personal: { weight: 0, keywords: ['личный', 'семья', 'отношения', 'друзья', 'personal', 'family', 'relationships'] }
  };
  
  queries.forEach(query => {
    const text = (query.text || query).toLowerCase();
    
    Object.entries(topics).forEach(([topic, data]) => {
      const matches = data.keywords.filter(keyword => text.includes(keyword)).length;
      topics[topic].weight += matches;
    });
  });
  
  // Нормализуем веса и возвращаем только значимые интересы
  const totalQueries = queries.length;
  const significantTopics = {};
  
  Object.entries(topics).forEach(([topic, data]) => {
    const normalizedWeight = data.weight / totalQueries;
    if (normalizedWeight > 0.1) { // Минимальный порог 10%
      significantTopics[topic] = normalizedWeight;
    }
  });
  
  return significantTopics;
}

/**
 * Анализ паттернов запросов
 */
function analyzeQueryPatterns(queries) {
  const patterns = {
    avgLength: 0,
    questionRatio: 0,
    commandRatio: 0,
    complexityLevel: 'simple',
    preferredQuestionTypes: {},
    temporalPreference: 'any'
  };
  
  let totalLength = 0;
  let questionCount = 0;
  let commandCount = 0;
  
  const questionTypes = {
    what: ['что', 'what'],
    how: ['как', 'how'],
    why: ['почему', 'why'],
    when: ['когда', 'when'],
    where: ['где', 'where'],
    who: ['кто', 'who']
  };
  
  queries.forEach(query => {
    const text = (query.text || query).toLowerCase();
    totalLength += text.length;
    
    if (text.includes('?') || text.includes('что') || text.includes('как') || text.includes('what') || text.includes('how')) {
      questionCount++;
    }
    
    if (text.includes('создай') || text.includes('сделай') || text.includes('найди') || text.includes('create') || text.includes('make')) {
      commandCount++;
    }
    
    // Анализируем типы вопросов
    Object.entries(questionTypes).forEach(([type, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        patterns.preferredQuestionTypes[type] = (patterns.preferredQuestionTypes[type] || 0) + 1;
      }
    });
  });
  
  patterns.avgLength = queries.length > 0 ? totalLength / queries.length : 0;
  patterns.questionRatio = queries.length > 0 ? questionCount / queries.length : 0;
  patterns.commandRatio = queries.length > 0 ? commandCount / queries.length : 0;
  
  // Определяем уровень сложности на основе длины запросов
  if (patterns.avgLength > 100) {
    patterns.complexityLevel = 'complex';
  } else if (patterns.avgLength > 50) {
    patterns.complexityLevel = 'medium';
  } else {
    patterns.complexityLevel = 'simple';
  }
  
  return patterns;
}

/**
 * Анализ стиля коммуникации
 */
function analyzeCommunicationStyle(queries) {
  const formalIndicators = ['пожалуйста', 'благодарю', 'could you', 'please', 'thank you'];
  const informalIndicators = ['привет', 'пока', 'спасибо', 'hi', 'bye', 'thanks'];
  const detailIndicators = ['подробно', 'детально', 'объясни', 'explain', 'detailed', 'in detail'];
  const briefIndicators = ['кратко', 'быстро', 'коротко', 'briefly', 'quick', 'short'];
  
  let formalCount = 0;
  let informalCount = 0;
  let detailCount = 0;
  let briefCount = 0;
  
  queries.forEach(query => {
    const text = (query.text || query).toLowerCase();
    
    if (formalIndicators.some(indicator => text.includes(indicator))) formalCount++;
    if (informalIndicators.some(indicator => text.includes(indicator))) informalCount++;
    if (detailIndicators.some(indicator => text.includes(indicator))) detailCount++;
    if (briefIndicators.some(indicator => text.includes(indicator))) briefCount++;
  });
  
  const formality = formalCount > informalCount ? 'formal' : 'informal';
  const detail = detailCount > briefCount ? 'detailed' : 'brief';
  
  return `${formality}_${detail}`;
}

/**
 * Анализ экспертизы в различных областях
 */
function analyzeDomainExpertise(queries) {
  const domains = {
    programming: { level: 0, indicators: ['функция', 'переменная', 'массив', 'api', 'backend', 'function', 'variable', 'array'] },
    design: { level: 0, indicators: ['дизайн', 'цвет', 'шрифт', 'композиция', 'design', 'color', 'font'] },
    business: { level: 0, indicators: ['стратегия', 'roi', 'конверсия', 'маркетинг', 'strategy', 'marketing'] },
    science: { level: 0, indicators: ['гипотеза', 'эксперимент', 'данные', 'hypothesis', 'experiment', 'data'] }
  };
  
  queries.forEach(query => {
    const text = (query.text || query).toLowerCase();
    
    Object.entries(domains).forEach(([domain, data]) => {
      const expertTerms = data.indicators.filter(term => text.includes(term)).length;
      if (expertTerms > 0) {
        domains[domain].level += expertTerms;
      }
    });
  });
  
  // Нормализуем и возвращаем домены с экспертизой
  const expertise = {};
  Object.entries(domains).forEach(([domain, data]) => {
    const level = data.level / queries.length;
    if (level > 0.2) {
      expertise[domain] = level > 0.8 ? 'expert' : level > 0.4 ? 'intermediate' : 'beginner';
    }
  });
  
  return expertise;
}

/**
 * Анализ временных паттернов использования
 */
function analyzeTimePatterns(queries) {
  // Упрощенный анализ - в реальной версии можно анализировать время запросов
  return {
    preferredTimeframe: 'recent', // Предпочитаемый временной фрейм для информации
    sessionLength: 'medium',       // Предпочитаемая длина сессии
    updateFrequency: 'normal'      // Как часто пользователь хочет обновления
  };
}

/**
 * Анализ контекстуальных предпочтений
 */
function analyzeContextPreferences(queries) {
  const preferences = {
    needsExamples: false,
    prefersStepByStep: false,
    likesComparisons: false,
    wantsSourceLinks: false
  };
  
  queries.forEach(query => {
    const text = (query.text || query).toLowerCase();
    
    if (text.includes('пример') || text.includes('example')) {
      preferences.needsExamples = true;
    }
    if (text.includes('пошагово') || text.includes('step by step')) {
      preferences.prefersStepByStep = true;
    }
    if (text.includes('сравни') || text.includes('compare')) {
      preferences.likesComparisons = true;
    }
    if (text.includes('источник') || text.includes('ссылк') || text.includes('source') || text.includes('link')) {
      preferences.wantsSourceLinks = true;
    }
  });
  
  return preferences;
}

/**
 * Определение общего профиля пользователя
 */
function determineUserProfile(preferences) {
  const techScore = (preferences.topicInterests.technology || 0) + 
                   (preferences.domainExpertise.programming ? 0.5 : 0);
  
  const businessScore = (preferences.topicInterests.business || 0) + 
                       (preferences.domainExpertise.business ? 0.5 : 0);
  
  const scienceScore = (preferences.topicInterests.science || 0) + 
                      (preferences.domainExpertise.science ? 0.5 : 0);
  
  if (techScore > 0.4) return 'tech_specialist';
  if (businessScore > 0.4) return 'business_professional';
  if (scienceScore > 0.4) return 'researcher';
  if (preferences.queryPatterns.complexityLevel === 'complex') return 'power_user';
  if (preferences.queryPatterns.complexityLevel === 'simple') return 'casual_user';
  
  return 'general_user';
}

/**
 * Расчет уверенности в анализе предпочтений
 */
function calculateConfidenceScore(preferences, queryCount) {
  let score = 0;
  
  // Базовый скор зависит от количества данных
  if (queryCount >= 20) score += 0.4;
  else if (queryCount >= 10) score += 0.3;
  else if (queryCount >= 5) score += 0.2;
  else score += 0.1;
  
  // Дополнительные факторы
  if (Object.keys(preferences.topicInterests).length > 0) score += 0.2;
  if (Object.keys(preferences.domainExpertise).length > 0) score += 0.2;
  if (preferences.queryPatterns.avgLength > 0) score += 0.1;
  if (preferences.userProfile !== 'general_user') score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Персонализация ответа на основе предпочтений
 */
function personalizeResponse(baseResponse, userPreferences, queryContext = {}) {
  try {
    console.log('👤 [PERSONALIZATION] Персонализация ответа');
    
    let personalizedResponse = baseResponse;
    
    // Адаптация стиля коммуникации
    if (userPreferences.communicationStyle) {
      personalizedResponse = adaptCommunicationStyle(personalizedResponse, userPreferences.communicationStyle);
    }
    
    // Добавление контекстуальных элементов
    if (userPreferences.contextPreferences) {
      personalizedResponse = addContextualElements(personalizedResponse, userPreferences.contextPreferences);
    }
    
    // Адаптация под экспертизу пользователя
    if (userPreferences.domainExpertise && Object.keys(userPreferences.domainExpertise).length > 0) {
      personalizedResponse = adaptToExpertise(personalizedResponse, userPreferences.domainExpertise, queryContext);
    }
    
    // Добавление персонализированных рекомендаций
    const recommendations = generatePersonalizedRecommendations(userPreferences, queryContext);
    if (recommendations.length > 0) {
      personalizedResponse += '\n\n' + recommendations.join('\n');
    }
    
    return personalizedResponse;
    
  } catch (error) {
    console.error('❌ [PERSONALIZATION] Ошибка персонализации:', error);
    return baseResponse;
  }
}

/**
 * Адаптация стиля коммуникации
 */
function adaptCommunicationStyle(response, style) {
  if (style.includes('formal')) {
    // Более формальный тон
    response = response.replace(/\bты\b/g, 'Вы');
    response = response.replace(/привет/gi, 'Здравствуйте');
  }
  
  if (style.includes('brief')) {
    // Более краткие ответы - удаляем лишние детали
    const sentences = response.split(/[.!?]+/);
    const briefSentences = sentences.filter((sentence, index) => 
      index < 3 || sentence.trim().length < 50
    );
    response = briefSentences.join('. ').trim();
  }
  
  return response;
}

/**
 * Добавление контекстуальных элементов
 */
function addContextualElements(response, contextPreferences) {
  let enhanced = response;
  
  if (contextPreferences.needsExamples && !response.includes('Пример:')) {
    enhanced += '\n\n💡 **Совет:** Если нужны конкретные примеры, дайте знать!';
  }
  
  if (contextPreferences.prefersStepByStep && !response.includes('Шаг')) {
    enhanced += '\n\n📋 **Примечание:** Могу предоставить пошаговую инструкцию по запросу.';
  }
  
  if (contextPreferences.wantsSourceLinks && !response.includes('http')) {
    enhanced += '\n\n🔗 **Источники:** При необходимости могу предоставить ссылки на дополнительную информацию.';
  }
  
  return enhanced;
}

/**
 * Адаптация под экспертизу пользователя
 */
function adaptToExpertise(response, domainExpertise, queryContext) {
  let adapted = response;
  
  // Определяем релевантную экспертизу для текущего запроса
  const queryTopic = queryContext.primaryTopic || 'general';
  const userExpertise = domainExpertise[queryTopic] || 'beginner';
  
  if (userExpertise === 'expert') {
    // Добавляем более технические детали
    adapted += '\n\n🔬 **Для экспертов:** Если нужны более глубокие технические детали, уточните специфические аспекты.';
  } else if (userExpertise === 'beginner') {
    // Добавляем объяснения базовых терминов
    adapted += '\n\n📚 **Пояснение:** Готов объяснить любые термины или концепции подробнее.';
  }
  
  return adapted;
}

/**
 * Генерация персонализированных рекомендаций
 */
function generatePersonalizedRecommendations(userPreferences, queryContext) {
  const recommendations = [];
  
  // На основе интересов пользователя
  const topInterests = Object.entries(userPreferences.topicInterests || {})
    .sort(([,a], [,b]) => b - a)
    .slice(0, 2);
  
  if (topInterests.length > 0 && queryContext.relatedTopics) {
    recommendations.push(`🎯 **Вам также может быть интересно:** ${queryContext.relatedTopics.join(', ')}`);
  }
  
  // На основе паттернов использования
  if (userPreferences.queryPatterns && userPreferences.queryPatterns.preferredQuestionTypes) {
    const preferredType = Object.entries(userPreferences.queryPatterns.preferredQuestionTypes)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (preferredType && preferredType[0] === 'how') {
      recommendations.push('🛠️ **Практические советы:** Могу предложить практические примеры применения.');
    }
  }
  
  return recommendations;
}

/**
 * Создание дефолтных предпочтений
 */
function createDefaultPreferences(sessionId) {
  return {
    sessionId,
    timestamp: new Date().toISOString(),
    languagePreference: 'ru',
    communicationStyle: 'detailed',
    topicInterests: {},
    domainExpertise: {},
    queryPatterns: {
      avgLength: 50,
      questionRatio: 0.7,
      commandRatio: 0.3,
      complexityLevel: 'medium'
    },
    contextPreferences: {
      needsExamples: false,
      prefersStepByStep: false,
      likesComparisons: false,
      wantsSourceLinks: false
    },
    userProfile: 'general_user',
    confidenceScore: 0.1
  };
}

module.exports = {
  analyzeUserPreferences,
  personalizeResponse
};