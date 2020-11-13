const TelegramBot = require('node-telegram-bot-api');
const Database = require('./src/database/index');
const { parseItem, thumbnailItem, fetchDataMarket, groupDataMarket, generateMessage } = require('./src/utils');

// config env vars
require('dotenv').config();


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const db = new Database(process.env.MONGODB_URI, process.env.DATABASE_NAME);

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Received your message');
});


bot.on('inline_query', async (message) => {
    const { id, query } = message;
    const results = await db.searchItems(query);

    let answer = [];
    if (results.length > 0) {
        const dataParsed = results.map(parseItem);
        const keys = dataParsed.map(item => item.key)
        const dataMarket = await fetchDataMarket(keys);

        const dataWithMarket = groupDataMarket(dataParsed, dataMarket);
        console.log(dataWithMarket);
        answer = dataWithMarket.map(item => {
            return {
                type: 'article',
                id: item.id,
                title: item.name,
                description: item.description,
                input_message_content: {
                    parse_mode: 'HTML',
                    message_text: generateMessage(item),
                },
                thumb_url: thumbnailItem(item.key),
            };
        });
    } else {
        answer.push({
            type: 'article',
            id: '100000',
            title: 'Item not found',
            description: 'Not found',
            input_message_content: {
                message_text: 'Not found',
            },
            reply_markup: {
                inline_keyboard: [
                    [{ text: "text", callback_data: "hola" }]
                ]
            }
        })
    }
    bot.answerInlineQuery(id, answer, {
        cache_time: 120,
    });
});
