/**
 * Интегрированный AI-анализатор с продвинутыми возможностями
 * Объединяет контекстный анализ, мультиязычность, временные приоритеты, факт-чекинг и персонализацию
 */

const aiQueryAnalyzer = require('./ai-query-analyzer.cjs');
const multilingualProcessor = require('./multilingual-processor.cjs');
const temporalAnalyzer = require('./temporal-analyzer.cjs');
const factChecker = require('./fact-checker.cjs');
const personalizationEngine = require('./personalization-engine.cjs');

/**
 * Главная функция enhanced AI-анализа
 */
async function performEnhancedAnalysis(query, sessionId = null, options = {}) {
  try {
    console.log('🧠 [ENHANCED_AI] Начинаем продвинутый AI-анализ');
    
    const startTime = Date.now();
    const analysis = {
      query,
      sessionId,
      timestamp: new Date().toISOString(),
      
      // Результаты различных типов анализа
      queryAnalysis: null,
      multilingualAnalysis: null,
      temporalAnalysis: null,
      personalizationData: null,
      factCheckResults: null,
      
      // Рекомендации для обработки
      processingStrategy: {},
      searchConfiguration: {},
      responseConfiguration: {},
      
      // Метрики
      analysisTime: 0,
      confidenceScore: 0
    };
    
    // 1. Контекстный анализ запроса
    console.log('🧠 [ENHANCED_AI] Этап 1: Контекстный анализ запроса');
    analysis.queryAnalysis = await aiQueryAnalyzer.analyzeQueryWithContext(
      query, 
      sessionId, 
      options.previousQueries || []
    );
    
    // 2. Мультиязычная обработка
    console.log('🧠 [ENHANCED_AI] Этап 2: Мультиязычная обработка');
    analysis.multilingualAnalysis = await multilingualProcessor.processMultilingualQuery(
      query, 
      options.targetLanguage || 'ru'
    );
    
    // 3. Временной анализ
    console.log('🧠 [ENHANCED_AI] Этап 3: Временной анализ');
    analysis.temporalAnalysis = temporalAnalyzer.analyzeTemporalRequirements(
      query, 
      analysis.queryAnalysis
    );
    
    // 4. Анализ персонализации
    console.log('🧠 [ENHANCED_AI] Этап 4: Анализ персонализации');
    if (sessionId) {
      analysis.personalizationData = await personalizationEngine.analyzeUserPreferences(
        sessionId, 
        options.recentQueries || []
      );
    }
    
    // 5. Определение стратегии обработки
    console.log('🧠 [ENHANCED_AI] Этап 5: Определение стратегии обработки');
    analysis.processingStrategy = determineProcessingStrategy(analysis);
    analysis.searchConfiguration = configureEnhancedSearch(analysis);
    analysis.responseConfiguration = configureResponseGeneration(analysis);
    
    // 6. Расчет общей уверенности
    analysis.confidenceScore = calculateOverallConfidence(analysis);
    analysis.analysisTime = Date.now() - startTime;
    
    console.log('🧠 [ENHANCED_AI] Анализ завершен:', {
      strategy: analysis.processingStrategy.primary,
      needsSearch: analysis.processingStrategy.needsSearch,
      searchType: analysis.searchConfiguration.type,
      confidence: analysis.confidenceScore,
      analysisTime: analysis.analysisTime
    });
    
    return analysis;
    
  } catch (error) {
    console.error('❌ [ENHANCED_AI] Ошибка продвинутого анализа:', error);
    return createFallbackAnalysis(query, sessionId);
  }
}

/**
 * Выполнение enhanced поиска с применением всех улучшений
 */
