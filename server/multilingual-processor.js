/**
 * Мультиязычный процессор для автоматического перевода и поиска на разных языках
 * Обеспечивает глобальный поиск и обработку запросов независимо от языка
 */

/**
 * Определение языка запроса и автоматический перевод
 */
async function processMultilingualQuery(query, targetLanguage = 'ru') {
  try {
    console.log('🌐 [MULTILINGUAL] Начинаем мультиязычную обработку');
    
    const result = {
      originalQuery: query,
      originalLanguage: detectLanguage(query),
      targetLanguage,
      translatedQuery: null,
      searchQueries: [],
      needsTranslation: false,
      confidence: 0
    };
    
    // Определяем необходимость перевода
    result.needsTranslation = result.originalLanguage !== targetLanguage;
    
    if (result.needsTranslation) {
      console.log(`🌐 [MULTILINGUAL] Переводим с ${result.originalLanguage} на ${targetLanguage}`);
      
      // Переводим основной запрос
      result.translatedQuery = await translateQuery(query, result.originalLanguage, targetLanguage);
      
      // Создаем поисковые запросы на разных языках
      result.searchQueries = await generateMultilingualSearchQueries(query, result.translatedQuery);
      
      result.confidence = calculateTranslationConfidence(query, result.translatedQuery);
    } else {
      // Если перевод не нужен, создаем варианты запроса для лучшего поиска
      result.searchQueries = generateQueryVariations(query, result.originalLanguage);
      result.confidence = 1.0;
    }
    
    console.log('🌐 [MULTILINGUAL] Обработка завершена:', {
      originalLanguage: result.originalLanguage,
      needsTranslation: result.needsTranslation,
      searchQueriesCount: result.searchQueries.length,
      confidence: result.confidence
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ [MULTILINGUAL] Ошибка обработки:', error);
    return createFallbackMultilingualResult(query, targetLanguage);
  }
}

/**
 * Определение языка текста
 */
function detectLanguage(text) {
  const cyrillicCount = (text.match(/[а-яё]/gi) || []).length;
  const latinCount = (text.match(/[a-z]/gi) || []).length;
  const chineseCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const arabicCount = (text.match(/[\u0600-\u06ff]/g) || []).length;
  const japaneseCount = (text.match(/[\u3040-\u309f\u30a0-\u30ff]/g) || []).length;
  
  const totalChars = cyrillicCount + latinCount + chineseCount + arabicCount + japaneseCount;
  
  if (totalChars === 0) return 'unknown';
  
  const scores = {
    ru: cyrillicCount / totalChars,
    en: latinCount / totalChars,
    zh: chineseCount / totalChars,
    ar: arabicCount / totalChars,
    ja: japaneseCount / totalChars
  };
  
  // Дополнительная проверка на основе ключевых слов
  const russianKeywords = ['что', 'как', 'где', 'когда', 'почему', 'который', 'можно', 'нужно'];
  const englishKeywords = ['what', 'how', 'where', 'when', 'why', 'which', 'can', 'need'];
  
  const textLower = text.toLowerCase();
  const russianMatches = russianKeywords.filter(word => textLower.includes(word)).length;
  const englishMatches = englishKeywords.filter(word => textLower.includes(word)).length;
  
  if (russianMatches > 0) scores.ru += 0.3;
  if (englishMatches > 0) scores.en += 0.3;
  
  // Возвращаем язык с наивысшим счетом
  return Object.entries(scores).reduce((max, [lang, score]) => 
    score > max.score ? { lang, score } : max, { lang: 'en', score: 0 }).lang;
}

/**
 * Перевод запроса с использованием AI
 */
async function translateQuery(query, fromLang, toLang) {
  try {
    const languageNames = {
      'ru': 'русский',
      'en': 'английский',
      'zh': 'китайский',
      'ja': 'японский',
      'ar': 'арабский',
      'es': 'испанский',
      'fr': 'французский',
      'de': 'немецкий'
    };
    
    const fromLanguage = languageNames[fromLang] || fromLang;
    const toLanguage = languageNames[toLang] || toLang;
    
    const translationPrompt = `Переведи следующий текст с ${fromLanguage} языка на ${toLanguage} язык. 
Сохрани точный смысл и контекст. Отвечай только переводом, без дополнительных комментариев.

Текст для перевода: "${query}"

Перевод:`;
    
    // Используем локальные правила перевода для популярных фраз
    const translation = await translateWithLocalRules(query, fromLang, toLang) || 
                       await translateWithAI(translationPrompt);
    
    return translation || query; // Возвращаем оригинал, если перевод не удался
    
  } catch (error) {
    console.error('❌ [TRANSLATION] Ошибка перевода:', error);
    return query;
  }
}

/**
 * Локальные правила перевода для часто используемых фраз
 */
function translateWithLocalRules(query, fromLang, toLang) {
  const translationPairs = {
    'ru-en': {
      'погода': 'weather',
      'новости': 'news',
      'курс доллара': 'dollar rate',
      'курс евро': 'euro rate',
      'что такое': 'what is',
      'как работает': 'how does work',
      'где найти': 'where to find',
      'когда': 'when',
      'почему': 'why',
      'сколько стоит': 'how much costs',
      'лучший': 'best',
      'рецепт': 'recipe',
      'инструкция': 'instruction',
      'адрес': 'address',
      'телефон': 'phone',
      'время работы': 'working hours'
    },
    'en-ru': {
      'weather': 'погода',
      'news': 'новости',
      'dollar rate': 'курс доллара',
      'euro rate': 'курс евро',
      'what is': 'что такое',
      'how does': 'как работает',
      'where to find': 'где найти',
      'when': 'когда',
      'why': 'почему',
      'how much': 'сколько стоит',
      'best': 'лучший',
      'recipe': 'рецепт',
      'instruction': 'инструкция',
      'address': 'адрес',
      'phone': 'телефон',
      'working hours': 'время работы'
    }
  };
  
  const pairKey = `${fromLang}-${toLang}`;
  const translations = translationPairs[pairKey];
  
  if (!translations) return null;
  
  const queryLower = query.toLowerCase();
  let translatedQuery = query;
  
  // Заменяем известные фразы
  Object.entries(translations).forEach(([original, translated]) => {
    if (queryLower.includes(original.toLowerCase())) {
      translatedQuery = translatedQuery.replace(new RegExp(original, 'gi'), translated);
    }
  });
  
  return translatedQuery !== query ? translatedQuery : null;
}

/**
 * Перевод с помощью AI
 */
async function translateWithAI(translationPrompt) {
  try {
    const fetch = require('node-fetch');
    
    const response = await fetch('http://localhost:5004/python/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: translationPrompt,
        provider: 'Qwen_Qwen_2_72B',
        timeout: 15000
      })
    });
    
    const result = await response.json();
    
    if (result && result.success && result.response) {
      return result.response.trim();
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ [AI_TRANSLATION] Ошибка AI перевода:', error);
    return null;
  }
}

