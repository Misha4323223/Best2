import { useState, useRef, useEffect } from "react";
import BooomerangsLogo from "@/components/BooomerangsLogo";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Функция для получения иконки провайдера в метаданных
const getProviderIcon = (provider?: string) => {
  const providerName = provider?.toLowerCase() || '';

  switch(providerName) {
    case 'deepspeek':
      return <span className="mr-1">👨‍💻</span>;
    case 'claude':
    case 'anthropic':
      return <span className="mr-1">🪃</span>;
    case 'chatfree':
      return <span className="mr-1">💬</span>;
    case 'deepinfra':
      return <span className="mr-1">🧠</span>;
    case 'qwen':
    case 'aitianhu':
      return <span className="mr-1">🚀</span>;
    case 'ollama':
      return <span className="mr-1">🦙</span>;
    case 'phind':
      return <span className="mr-1">📚</span>;
    default:
      return <span className="mr-1">🪃</span>;
  }
};

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  provider?: string;
  model?: string;
}

export default function SmartChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [showAuth, setShowAuth] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const savedUsername = localStorage.getItem('chat_username');
    if (savedUsername) {
      setUsername(savedUsername);
      setShowAuth(false);
    }
  }, []);

  const handleAuth = (name: string) => {
    setUsername(name);
    setShowAuth(false);
    localStorage.setItem('chat_username', name);

    // Добавляем приветственное сообщение
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: `Привет, ${name}! Я BOOOMERANGS AI с продвинутой системой чекпоинтов. Теперь могу работать без ограничений и сохранять каждый шаг нашей работы. Чем могу помочь?`,
      isUser: false,
      timestamp: new Date(),
      status: 'sent',
      provider: 'booomerangs',
      model: 'advanced-checkpoint'
    };

    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          username: username,
          useCheckpoints: true
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || 'Извините, не удалось получить ответ.',
        isUser: false,
        timestamp: new Date(),
        status: 'sent',
        provider: data.provider || 'smart-ai',
        model: data.model || 'checkpoint-enabled'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Извините, произошла ошибка при отправке сообщения. Пожалуйста, попробуйте снова.',
        isUser: false,
        timestamp: new Date(),
        status: 'error'
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const logout = () => {
    setShowAuth(true);
    setUsername("");
    setMessages([]);
    localStorage.removeItem('chat_username');
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <BooomerangsLogo className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">BOOOMERANGS Smart AI</h1>
            <p className="text-gray-600">Продвинутый чат с системой чекпоинтов</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            const name = formData.get('username') as string;
            if (name.trim()) {
              handleAuth(name.trim());
            }
          }}>
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Введите ваше имя
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ваше имя..."
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Начать чат
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BooomerangsLogo />
            <div>
              <h1 className="text-xl font-semibold text-gray-800">BOOOMERANGS Smart AI</h1>
              <p className="text-sm text-gray-600">Пользователь: {username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a 
              href="/checkpoints" 
              className="px-4 py-2 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
            >
              Чекпоинты
            </a>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg h-[calc(100vh-200px)] flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : message.status === 'error'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {!message.isUser && message.provider && (
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      {getProviderIcon(message.provider)}
                      <span>{message.provider}</span>
                      {message.model && <span className="ml-1">({message.model})</span>}
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none">
                    {message.isUser ? (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </ReactMarkdown>
                    )}
                  </div>

                  <div className={`text-xs mt-2 ${
                    message.isUser ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-4 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600">Печатает...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Поле ввода */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex space-x-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напишите сообщение..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
              >
                {isLoading ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}