async function performEnhancedSearch(enhancedAnalysis, options = {}) {
  try {
    console.log('🔍 [ENHANCED_SEARCH] Выполняем продвинутый поиск');
    
    const searchConfig = enhancedAnalysis.searchConfiguration;
    const searchResults = {
      originalResults: [],
      enhancedResults: [],
      factCheckResults: null,
      multilingualResults: null,
      finalResults: [],
      metadata: {}
    };
    
    // 1. Мультиязычный поиск если необходим
    if (searchConfig.useMultilingual) {
      console.log('🔍 [ENHANCED_SEARCH] Мультиязычный поиск');
      searchResults.multilingualResults = await multilingualProcessor.performMultilingualSearch(
        enhancedAnalysis.multilingualAnalysis.searchQueries,
        { maxResults: searchConfig.maxResults }
      );
      
      if (searchResults.multilingualResults.success) {
        searchResults.originalResults = searchResults.multilingualResults.results;
      }
    }
    
    // 2. Стандартный поиск если мультиязычный недоступен
    if (searchResults.originalResults.length === 0) {
      console.log('🔍 [ENHANCED_SEARCH] Стандартный поиск');
      const { performWebSearch } = require('./web-search-provider');
      const standardResult = await performWebSearch(enhancedAnalysis.query);
      
      if (standardResult.success) {
        searchResults.originalResults = standardResult.results;
      }
    }
    
    // 3. Применение временных приоритетов
    if (searchResults.originalResults.length > 0 && searchConfig.applyTemporal) {
      console.log('🔍 [ENHANCED_SEARCH] Применение временных приоритетов');
      searchResults.enhancedResults = temporalAnalyzer.applyTemporalPriority(
        searchResults.originalResults,
        enhancedAnalysis.temporalAnalysis
      );
    } else {
      searchResults.enhancedResults = searchResults.originalResults;
    }
    
    // 4. Факт-чекинг если требуется
    if (searchConfig.performFactCheck && searchResults.enhancedResults.length >= 2) {
      console.log('🔍 [ENHANCED_SEARCH] Факт-чекинг');
      searchResults.factCheckResults = await factChecker.performFactCheck(
        searchResults.enhancedResults,
        enhancedAnalysis.query,
        { analysisContext: enhancedAnalysis.queryAnalysis }
      );
    }
    
    // 5. Финальная обработка результатов
    searchResults.finalResults = processFinalResults(
      searchResults.enhancedResults,
      searchResults.factCheckResults,
      searchConfig
    );
    
    // 6. Метаданные
    searchResults.metadata = {
      totalOriginal: searchResults.originalResults.length,
      totalEnhanced: searchResults.enhancedResults.length,
      factCheckScore: searchResults.factCheckResults?.overallCredibility || null,
      searchStrategy: searchConfig.type,
      processingTime: Date.now() - searchConfig.startTime
    };
    
    console.log('🔍 [ENHANCED_SEARCH] Поиск завершен:', {
      originalResults: searchResults.metadata.totalOriginal,
      enhancedResults: searchResults.metadata.totalEnhanced,
      factCheckScore: searchResults.metadata.factCheckScore,
      strategy: searchResults.metadata.searchStrategy
    });
    
    return searchResults;
    
  } catch (error) {
    console.error('❌ [ENHANCED_SEARCH] Ошибка продвинутого поиска:', error);
    return createFallbackSearchResults();
  }
}

/**
 * Генерация enhanced ответа с персонализацией
 */
