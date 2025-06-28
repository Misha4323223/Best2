/**
 * Система факт-чекинга для проверки достоверности информации через несколько источников
 * Анализирует противоречия и оценивает надежность данных
 */

/**
 * Проверка фактов через множественные источники
 */
async function performFactCheck(searchResults, originalQuery, analysisContext = {}) {
  try {
    console.log('🔍 [FACT_CHECK] Начинаем проверку фактов');
    
    const factCheck = {
      query: originalQuery,
      totalSources: searchResults.length,
      verificationResults: [],
      overallCredibility: 0,
      contradictions: [],
      consistentFacts: [],
      uncertainFacts: [],
      recommendations: [],
      timestamp: new Date().toISOString()
    };
    
    if (searchResults.length < 2) {
      factCheck.recommendations.push('Недостаточно источников для факт-чекинга');
      return factCheck;
    }
    
    // Анализируем каждый источник
    factCheck.verificationResults = await analyzeSourceCredibility(searchResults);
    
    // Извлекаем утверждения и факты
    const extractedClaims = extractClaims(searchResults);
    
    // Проверяем консистентность между источниками
    const consistencyAnalysis = analyzeConsistency(extractedClaims, factCheck.verificationResults);
    
    factCheck.consistentFacts = consistencyAnalysis.consistent;
    factCheck.contradictions = consistencyAnalysis.contradictions;
    factCheck.uncertainFacts = consistencyAnalysis.uncertain;
    
    // Рассчитываем общую достоверность
    factCheck.overallCredibility = calculateOverallCredibility(factCheck.verificationResults, consistencyAnalysis);
    
    // Генерируем рекомендации
    factCheck.recommendations = generateFactCheckRecommendations(factCheck);
    
    // Создаем AI-анализ достоверности
    factCheck.aiAnalysis = await generateAIFactCheckAnalysis(factCheck, originalQuery);
    
    console.log('🔍 [FACT_CHECK] Факт-чекинг завершен:', {
      credibility: factCheck.overallCredibility,
      contradictions: factCheck.contradictions.length,
      consistentFacts: factCheck.consistentFacts.length
    });
    
    return factCheck;
    
  } catch (error) {
    console.error('❌ [FACT_CHECK] Ошибка факт-чекинга:', error);
    return createFallbackFactCheck(searchResults, originalQuery);
  }
}

/**
 * Анализ достоверности источников
 */
async function analyzeSourceCredibility(searchResults) {
  const credibilityResults = [];
  
  for (const result of searchResults) {
    const credibility = {
      url: result.url || 'unknown',
      source: result.source || 'unknown',
      title: result.title || '',
      domainCredibility: analyzeDomainCredibility(result.url || result.source || ''),
      contentQuality: analyzeContentQuality(result),
      recentness: analyzeRecentness(result),
      overallScore: 0,
      flags: []
    };
    
    // Рассчитываем общий скор достоверности
    credibility.overallScore = calculateCredibilityScore(credibility);
    
    credibilityResults.push(credibility);
  }
  
  return credibilityResults;
}

/**
 * Анализ достоверности домена
 */
function analyzeDomainCredibility(urlOrSource) {
  const url = urlOrSource.toLowerCase();
  
  const credibilityRanks = {
    // Высокая достоверность
    high: [
      'gov.ru', 'edu', 'academic', 'wikipedia', 'britannica',
      'bbc.com', 'reuters.com', 'ap.org', 'tass.ru', 'ria.ru',
      'rbc.ru', 'kommersant.ru', 'vedomosti.ru', 'nature.com',
      'science.org', 'pubmed', 'arxiv.org', 'springer.com'
    ],
    
    // Средняя достоверность
    medium: [
      'lenta.ru', 'gazeta.ru', 'rt.com', 'sputnik',
      'cnn.com', 'guardian.com', 'washingtonpost.com',
      'forbes.com', 'bloomberg.com', 'interfax.ru'
    ],
    
    // Низкая достоверность
    low: [
      'blog', 'wordpress', 'medium.com', 'telegram',
      'vk.com', 'facebook.com', 'twitter.com', 'instagram.com'
    ]
  };
  
  for (const [level, domains] of Object.entries(credibilityRanks)) {
    if (domains.some(domain => url.includes(domain))) {
      return {
        level,
        score: level === 'high' ? 0.9 : level === 'medium' ? 0.6 : 0.3,
        domain: domains.find(domain => url.includes(domain))
      };
    }
  }
  
  return { level: 'unknown', score: 0.5, domain: 'unknown' };
}

