
const smartRouter = require('./smart-router');

async function testUrlAnalysis() {
  console.log('🧪 Тестируем анализ URL...');
  
  const testQuery = "Проанализируй эту страницу: https://www.google.com и расскажи что там есть";
  
  try {
    const result = await smartRouter.getAIResponseWithSearch(testQuery, {
      preferredProvider: 'Qwen_Qwen_2_72B'
    });
    
    console.log('✅ Результат анализа URL:');
    console.log('Текст:', result.text.substring(0, 500) + '...');
    console.log('Провайдер:', result.provider);
    console.log('URL анализ использован:', result.urlAnalysisUsed);
    console.log('Проанализированные URL:', result.analyzedUrls);
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

if (require.main === module) {
  testUrlAnalysis();
}

module.exports = { testUrlAnalysis };