async function generateEnhancedResponse(enhancedAnalysis, searchResults, options = {}) {
  try {
    console.log('✨ [ENHANCED_RESPONSE] Генерация продвинутого ответа');
    
    // 1. Формируем базовый ответ
    let baseResponse = await generateBaseResponse(
      enhancedAnalysis,
      searchResults,
      options
    );
    
    // 2. Применяем персонализацию если есть данные
    if (enhancedAnalysis.personalizationData) {
      console.log('✨ [ENHANCED_RESPONSE] Применение персонализации');
      baseResponse = personalizationEngine.personalizeResponse(
        baseResponse,
        enhancedAnalysis.personalizationData,
        {
          primaryTopic: enhancedAnalysis.queryAnalysis.intentAnalysis.primaryIntent,
          relatedTopics: extractRelatedTopics(searchResults)
        }
      );
    }
    
    // 3. Добавляем факт-чекинг информацию
    if (searchResults.factCheckResults) {
      baseResponse = addFactCheckSection(baseResponse, searchResults.factCheckResults);
    }
    
    // 4. Добавляем метаданные анализа (если в режиме отладки)
    if (options.includeAnalysisMetadata) {
      baseResponse = addAnalysisMetadata(baseResponse, enhancedAnalysis, searchResults);
    }
    
    const response = {
      text: baseResponse,
      metadata: {
        analysisUsed: true,
        personalized: !!enhancedAnalysis.personalizationData,
        factChecked: !!searchResults.factCheckResults,
        multilingualSearch: !!searchResults.multilingualResults,
        temporalPriority: enhancedAnalysis.temporalAnalysis.priorityScore,
        confidenceScore: enhancedAnalysis.confidenceScore
      }
    };
    
    console.log('✨ [ENHANCED_RESPONSE] Ответ сгенерирован:', {
      personalized: response.metadata.personalized,
      factChecked: response.metadata.factChecked,
      confidence: response.metadata.confidenceScore
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ [ENHANCED_RESPONSE] Ошибка генерации ответа:', error);
    return createFallbackResponse(enhancedAnalysis.query);
  }
}

/**
 * Определение стратегии обработки
 */
function determineProcessingStrategy(analysis) {
  const strategy = {
    primary: 'standard',
    needsSearch: false,
    requiresFactCheck: false,
    useMultilingual: false,
    applyPersonalization: false,
    priority: 'normal'
  };
  
  // Анализируем намерения
  const intent = analysis.queryAnalysis.intentAnalysis.primaryIntent;
  
  if (intent === 'search' || intent === 'information') {
    strategy.primary = 'information_retrieval';
    strategy.needsSearch = true;
  } else if (intent === 'analysis') {
    strategy.primary = 'analytical_processing';
    strategy.needsSearch = true;
    strategy.requiresFactCheck = true;
  } else if (intent === 'creation') {
    strategy.primary = 'content_generation';
    strategy.needsSearch = false;
  }
  
  // Временные требования
  if (analysis.temporalAnalysis.needsRealTime) {
    strategy.priority = 'high';
    strategy.needsSearch = true;
  }
  
  // Мультиязычность
  if (analysis.multilingualAnalysis.needsTranslation || 
      analysis.queryAnalysis.languageAnalysis.isMixed) {
    strategy.useMultilingual = true;
  }
  
  // Персонализация
  if (analysis.personalizationData && analysis.personalizationData.confidenceScore > 0.3) {
    strategy.applyPersonalization = true;
  }
  
  return strategy;
}

/**
 * Конфигурация enhanced поиска
 */
function configureEnhancedSearch(analysis) {
  const config = {
    type: 'standard',
    maxResults: 10,
    useMultilingual: false,
    applyTemporal: false,
    performFactCheck: false,
    searchQueries: [],
    startTime: Date.now()
  };
  
  const strategy = analysis.processingStrategy;
  const temporal = analysis.temporalAnalysis;
  
  // Тип поиска
  if (temporal.searchStrategy === 'realtime_priority') {
    config.type = 'realtime';
    config.maxResults = 15;
  } else if (temporal.searchStrategy === 'fresh_data_priority') {
    config.type = 'fresh';
    config.maxResults = 12;
  } else if (strategy.primary === 'analytical_processing') {
    config.type = 'comprehensive';
    config.maxResults = 20;
  }
  
  // Дополнительные настройки
  config.useMultilingual = strategy.useMultilingual;
  config.applyTemporal = temporal.priorityScore > 10;
  config.performFactCheck = strategy.requiresFactCheck && config.maxResults >= 2;
  
  // Поисковые запросы
  if (analysis.multilingualAnalysis.searchQueries.length > 0) {
    config.searchQueries = analysis.multilingualAnalysis.searchQueries;
  } else {
    config.searchQueries = [{ query: analysis.query, language: 'ru', weight: 1.0 }];
  }
  
  return config;
}

/**
 * Конфигурация генерации ответа
 */
function configureResponseGeneration(analysis) {
  const config = {
    style: 'detailed',
    includeMetadata: false,
    addPersonalization: false,
    addFactCheck: false,
    language: 'ru'
  };
  
  // Стиль на основе персонализации
  if (analysis.personalizationData) {
    config.style = analysis.personalizationData.communicationStyle;
    config.addPersonalization = true;
  }
  
  // Язык ответа
  config.language = analysis.multilingualAnalysis.originalLanguage;
  
  // Метаданные для отладки
  config.includeMetadata = analysis.queryAnalysis.complexityScore > 7;
  
  return config;
}

/**
 * Генерация базового ответа
 */
async function generateBaseResponse(enhancedAnalysis, searchResults, options) {
  try {
    if (searchResults.finalResults.length === 0) {
      return await generateDirectAIResponse(enhancedAnalysis);
    }
    
    // Формируем промпт для AI с учетом всех данных
    const enhancedPrompt = createEnhancedPrompt(enhancedAnalysis, searchResults);
    
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5004/python/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: enhancedPrompt,
        provider: selectOptimalProvider(enhancedAnalysis),
        timeout: 30000
      })
    });
    
    const result = await response.json();
    
    if (result && result.success && result.response) {
      return result.response;
    }
    
    return generateFallbackTextResponse(enhancedAnalysis, searchResults);
    
  } catch (error) {
    console.error('❌ [BASE_RESPONSE] Ошибка генерации базового ответа:', error);
    return generateFallbackTextResponse(enhancedAnalysis, searchResults);
  }
}

