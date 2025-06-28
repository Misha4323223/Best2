
const { analyzeWebContent } = require('./web-content-parser');
const { getWebSearchResults } = require('./free-web-search');

/**
 * Тестирование анализа URL и веб-контента
 */
async function testUrlAnalysis() {
    console.log('🔍 Тестирование анализа URL...');
    
    const testUrls = [
        'https://example.com',
        'https://github.com',
        'https://stackoverflow.com/questions/1/what-is-javascript'
    ];
    
    for (const url of testUrls) {
        try {
            console.log(`\n📋 Анализ URL: ${url}`);
            
            // Тест анализа веб-контента
            const analysis = await analyzeWebContent(url);
            console.log('✅ Результат анализа:', {
                title: analysis.title,
                description: analysis.description,
                contentLength: analysis.content?.length || 0
            });
            
        } catch (error) {
            console.log('❌ Ошибка анализа:', error.message);
        }
    }
    
    // Тест поиска
    try {
        console.log('\n🔍 Тест веб-поиска...');
        const searchResults = await getWebSearchResults('JavaScript tutorial');
        console.log('✅ Найдено результатов:', searchResults.length);
    } catch (error) {
        console.log('❌ Ошибка поиска:', error.message);
    }
}

if (require.main === module) {
    testUrlAnalysis();
}

module.exports = { testUrlAnalysis };