/**
 * Анализ качества контента
 */
function analyzeContentQuality(result) {
  const content = (result.title || '') + ' ' + (result.snippet || '') + ' ' + (result.content || '');
  
  const quality = {
    length: content.length,
    hasNumbers: /\d/.test(content),
    hasReferences: content.includes('источник') || content.includes('source') || content.includes('по данным'),
    hasQuotes: content.includes('"') || content.includes('«') || content.includes('»'),
    hasAuthors: content.includes('автор') || content.includes('reporter') || content.includes('correspondent'),
    languageQuality: analyzeLanguageQuality(content),
    score: 0
  };
  
  // Рассчитываем скор качества
  let score = 0.3; // Базовый скор
  
  if (quality.length > 200) score += 0.2;
  if (quality.hasNumbers) score += 0.1;
  if (quality.hasReferences) score += 0.2;
  if (quality.hasQuotes) score += 0.1;
  if (quality.hasAuthors) score += 0.1;
  
  quality.score = Math.min(score, 1.0);
  
  return quality;
}

/**
 * Анализ свежести информации
 */
function analyzeRecentness(result) {
  const now = new Date();
  const publishDate = extractPublishDate(result);
  
  if (!publishDate) {
    return { score: 0.5, age: 'unknown', publishDate: null };
  }
  
  const ageInDays = (now - publishDate) / (1000 * 60 * 60 * 24);
  
  let score = 1.0;
  if (ageInDays > 365) score = 0.3;      // Старше года
  else if (ageInDays > 90) score = 0.5;  // Старше 3 месяцев
  else if (ageInDays > 30) score = 0.7;  // Старше месяца
  else if (ageInDays > 7) score = 0.9;   // Старше недели
  
  return {
    score,
    age: ageInDays < 1 ? 'today' : ageInDays < 7 ? 'this_week' : ageInDays < 30 ? 'this_month' : 'older',
    publishDate,
    ageInDays: Math.round(ageInDays)
  };
}

/**
 * Извлечение даты публикации
 */
function extractPublishDate(result) {
  const content = (result.title || '') + ' ' + (result.snippet || '') + ' ' + (result.publishDate || '');
  
  const datePatterns = [
    /(\d{1,2})[.](\d{1,2})[.](\d{4})/,  // DD.MM.YYYY
    /(\d{4})[-](\d{1,2})[-](\d{1,2})/,  // YYYY-MM-DD
    /(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+(\d{4})/i
  ];
  
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        return new Date(match[0]);
      } catch (e) {
        continue;
      }
    }
  }
  
  return null;
}

/**
 * Анализ качества языка
 */
function analyzeLanguageQuality(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  return {
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? content.length / sentences.length : 0,
    hasGrammarErrors: false, // Упрощенная версия
    clarity: sentences.length > 0 && content.length / sentences.length > 20 ? 'good' : 'poor'
  };
}

/**
 * Расчет общего скора достоверности источника
 */
function calculateCredibilityScore(credibility) {
  const weights = {
    domain: 0.4,
    content: 0.3,
    recentness: 0.3
  };
  
  return (
    credibility.domainCredibility.score * weights.domain +
    credibility.contentQuality.score * weights.content +
    credibility.recentness.score * weights.recentness
  );
}

/**
 * Извлечение утверждений из результатов поиска
 */
function extractClaims(searchResults) {
  const claims = [];
  
  searchResults.forEach((result, index) => {
    const content = (result.title || '') + ' ' + (result.snippet || '');
    
    // Извлекаем числовые данные
    const numbers = content.match(/\d+[.,]?\d*/g) || [];
    numbers.forEach(number => {
      claims.push({
        type: 'number',
        value: number,
        context: content.substring(Math.max(0, content.indexOf(number) - 50), content.indexOf(number) + 50),
        sourceIndex: index,
        source: result.source || result.url || 'unknown'
      });
    });
    
    // Извлекаем даты
    const dates = content.match(/\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}/g) || [];
    dates.forEach(date => {
      claims.push({
        type: 'date',
        value: date,
        context: content.substring(Math.max(0, content.indexOf(date) - 50), content.indexOf(date) + 50),
        sourceIndex: index,
        source: result.source || result.url || 'unknown'
      });
    });
    
    // Извлекаем ключевые утверждения
    const statements = extractKeyStatements(content);
    statements.forEach(statement => {
      claims.push({
        type: 'statement',
        value: statement,
        context: statement,
        sourceIndex: index,
        source: result.source || result.url || 'unknown'
      });
    });
  });
  
  return claims;
}