/**
 * Создание enhanced промпта
 */
function createEnhancedPrompt(enhancedAnalysis, searchResults) {
  const analysis = enhancedAnalysis.queryAnalysis;
  const temporal = enhancedAnalysis.temporalAnalysis;
  const multilingual = enhancedAnalysis.multilingualAnalysis;
  
  let prompt = `Ответь на вопрос пользователя, используя предоставленную информацию и анализ.

ВОПРОС: "${enhancedAnalysis.query}"

КОНТЕКСТ АНАЛИЗА:
- Намерение: ${analysis.intentAnalysis.primaryIntent}
- Сложность запроса: ${analysis.complexityScore}/10
- Временные требования: ${temporal.timeFrame} (приоритет: ${temporal.freshnessPriority})
- Язык: ${multilingual.originalLanguage}
${temporal.needsRealTime ? '- ТРЕБУЮТСЯ АКТУАЛЬНЫЕ ДАННЫЕ В РЕАЛЬНОМ ВРЕМЕНИ' : ''}

НАЙДЕННАЯ ИНФОРМАЦИЯ:
${searchResults.finalResults.slice(0, 8).map((result, index) => `
${index + 1}. **${result.title}**
   Источник: ${result.source}
   Контент: ${result.snippet || result.content || ''}
   ${result.temporalScore ? `Актуальность: ${result.temporalScore}/10` : ''}
   ${result.adjustedRelevance ? `Релевантность: ${result.adjustedRelevance.toFixed(2)}` : ''}
`).join('\n')}

ИНСТРУКЦИИ:
1. Дай полный, точный ответ на вопрос пользователя
2. Используй только информацию из предоставленных источников
3. Структурируй ответ логично с заголовками и списками
4. Выдели ключевые факты, цифры и даты
${temporal.needsRealTime ? '5. ОБЯЗАТЕЛЬНО укажи временные метки и актуальность данных' : ''}
${analysis.intentAnalysis.primaryIntent === 'analysis' ? '6. Предоставь аналитические выводы и сравнения' : ''}
7. Отвечай на ${multilingual.originalLanguage === 'en' ? 'английском' : 'русском'} языке
8. НЕ предоставляй прямые ссылки - только содержательную информацию

ФОРМАТ ОТВЕТА:
- Начни с прямого ответа на вопрос
- Добавь важные детали и контекст
- Укажи ключевые факты с конкретными данными
- Заверши кратким резюме`;

  return prompt;
}

/**
 * Выбор оптимального AI провайдера
 */
function selectOptimalProvider(enhancedAnalysis) {
  const intent = enhancedAnalysis.queryAnalysis.intentAnalysis.primaryIntent;
  const complexity = enhancedAnalysis.queryAnalysis.complexityScore;
  const temporal = enhancedAnalysis.temporalAnalysis;
  
  if (temporal.needsRealTime || temporal.priorityScore > 20) {
    return 'Qwen_Qwen_2_72B'; // Лучший для актуальной информации
  }
  
  if (intent === 'analysis' && complexity > 7) {
    return 'Claude'; // Лучший для сложного анализа
  }
  
  if (intent === 'creation') {
    return 'GeminiPro'; // Хороший для генерации контента
  }
  
  return 'Qwen_Qwen_2_72B'; // Универсальный выбор
}

/**
 * Вспомогательные функции
 */

function calculateOverallConfidence(analysis) {
  const weights = {
    query: 0.3,
    multilingual: 0.2,
    temporal: 0.2,
    personalization: 0.2,
    processing: 0.1
  };
  
  let score = 0;
  score += (analysis.queryAnalysis.intentAnalysis.confidence || 0.5) * weights.query;
  score += (analysis.multilingualAnalysis.confidence || 0.5) * weights.multilingual;
  score += Math.min(analysis.temporalAnalysis.priorityScore / 30, 1) * weights.temporal;
  score += (analysis.personalizationData?.confidenceScore || 0.3) * weights.personalization;
  score += 0.8 * weights.processing; // Базовый скор для обработки
  
  return Math.min(Math.max(score, 0.1), 1.0);
}

