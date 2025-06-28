const { analyzeMessage } = require('./smart-router'); // Импортируем в начале файла
// Импорты будут добавлены динамически при необходимости
const { getConversation } = require('./conversation-memory');

const demoDelay = 1500;

module.exports = async function apiChatStream(req, res) {
  try {
    // Получаем sessionId из тела запроса (или заголовков, если нужно)
    const { sessionId } = req.body || {};
    if (!sessionId) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*', // CORS-заголовок для запросов из браузера
      'X-Accel-Buffering': 'no'
    });

    res.flushHeaders();

    // Обрабатываем анализ сообщения
    const message = req.body.message || req.body.text || '';
    console.log('🔍 [STREAMING] ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ НАЧАТО');
    console.log('🔍 [STREAMING] Исходное сообщение:', JSON.stringify(message));
    console.log('🔍 [STREAMING] Тип сообщения:', typeof message);
    console.log('🔍 [STREAMING] Длина сообщения:', message.length);
    console.log('🔍 [STREAMING] SessionId:', sessionId);

    const messageAnalysis = analyzeMessage(message);
    console.log('🔍 [STREAMING] Результат анализа:', JSON.stringify(messageAnalysis, null, 2));
    console.log('📝 [STREAMING] Категория:', messageAnalysis.category);
    console.log('📝 [STREAMING] Провайдеры:', messageAnalysis.providers);

    // Проверяем команду векторизации вручную
    const messageLower = message.toLowerCase();
    console.log('🔍 [STREAMING] Сообщение в нижнем регистре:', messageLower);
    const hasNuzhenVector = messageLower.includes('нужен вектор');
    console.log('🔍 [STREAMING] Содержит "нужен вектор":', hasNuzhenVector);

    // Ищем предыдущее изображение, если запрос — редактирование картинки
    let previousImage = null;
    if (messageAnalysis.category === 'image_editing' || messageAnalysis.category === 'image_edit') {
      console.log('🔍 [STREAMING] Ищем предыдущее изображение в сессии:', sessionId);

      try {
        // Загружаем историю сообщений из базы данных
        const { getSessionMessages } = require('./chat-history.ts');
        const messages = await getSessionMessages(sessionId);
        console.log('💬 [STREAMING] Загружено сообщений из БД:', messages?.length || 0);

        // Ищем последнее изображение в истории
        if (messages && messages.length > 0) {
          for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (msg.sender === 'ai' && msg.text && msg.text.includes('![')) {
              console.log('🖼️ [STREAMING] Найдено сообщение с изображением!');

              // Извлекаем URL изображения
              const imageMatch = msg.text.match(/!\[([^\]]*)\]\(([^)]+)\)/);
              if (imageMatch) {
                previousImage = {
                  description: imageMatch[1] || 'Сгенерированное изображение',
                  url: imageMatch[2],
                  fullContent: msg.text
                };
                console.log('✅ [STREAMING] Найдено изображение для редактирования:', previousImage.url);
                break;
              }
            }
          }
        }

        if (!previousImage) {
          console.log('❌ [STREAMING] Предыдущее изображение не найдено в истории БД');
        }
      } catch (error) {
        console.error('❌ [STREAMING] Ошибка при поиске изображения в БД:', error);
      }
    }

    // Проверяем команду векторизации
    const { isVectorizerCommand, handleVectorizerCommand } = require('./vectorizer-chat-integration.cjs');
    const isDirectVectorizerRequest = isVectorizerCommand(message);

    if (isDirectVectorizerRequest) {
      console.log('🎯 [STREAMING] ВЕКТОРИЗАЦИЯ: Обнаружена команда векторизации');

      try {
        const success = await handleVectorizerCommand(message, sessionId, res, previousImage);

        if (success) {
          console.log('✅ [STREAMING] Векторизация завершена успешно');
        } else {
          console.log('❌ [STREAMING] Векторизация завершена с ошибкой');
        }

      } catch (error) {
        console.error('❌ [STREAMING] Ошибка векторизации:', error);
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify({
          role: 'assistant',
          content: `❌ Ошибка при векторизации: ${error.message}`
        })}\n\n`);
      }

      res.write(`event: done\n`);
      res.write(`data: {}\n\n`);
      res.end();
      return;
    }

    // Обрабатываем редактирование изображений
    if (messageAnalysis.category === 'image_editing') {
      console.log('🎨 [STREAMING] Запуск редактирования изображения...');

      if (!previousImage || !previousImage.url) {
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ error: 'Для редактирования нужно сначала создать изображение' })}\n\n`);
        res.end();
        return;
      }

      try {
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify({ 
          role: 'assistant', 
          content: '🎨 Обрабатываю изображение...' 
        })}\n\n`);

        // Используем гибридную систему редактирования
        const { editImage } = await import('./hybrid-image-generator.js');
        const result = await editImage(previousImage.url, message);

        if (result && result.success) {
          res.write(`event: image\n`);
          res.write(`data: ${JSON.stringify({ 
            imageUrl: result.imageUrl,
            description: result.description,
            operation: result.operation
          })}\n\n`);

          res.write(`event: message\n`);
          res.write(`data: ${JSON.stringify({ 
            role: 'assistant', 
            content: `✅ ${result.description}` 
          })}\n\n`);
        } else {
          res.write(`event: error\n`);
          res.write(`data: ${JSON.stringify({ error: result?.error || 'Ошибка редактирования изображения' })}\n\n`);
        }
      } catch (editError) {
        console.error('Ошибка редактирования изображения:', editError);
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ error: 'Ошибка обработки изображения' })}\n\n`);
      }
      res.end();
      return;
    }

    // Генерируем изображение, если нужно
    if (messageAnalysis.category === 'image_generation' || messageAnalysis.category === 'image_edit') {
      try {
        const userId = `session_${sessionId}`;

        // Используем гибридную систему генерации
        const { generateImage } = await import('./hybrid-image-generator.js');
        const result = await generateImage(
          message, // используем оригинальное сообщение как промпт
          'realistic', // стиль по умолчанию
          previousImage,
          sessionId,
          userId
        );

        if (result && result.success) {
          const imageUrl = result.imageUrl;
          res.write(`event: image\n`);
          res.write(`data: ${JSON.stringify({ imageUrl })}\n\n`);
        } else {
          res.write(`event: error\n`);
          res.write(`data: ${JSON.stringify({ error: result?.error || 'Ошибка генерации изображения' })}\n\n`);
        }
      } catch (imageError) {
        console.error('Ошибка генерации изображения:', imageError);
        res.write(`event: error\n`);
        res.write(`data: ${JSON.stringify({ error: 'Ошибка генерации изображения' })}\n\n`);
      }
      res.end();
      return; // Заканчиваем работу, если это была генерация изображения
    }

    // Запускаем Python-процесс (например, для анализа или генерации текста)
    const pythonProcess = startPythonProcess(req.body);

    let isCompleted = false;
    let demoSent = false;

    // Таймаут для отправки демо-ответа, если Python долго не отвечает
    const demoTimeout = setTimeout(() => {
      if (!isCompleted && !demoSent) {
        demoSent = true;
        res.write(`event: message\n`);
        res.write(`data: ${JSON.stringify({
          role: 'assistant',
          content: 'Демо-ответ: ваш запрос обрабатывается, пожалуйста, подождите...'
        })}\n\n`);
      }
    }, demoDelay);

    pythonProcess.on('data', (chunk) => {
      try {
        const outputText = chunk.toString();
        console.log('Получен фрагмент от Python:', outputText);

        // Ищем все JSON-объекты на отдельной строке
        const lines = outputText.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);

            // Проверяем, не завершен ли ответ
            if (json.done) {
              isCompleted = true;
              clearTimeout(demoTimeout);
              res.write(`event: done\n`);
              res.write(`data: {}\n\n`);
              if (!res.writableEnded) res.end();
              return;
            }

            // Отправляем данные клиенту
            res.write(`event: message\n`);
            res.write(`data: ${JSON.stringify(json)}\n\n`);
          } catch (parseErr) {
            console.warn('Ошибка парсинга JSON из строки:', line);
          }
        }
      } catch (err) {
        console.error('Ошибка обработки данных Python:', err);
      }
    });

    pythonProcess.on('close', (code) => {
      isCompleted = true;
      clearTimeout(demoTimeout);
      if (!res.writableEnded) {
        res.write(`event: done\n`);
        res.write(`data: {}\n\n`);
        res.end();
      }
      console.log(`Python-процесс завершился с кодом ${code}`);
    });

    req.on('close', () => {
      console.log('Клиент закрыл соединение');
      if (!res.writableEnded) res.end();
      // pythonProcess уже завершен в данном контексте
    });

  } catch (error) {
    console.error('Ошибка в apiChatStream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    } else if (!res.writableEnded) {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: 'Внутренняя ошибка сервера' })}\n\n`);
      res.end();
    }
  }
};


// Заглушка функции запуска Python-процесса
function startPythonProcess(body) {
  // Здесь запускается python process, например через child_process.spawn
  // Пример:
  // const { spawn } = require('child_process');
  // const py = spawn('python3', ['script.py']);
  // py.stdin.write(JSON.stringify(body));
  // py.stdin.end();
  // return py;

  // Для примера вернем EventEmitter заглушку (замени на реальный процесс)
  const { EventEmitter } = require('events');
  const emitter = new EventEmitter();

  // Через 2 секунды отправим "завершение"
  setTimeout(() => {
    emitter.emit('close', 0);
  }, 2000);

  // Имитация данных — отправим JSON-строки через setTimeout
  setTimeout(() => {
    emitter.emit('data', Buffer.from(JSON.stringify({ role: 'assistant', content: 'Привет от Python!' }) + '\n'));
  }, 500);

  return emitter;
}