/**
 * Извлечение ключевых утверждений
 */
function extractKeyStatements(content) {
  const statements = [];
  
  // Ищем утверждения с высокой уверенностью
  const confidencePatterns = [
    /[А-ЯA-Z][^.!?]*?(составляет|равен|достигает|превышает|увеличился|уменьшился|стал|является)[^.!?]*[.!?]/g,
    /[А-ЯA-Z][^.!?]*?(according to|reports|confirms|states|announced)[^.!?]*[.!?]/g
  ];
  
  confidencePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    statements.push(...matches.slice(0, 3)); // Максимум 3 утверждения на источник
  });
  
  return statements;
}

/**
 * Анализ консистентности между источниками
 */
function analyzeConsistency(claims, credibilityResults) {
  const analysis = {
    consistent: [],
    contradictions: [],
    uncertain: []
  };
  
  // Группируем утверждения по типу и значению
  const claimGroups = groupClaimsByValue(claims);
  
  Object.entries(claimGroups).forEach(([value, claimGroup]) => {
    if (claimGroup.length === 1) {
      analysis.uncertain.push({
        value,
        reason: 'single_source',
        claims: claimGroup
      });
    } else {
      // Проверяем консистентность между источниками
      const consistencyCheck = checkConsistency(claimGroup, credibilityResults);
      
      if (consistencyCheck.isConsistent) {
        analysis.consistent.push({
          value,
          confidence: consistencyCheck.confidence,
          sourceCount: claimGroup.length,
          claims: claimGroup
        });
      } else {
        analysis.contradictions.push({
          value,
          reason: consistencyCheck.reason,
          claims: claimGroup
        });
      }
    }
  });
  
  return analysis;
}

/**
 * Группировка утверждений по значению
 */
function groupClaimsByValue(claims) {
  const groups = {};
  
  claims.forEach(claim => {
    const key = claim.value.toLowerCase().trim();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(claim);
  });
  
  return groups;
}

/**
 * Проверка консистентности группы утверждений
 */
function checkConsistency(claimGroup, credibilityResults) {
  if (claimGroup.length < 2) {
    return { isConsistent: true, confidence: 0.5, reason: 'insufficient_data' };
  }
  
  // Для числовых данных проверяем близость значений
  if (claimGroup[0].type === 'number') {
    const numbers = claimGroup.map(claim => parseFloat(claim.value.replace(',', '.')));
    const avg = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const maxDeviation = Math.max(...numbers.map(num => Math.abs(num - avg))) / avg;
    
    return {
      isConsistent: maxDeviation < 0.1, // 10% отклонение допустимо
      confidence: Math.max(0.1, 1 - maxDeviation),
      reason: maxDeviation >= 0.1 ? 'numerical_inconsistency' : 'consistent'
    };
  }
  
  // Для дат проверяем совпадение
  if (claimGroup[0].type === 'date') {
    const uniqueDates = [...new Set(claimGroup.map(claim => claim.value))];
    return {
      isConsistent: uniqueDates.length === 1,
      confidence: uniqueDates.length === 1 ? 0.9 : 0.2,
      reason: uniqueDates.length > 1 ? 'date_inconsistency' : 'consistent'
    };
  }
  
  // Для текстовых утверждений простая проверка схожести
  const uniqueStatements = [...new Set(claimGroup.map(claim => claim.value.toLowerCase()))];
  return {
    isConsistent: uniqueStatements.length <= claimGroup.length * 0.7, // Допускаем 30% различий
    confidence: 1 - (uniqueStatements.length / claimGroup.length),
    reason: uniqueStatements.length > claimGroup.length * 0.7 ? 'statement_inconsistency' : 'consistent'
  };
}

/**
 * Расчет общей достоверности
 */
function calculateOverallCredibility(verificationResults, consistencyAnalysis) {
  // Средняя достоверность источников
  const avgSourceCredibility = verificationResults.reduce((sum, result) => sum + result.overallScore, 0) / verificationResults.length;
  
  // Коэффициент консистентности
  const totalClaims = consistencyAnalysis.consistent.length + consistencyAnalysis.contradictions.length + consistencyAnalysis.uncertain.length;
  const consistencyRatio = totalClaims > 0 ? consistencyAnalysis.consistent.length / totalClaims : 0.5;
  
  // Штраф за противоречия
  const contradictionPenalty = Math.min(consistencyAnalysis.contradictions.length * 0.1, 0.3);
  
  const overallCredibility = (avgSourceCredibility * 0.6 + consistencyRatio * 0.4) - contradictionPenalty;
  
  return Math.max(0, Math.min(1, overallCredibility));
}

