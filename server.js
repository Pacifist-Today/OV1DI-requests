// Импортируем необходимые модули
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cors = require('cors');

// Инициализируем Express приложение
const app = express();
const PORT = process.env.PORT || 3000;

// Получаем токен бота и ID чата из переменных окружения для безопасности
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Настройка Middleware
app.use(cors()); // Включаем Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Парсим JSON-тела запросов
app.use(bodyParser.urlencoded({ extended: true })); // Парсим URL-encoded тела запросов

// --- МАРШРУТЫ ---

// Корневой маршрут для проверки "здоровья" сервера сервисом UptimeRobot
app.get('/', (req, res) => {
  res.status(200).send('Сервер запущен и готов принимать заявки.');
});

// Маршрут для обработки отправки формы с лендинга
app.post('/submit', async (req, res) => {
  // Проверяем, настроены ли секретные ключи
  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('BOT_TOKEN или CHAT_ID не настроены.');
    return res.status(500).json({ success: false, message: 'Ошибка конфигурации сервера.' });
  }

  // Извлекаем данные из тела запроса
  const { name, contact, project } = req.body;

  // Базовая валидация
  if (!name || !contact || !project) {
    return res.status(400).json({ success: false, message: 'Все поля обязательны для заполнения.' });
  }

  // Форматируем сообщение для отправки в Telegram
  // Используем Markdown для красивого форматирования
  const messageText = `
*Новая заявка с лендинга OV1DI!* 🚀

*Имя:* ${name}
*Контакт (Email/Telegram):* ${contact}

*О проекте:*
${project}
  `;

  // URL для отправки сообщений через Telegram Bot API
  const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    // Отправляем сообщение в чат Telegram
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown', // Используем Markdown
      }),
    });

    const responseData = await response.json();

    if (responseData.ok) {
      // Если сообщение успешно отправлено
      console.log('Заявка успешно отправлена в Telegram.');
      res.status(200).json({ success: true, message: 'Ваша заявка была успешно отправлена!' });
    } else {
      // Если Telegram API вернул ошибку
      console.error('Ошибка Telegram API:', responseData);
      res.status(500).json({ success: false, message: 'Не удалось отправить сообщение в Telegram.' });
    }
  } catch (error) {
    // Если произошла сетевая или другая ошибка
    console.error('Ошибка при отправке запроса в Telegram:', error);
    res.status(500).json({ success: false, message: 'Произошла внутренняя ошибка сервера.' });
  }
});

// Запускаем сервер
app.listen(PORT, () => {
  console.log(`Сервер слушает порт ${PORT}`);
});