/**
 * Генерация мультиязычных поисковых запросов
 */
async function generateMultilingualSearchQueries(originalQuery, translatedQuery) {
  const queries = [];
  
  // Добавляем оригинальный запрос
  queries.push({
    query: originalQuery,
    language: detectLanguage(originalQuery),
    type: 'original',
    weight: 1.0
  });
  
  // Добавляем переведенный запрос
  if (translatedQuery && translatedQuery !== originalQuery) {
    queries.push({
      query: translatedQuery,
      language: detectLanguage(translatedQuery),
      type: 'translated',
      weight: 0.9
    });
  }
  
  // Создаем английские варианты для лучшего глобального поиска
  if (!queries.some(q => q.language === 'en')) {
    const englishQuery = await translateQuery(originalQuery, detectLanguage(originalQuery), 'en');
    if (englishQuery && englishQuery !== originalQuery) {
      queries.push({
        query: englishQuery,
        language: 'en',
        type: 'english_variant',
        weight: 0.8
      });
    }
  }
  
  // Добавляем синонимичные варианты
  const synonymVariants = generateSynonymVariants(originalQuery);
  synonymVariants.forEach((variant, index) => {
    queries.push({
      query: variant,
      language: detectLanguage(originalQuery),
      type: 'synonym',
      weight: 0.7 - (index * 0.1)
    });
  });
  
  return queries.slice(0, 6); // Максимум 6 вариантов запроса
}

/**
 * Генерация вариаций запроса для одного языка
 */
function generateQueryVariations(query, language) {
  const variations = [{
    query: query,
    language: language,
    type: 'original',
    weight: 1.0
  }];
  
  // Добавляем синонимы и вариации
  const synonyms = generateSynonymVariants(query);
  synonyms.forEach((synonym, index) => {
    variations.push({
      query: synonym,
      language: language,
      type: 'variation',
      weight: 0.8 - (index * 0.1)
    });
  });
  
  return variations.slice(0, 4); // Максимум 4 вариации
}

/**
 * Генерация синонимичных вариантов запроса
 */
function generateSynonymVariants(query) {
  const synonymMaps = {
    // Русские синонимы
    'найти': ['поиск', 'найди', 'где', 'отыскать'],
    'лучший': ['хороший', 'качественный', 'топ', 'отличный'],
    'купить': ['приобрести', 'заказать', 'получить'],
    'работа': ['вакансия', 'трудоустройство', 'карьера'],
    'дом': ['квартира', 'жилье', 'недвижимость'],
    'еда': ['питание', 'кухня', 'ресторан', 'кафе'],
    
    // Английские синонимы
    'find': ['search', 'locate', 'discover'],
    'best': ['top', 'excellent', 'quality', 'good'],
    'buy': ['purchase', 'order', 'get'],
    'work': ['job', 'employment', 'career'],
    'house': ['home', 'apartment', 'property'],
    'food': ['restaurant', 'cuisine', 'meal']
  };
  
  const variants = [];
  const queryLower = query.toLowerCase();
  
  Object.entries(synonymMaps).forEach(([original, synonyms]) => {
    if (queryLower.includes(original)) {
      synonyms.forEach(synonym => {
        const variant = query.replace(new RegExp(original, 'gi'), synonym);
        if (variant !== query) {
          variants.push(variant);
        }
      });
    }
  });
  
  return variants.slice(0, 3); // Максимум 3 синонимичных варианта
}