/**
 * Генерация рекомендаций по факт-чекингу
 */
function generateFactCheckRecommendations(factCheck) {
  const recommendations = [];
  
  if (factCheck.overallCredibility >= 0.8) {
    recommendations.push('Высокая достоверность информации');
  } else if (factCheck.overallCredibility >= 0.6) {
    recommendations.push('Умеренная достоверность, рекомендуется дополнительная проверка');
  } else {
    recommendations.push('Низкая достоверность, требуется тщательная проверка');
  }
  
  if (factCheck.contradictions.length > 0) {
    recommendations.push(`Обнаружено ${factCheck.contradictions.length} противоречий между источниками`);
  }
  
  if (factCheck.totalSources < 3) {
    recommendations.push('Рекомендуется найти дополнительные источники');
  }
  
  const lowCredibilitySources = factCheck.verificationResults.filter(r => r.overallScore < 0.5).length;
  if (lowCredibilitySources > 0) {
    recommendations.push(`${lowCredibilitySources} источников имеют низкую достоверность`);
  }
  
  return recommendations;
}

/**
 * Генерация AI-анализа достоверности
 */
async function generateAIFactCheckAnalysis(factCheck, originalQuery) {
  try {
    const analysisPrompt = `Проанализируй достоверность информации по запросу "${originalQuery}".

ДАННЫЕ ФАКТ-ЧЕКИНГА:
- Общая достоверность: ${(factCheck.overallCredibility * 100).toFixed(1)}%
- Количество источников: ${factCheck.totalSources}
- Консистентные факты: ${factCheck.consistentFacts.length}
- Противоречия: ${factCheck.contradictions.length}
- Неопределенные факты: ${factCheck.uncertainFacts.length}

ИСТОЧНИКИ:
${factCheck.verificationResults.map((result, index) => 
  `${index + 1}. ${result.source} - Достоверность: ${(result.overallScore * 100).toFixed(1)}%`
).join('\n')}

ПРОТИВОРЕЧИЯ:
${factCheck.contradictions.map(c => `- ${c.value}: ${c.reason}`).join('\n')}

Дай краткий анализ надежности информации и рекомендации по использованию данных.`;

    const fetch = require('node-fetch');
    const response = await fetch('http://localhost:5004/python/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: analysisPrompt,
        provider: 'Qwen_Qwen_2_72B',
        timeout: 20000
      })
    });
    
    const result = await response.json();
    
    if (result && result.success && result.response) {
      return result.response;
    }
    
    return generateLocalFactCheckSummary(factCheck);
    
  } catch (error) {
    console.error('❌ [AI_FACT_CHECK] Ошибка AI анализа:', error);
    return generateLocalFactCheckSummary(factCheck);
  }
}

/**
 * Локальная генерация резюме факт-чекинга
 */
function generateLocalFactCheckSummary(factCheck) {
  let summary = `**Анализ достоверности информации:**\n\n`;
  
  const credibilityLevel = factCheck.overallCredibility >= 0.8 ? 'Высокая' : 
                          factCheck.overallCredibility >= 0.6 ? 'Умеренная' : 'Низкая';
  
  summary += `📊 **Общая достоверность:** ${credibilityLevel} (${(factCheck.overallCredibility * 100).toFixed(1)}%)\n\n`;
  
  if (factCheck.consistentFacts.length > 0) {
    summary += `✅ **Подтвержденные факты:** ${factCheck.consistentFacts.length}\n`;
  }
  
  if (factCheck.contradictions.length > 0) {
    summary += `⚠️ **Противоречия:** ${factCheck.contradictions.length}\n`;
  }
  
  if (factCheck.recommendations.length > 0) {
    summary += `\n**Рекомендации:**\n${factCheck.recommendations.map(r => `• ${r}`).join('\n')}`;
  }
  
  return summary;
}

/**
 * Создание fallback факт-чека
 */
function createFallbackFactCheck(searchResults, originalQuery) {
  return {
    query: originalQuery,
    totalSources: searchResults.length,
    verificationResults: [],
    overallCredibility: 0.5,
    contradictions: [],
    consistentFacts: [],
    uncertainFacts: [],
    recommendations: ['Факт-чекинг недоступен'],
    aiAnalysis: 'Анализ достоверности временно недоступен'
  };
}

module.exports = {
  performFactCheck
};