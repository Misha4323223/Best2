/**
 * Тестирование Enhanced AI системы
 */

const enhancedAIAnalyzer = require('./server/enhanced-ai-analyzer');
const aiQueryAnalyzer = require('./server/ai-query-analyzer');
const multilingualProcessor = require('./server/multilingual-processor');
const temporalAnalyzer = require('./server/temporal-analyzer');
const factChecker = require('./server/fact-checker');
const personalizationEngine = require('./server/personalization-engine');

async function testEnhancedAI() {
  console.log('🧪 Тестирование Enhanced AI системы\n');

  // Тестовые запросы
  const testQueries = [
    {
      query: "Какая погода сегодня в Москве?",
      description: "Запрос реального времени на русском"
    },
    {
      query: "What is the latest news about AI technology?",
      description: "Новостной запрос на английском"
    },
    {
      query: "比特币今天的价格是多少？",
      description: "Финансовый запрос на китайском"
    },
    {
      query: "Расскажи про последние исследования в области квантовых компьютеров",
      description: "Научный анализ"
    }
  ];

  for (const testCase of testQueries) {
    console.log(`\n📝 Тестирую: "${testCase.query}"`);
    console.log(`   Описание: ${testCase.description}`);
    
    try {
      // 1. Тест контекстного анализа
      console.log('\n   🔍 Контекстный анализ...');
      const queryAnalysis = await aiQueryAnalyzer.analyzeQueryWithContext(testCase.query, 'test-session-1');
      console.log(`   - Намерение: ${queryAnalysis.intentAnalysis.primaryIntent}`);
      console.log(`   - Сложность: ${queryAnalysis.complexityScore}/10`);
      console.log(`   - Уверенность: ${(queryAnalysis.intentAnalysis.confidence * 100).toFixed(1)}%`);

      // 2. Тест мультиязычности
      console.log('\n   🌍 Мультиязычная обработка...');
      const multilingualAnalysis = await multilingualProcessor.processMultilingualQuery(testCase.query);
      console.log(`   - Язык: ${multilingualAnalysis.originalLanguage}`);
      console.log(`   - Нужен перевод: ${multilingualAnalysis.needsTranslation ? 'Да' : 'Нет'}`);
      console.log(`   - Поисковых запросов: ${multilingualAnalysis.searchQueries.length}`);

      // 3. Тест временного анализа
      console.log('\n   ⏰ Временной анализ...');
      const temporalAnalysis = temporalAnalyzer.analyzeTemporalRequirements(testCase.query, queryAnalysis);
      console.log(`   - Временные рамки: ${temporalAnalysis.timeFrame}`);
      console.log(`   - Приоритет свежести: ${temporalAnalysis.priorityScore}/30`);
      console.log(`   - Нужны real-time данные: ${temporalAnalysis.needsRealTime ? 'Да' : 'Нет'}`);

      // 4. Комплексный Enhanced анализ
      console.log('\n   🧠 Комплексный Enhanced анализ...');
      const enhancedAnalysis = await enhancedAIAnalyzer.performEnhancedAnalysis(testCase.query, 'test-session-1');
      console.log(`   - Стратегия: ${enhancedAnalysis.processingStrategy.primary}`);
      console.log(`   - Нужен поиск: ${enhancedAnalysis.processingStrategy.needsSearch ? 'Да' : 'Нет'}`);
      console.log(`   - Общая уверенность: ${(enhancedAnalysis.confidenceScore * 100).toFixed(1)}%`);
      console.log(`   - Время анализа: ${enhancedAnalysis.analysisTime}мс`);

      console.log('   ✅ Анализ успешен');

    } catch (error) {
      console.log(`   ❌ Ошибка: ${error.message}`);
    }
  }

  // Тест персонализации
  console.log('\n\n👤 Тестирование персонализации...');
  try {
    const mockQueries = [
      { text: 'Как работает блокчейн?', timestamp: new Date(), length: 20 },
      { text: 'Последние новости о криптовалютах', timestamp: new Date(), length: 35 },
      { text: 'Что такое машинное обучение?', timestamp: new Date(), length: 30 }
    ];

    const personalizationData = await personalizationEngine.analyzeUserPreferences('test-session-1', mockQueries);
    console.log(`- Профиль пользователя: ${personalizationData.userProfile}`);
    console.log(`- Стиль коммуникации: ${personalizationData.communicationStyle}`);
    console.log(`- Экспертные области: ${personalizationData.expertDomains.join(', ')}`);
    console.log(`- Уверенность: ${(personalizationData.confidenceScore * 100).toFixed(1)}%`);
    console.log('✅ Персонализация работает');

  } catch (error) {
    console.log(`❌ Ошибка персонализации: ${error.message}`);
  }

  console.log('\n🎉 Тестирование Enhanced AI завершено!');
}

// Запуск тестов
testEnhancedAI().catch(error => {
  console.error('❌ Критическая ошибка тестирования:', error);
});