/**
 * Расчет уверенности в переводе
 */
function calculateTranslationConfidence(original, translated) {
  if (!translated || translated === original) return 0.5;
  
  // Базовая уверенность
  let confidence = 0.7;
  
  // Увеличиваем уверенность если длины схожи
  const lengthRatio = Math.min(original.length, translated.length) / 
                     Math.max(original.length, translated.length);
  confidence += (lengthRatio - 0.5) * 0.4;
  
  // Увеличиваем уверенность если есть числа в обоих
  const originalNumbers = (original.match(/\d+/g) || []).length;
  const translatedNumbers = (translated.match(/\d+/g) || []).length;
  if (originalNumbers > 0 && originalNumbers === translatedNumbers) {
    confidence += 0.2;
  }
  
  return Math.min(Math.max(confidence, 0.1), 1.0);
}

/**
 * Мультиязычный поиск с агрегацией результатов
 */
async function performMultilingualSearch(searchQueries, searchOptions = {}) {
  try {
    console.log('🌐 [MULTILINGUAL_SEARCH] Выполняем поиск на разных языках');
    
    const { performWebSearch } = require('./web-search-provider');
    const allResults = [];
    
    // Выполняем поиск по всем вариантам запроса
    for (const queryData of searchQueries) {
      try {
        console.log(`🌐 [SEARCH] Поиск: "${queryData.query}" (${queryData.language})`);
        
        const searchResult = await performWebSearch(queryData.query, {
          language: queryData.language,
          ...searchOptions
        });
        
        if (searchResult.success && searchResult.results) {
          // Добавляем метаданные к результатам
          const enrichedResults = searchResult.results.map(result => ({
            ...result,
            searchLanguage: queryData.language,
            searchType: queryData.type,
            weight: queryData.weight,
            multilingualScore: calculateMultilingualRelevance(result, queryData)
          }));
          
          allResults.push(...enrichedResults);
        }
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error(`❌ [MULTILINGUAL_SEARCH] Ошибка поиска для "${queryData.query}":`, error);
      }
    }
    
    // Агрегируем и сортируем результаты
    const aggregatedResults = aggregateMultilingualResults(allResults);
    
    console.log(`🌐 [MULTILINGUAL_SEARCH] Найдено ${aggregatedResults.length} уникальных результатов`);
    
    return {
      success: true,
      results: aggregatedResults,
      searchQueries: searchQueries,
      totalResults: allResults.length,
      uniqueResults: aggregatedResults.length
    };
    
  } catch (error) {
    console.error('❌ [MULTILINGUAL_SEARCH] Ошибка мультиязычного поиска:', error);
    return {
      success: false,
      error: error.message,
      results: []
    };
  }
}

/**
 * Расчет релевантности для мультиязычного поиска
 */
function calculateMultilingualRelevance(result, queryData) {
  let score = queryData.weight || 0.5;
  
  // Бонус за совпадение языка результата с языком запроса
  const resultLanguage = detectLanguage(result.title + ' ' + (result.snippet || ''));
  if (resultLanguage === queryData.language) {
    score += 0.2;
  }
  
  // Бонус за длину и качество сниппета
  if (result.snippet && result.snippet.length > 100) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

/**
 * Агрегация мультиязычных результатов поиска
 */
function aggregateMultilingualResults(allResults) {
  // Группируем по URL для удаления дубликатов
  const urlGroups = {};
  
  allResults.forEach(result => {
    const url = result.url || result.title;
    if (!urlGroups[url]) {
      urlGroups[url] = [];
    }
    urlGroups[url].push(result);
  });
  
  // Выбираем лучший результат из каждой группы
  const uniqueResults = Object.values(urlGroups).map(group => {
    if (group.length === 1) return group[0];
    
    // Выбираем результат с наивысшим мультиязычным счетом
    return group.reduce((best, current) => 
      (current.multilingualScore || 0) > (best.multilingualScore || 0) ? current : best
    );
  });
  
  // Сортируем по релевантности
  return uniqueResults
    .sort((a, b) => (b.multilingualScore || 0) - (a.multilingualScore || 0))
    .slice(0, 20); // Максимум 20 результатов
}

/**
 * Fallback результат для мультиязычной обработки
 */
function createFallbackMultilingualResult(query, targetLanguage) {
  return {
    originalQuery: query,
    originalLanguage: detectLanguage(query),
    targetLanguage,
    translatedQuery: null,
    searchQueries: [{
      query: query,
      language: detectLanguage(query),
      type: 'original',
      weight: 1.0
    }],
    needsTranslation: false,
    confidence: 0.5
  };
}

module.exports = {
  processMultilingualQuery,
  performMultilingualSearch,
  detectLanguage,
  translateQuery
};