function processFinalResults(enhancedResults, factCheckResults, searchConfig) {
  let finalResults = [...enhancedResults];
  
  // Применяем факт-чекинг если есть
  if (factCheckResults && factCheckResults.overallCredibility < 0.6) {
    // Помечаем результаты с низкой достоверностью
    finalResults = finalResults.map(result => ({
      ...result,
      credibilityWarning: true,
      factCheckScore: factCheckResults.overallCredibility
    }));
  }
  
  // Ограничиваем количество результатов
  return finalResults.slice(0, searchConfig.maxResults);
}

function extractRelatedTopics(searchResults) {
  // Упрощенное извлечение связанных тем
  return ['технологии', 'наука', 'бизнес'];
}

function addFactCheckSection(response, factCheckResults) {
  if (!factCheckResults || factCheckResults.overallCredibility >= 0.8) {
    return response;
  }
  
  const credibilityLevel = factCheckResults.overallCredibility >= 0.6 ? 'умеренная' : 'низкая';
  
  return response + `\n\n⚠️ **Проверка достоверности:** Обнаружена ${credibilityLevel} достоверность информации (${(factCheckResults.overallCredibility * 100).toFixed(1)}%). ${factCheckResults.recommendations.slice(0, 2).join(', ')}.`;
}

function addAnalysisMetadata(response, enhancedAnalysis, searchResults) {
  return response + `\n\n🔍 **Метаданные анализа:**
- Намерение: ${enhancedAnalysis.queryAnalysis.intentAnalysis.primaryIntent}
- Временной приоритет: ${enhancedAnalysis.temporalAnalysis.priorityScore}/30
- Источников проанализировано: ${searchResults.metadata.totalOriginal}
- Уверенность: ${(enhancedAnalysis.confidenceScore * 100).toFixed(1)}%`;
}

function createFallbackAnalysis(query, sessionId) {
  return {
    query,
    sessionId,
    queryAnalysis: { intentAnalysis: { primaryIntent: 'information' }, complexityScore: 3 },
    multilingualAnalysis: { originalLanguage: 'ru', needsTranslation: false, confidence: 0.5 },
    temporalAnalysis: { timeFrame: 'any', priorityScore: 3 },
    personalizationData: null,
    processingStrategy: { primary: 'standard', needsSearch: false },
    searchConfiguration: { type: 'standard', maxResults: 10 },
    confidenceScore: 0.3
  };
}

function createFallbackSearchResults() {
  return {
    originalResults: [],
    enhancedResults: [],
    finalResults: [],
    metadata: { totalOriginal: 0, totalEnhanced: 0, factCheckScore: null }
  };
}

function createFallbackResponse(query) {
  return {
    text: `По запросу "${query}" не удалось получить подробную информацию. Попробуйте переформулировать вопрос.`,
    metadata: { analysisUsed: false, personalized: false, factChecked: false }
  };
}

async function generateDirectAIResponse(enhancedAnalysis) {
  const simplePrompt = `Ответь на вопрос: "${enhancedAnalysis.query}"
  
Дай информативный и полезный ответ на основе своих знаний.`;

  try {
    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5004/python/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: simplePrompt,
        provider: 'Qwen_Qwen_2_72B',
        timeout: 20000
      })
    });
    
    const result = await response.json();
    return result?.response || `Ответ на вопрос "${enhancedAnalysis.query}" временно недоступен.`;
    
  } catch (error) {
    return `Не удалось обработать запрос "${enhancedAnalysis.query}".`;
  }
}

function generateFallbackTextResponse(enhancedAnalysis, searchResults) {
  if (searchResults.finalResults.length > 0) {
    const topResult = searchResults.finalResults[0];
    return `По запросу "${enhancedAnalysis.query}" найдена следующая информация:\n\n**${topResult.title}**\n\n${topResult.snippet || topResult.content || 'Содержание недоступно.'}\n\nИсточник: ${topResult.source}`;
  }
  
  return `По запросу "${enhancedAnalysis.query}" не найдено достаточно информации для формирования подробного ответа.`;
}

module.exports = {
  performEnhancedAnalysis,
  performEnhancedSearch,
  generateEnhancedResponse
};