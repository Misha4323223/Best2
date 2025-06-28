/**
 * Демонстрация Enhanced AI системы
 * Показывает работу всех новых возможностей
 */

const express = require('express');
const app = express();
const port = 3001;

// Импорт Enhanced AI модулей
const enhancedAIAnalyzer = require('./server/enhanced-ai-analyzer.cjs');

app.use(express.json());
app.use(express.static('public'));

// Главная страница демонстрации
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Enhanced AI Demo - BOOOMERANGS</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
            .demo-container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #007acc; }
            .test-results { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .error { background: #ffe8e8; color: #cc0000; }
            .success { background: #e8f5e8; color: #007700; }
            input, button { padding: 10px; margin: 5px; border: 1px solid #ddd; border-radius: 4px; }
            button { background: #007acc; color: white; cursor: pointer; }
            button:hover { background: #005999; }
            .loading { color: #666; font-style: italic; }
        </style>
    </head>
    <body>
        <h1>🧠 Enhanced AI System Demo</h1>
        <p>Демонстрация новых возможностей AI-анализа в BOOOMERANGS платформе</p>
        
        <div class="demo-container">
            <h2>🎯 Тестирование Enhanced AI</h2>
            <input type="text" id="testQuery" placeholder="Введите ваш запрос..." style="width: 70%;">
            <button onclick="testEnhancedAI()">Анализировать</button>
            <div id="results"></div>
        </div>

        <div class="demo-container">
            <h2>✅ Возможности Enhanced AI</h2>
            
            <div class="feature">
                <h3>🔍 Контекстный анализ запросов</h3>
                <p>Умное определение намерений пользователя, анализ сложности запроса (0-10 баллов), интеграция с историей сессии</p>
            </div>
            
            <div class="feature">
                <h3>🌍 Мультиязычная обработка</h3>
                <p>Автоматическое определение языка, AI-перевод через G4F провайдеры, поддержка 8+ языков включая русский, английский, китайский</p>
            </div>
            
            <div class="feature">
                <h3>⏰ Временной анализ</h3>
                <p>Приоритизация свежих данных для новостей, определение breaking news и real-time запросов, система весов для актуальности</p>
            </div>
            
            <div class="feature">
                <h3>🔍 Факт-чекинг</h3>
                <p>Автоматическая проверка достоверности через множественные источники, анализ противоречий, оценка credibility контента</p>
            </div>
            
            <div class="feature">
                <h3>👤 Персонализация</h3>
                <p>Анализ предпочтений на основе истории запросов, адаптация стиля коммуникации, персонализированные рекомендации</p>
            </div>
        </div>

        <script>
            async function testEnhancedAI() {
                const query = document.getElementById('testQuery').value.trim();
                const resultsDiv = document.getElementById('results');
                
                if (!query) {
                    resultsDiv.innerHTML = '<div class="error">Введите запрос для анализа</div>';
                    return;
                }
                
                resultsDiv.innerHTML = '<div class="loading">Анализирую запрос...</div>';
                
                try {
                    const response = await fetch('/demo/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        resultsDiv.innerHTML = formatAnalysisResults(result.analysis);
                    } else {
                        resultsDiv.innerHTML = '<div class="error">Ошибка анализа: ' + result.error + '</div>';
                    }
                } catch (error) {
                    resultsDiv.innerHTML = '<div class="error">Ошибка соединения: ' + error.message + '</div>';
                }
            }
            
            function formatAnalysisResults(analysis) {
                return \`
                    <div class="test-results">
                        <h3>📊 Результаты анализа</h3>
                        <p><strong>Запрос:</strong> "\${analysis.query}"</p>
                        <p><strong>Намерение:</strong> \${analysis.queryAnalysis?.intentAnalysis?.primaryIntent || 'Не определено'}</p>
                        <p><strong>Сложность:</strong> \${analysis.queryAnalysis?.complexityScore || 0}/10</p>
                        <p><strong>Язык:</strong> \${analysis.multilingualAnalysis?.originalLanguage || 'Не определен'}</p>
                        <p><strong>Временной приоритет:</strong> \${analysis.temporalAnalysis?.priorityScore || 0}/30</p>
                        <p><strong>Стратегия обработки:</strong> \${analysis.processingStrategy?.primary || 'Стандартная'}</p>
                        <p><strong>Нужен поиск:</strong> \${analysis.processingStrategy?.needsSearch ? 'Да' : 'Нет'}</p>
                        <p><strong>Общая уверенность:</strong> \${(analysis.confidenceScore * 100).toFixed(1)}%</p>
                        <p><strong>Время анализа:</strong> \${analysis.analysisTime}мс</p>
                    </div>
                \`;
            }
        </script>
    </body>
    </html>
  `);
});

// API endpoint для тестирования Enhanced AI
app.post('/demo/analyze', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Требуется параметр query'
      });
    }
    
    console.log(`🧪 [DEMO] Анализируем запрос: "${query}"`);
    
    // Выполняем Enhanced анализ
    const analysis = await enhancedAIAnalyzer.performEnhancedAnalysis(query, 'demo-session');
    
    res.json({
      success: true,
      analysis,
      message: 'Enhanced AI анализ успешно выполнен'
    });
    
  } catch (error) {
    console.error('❌ [DEMO] Ошибка анализа:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Статус Enhanced AI системы
app.get('/demo/status', (req, res) => {
  res.json({
    success: true,
    status: 'Enhanced AI система активна',
    modules: {
      'ai-query-analyzer': 'Работает',
      'multilingual-processor': 'Работает',
      'temporal-analyzer': 'Работает', 
      'fact-checker': 'Работает',
      'personalization-engine': 'Работает',
      'enhanced-ai-analyzer': 'Работает'
    },
    capabilities: [
      'Контекстный анализ запросов',
      'Мультиязычная обработка (8+ языков)',
      'Временной анализ и приоритизация',
      'Автоматический факт-чекинг',
      'Персонализация ответов'
    ]
  });
});

app.listen(port, () => {
  console.log(`🎯 Enhanced AI Demo запущен на http://localhost:${port}`);
  console.log('📋 Доступные endpoints:');
  console.log(`   • GET  /           - Демо интерфейс`);
  console.log(`   • POST /demo/analyze - Тестирование Enhanced AI`);
  console.log(`   • GET  /demo/status  - Статус системы`);
});