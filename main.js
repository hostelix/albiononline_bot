const TelegramBot = require('node-telegram-bot-api');
const Database = require('./src/database/index');
const { locations } = require('./src/resources');
const { parseItem, thumbnailItem, fetchDataMarket, groupDataMarket, generateMessage, generateMessageRefine } = require('./src/utils');

// config env vars
require('dotenv').config();


const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

const db = new Database(process.env.MONGODB_URI, process.env.DATABASE_NAME);

bot.onText(/\/locations/, (message) => {
    const chatId = message.chat.id;
    console.log(message);
    let msg = '<b>Locations:</b>\n';

    Object.keys(locations).forEach(key => {
        msg += `<pre>${key} => ${locations[key]}</pre>\n`;
    });

    bot.sendMessage(chatId, msg, { parse_mode: 'HTML' });
});

bot.onText(/\/sell/, (message) => {
    const chatId = message.chat.id;
    console.log(message);
    let msg = '<b>Locations:</b>\n';

    Object.keys(locations).forEach(key => {
        msg += `<pre>${key} => ${locations[key]}</pre>\n`;
    });

    bot.sendMessage(chatId, msg, { parse_mode: 'HTML' });
});

bot.onText(/\/buy/, (message) => {
    const chatId = message.chat.id;
    console.log(message);
    let msg = '<b>Locations:</b>\n';

    Object.keys(locations).forEach(key => {
        msg += `<pre>${key} => ${locations[key]}</pre>\n`;
    });

    bot.sendMessage(chatId, msg, { parse_mode: 'HTML' });
});


bot.onText(/\/refine/, (message) => {
    const { text } = message;
    const chatId = message.chat.id;

    const splitCommand = text.split(' ');
    // format: T2*100%36.7
    if (splitCommand.length === 2) {
        const params = splitCommand[1];

        const regex = /(T[2-8])\*(\d+)%(\d+(\.?\d+)?)/;

        // groups[0] = input
        // groups[1] = tier
        // groups[2] = quantity material
        // groups[3] = percentage
        const groups = params.match(regex);

        if (groups != null) {
            const [, tier, quantity, percentage] = groups;

            const msg = generateMessageRefine(tier, Number(quantity), Number(percentage));
            bot.sendMessage(chatId, msg, { parse_mode: 'HTML' });
        }
    }
});


bot.on('inline_query', async (message) => {
    const { id, query } = message;

    const regex = /(\w+)@([^]+)/;

    const groups = query.match(regex);

    if (groups != null) {

        const [, action, params] = groups;
        let answer = [];

        if (action === 'refine') {

            const regex = /(T[2-8])\*(\d+)%(\d+(\.?\d+)?)/;

            // groups[0] = input
            // groups[1] = tier
            // groups[2] = quantity material
            // groups[3] = percentage
            const groups = params.match(regex);

            if (groups != null) {
                const [, tier, quantity, percentage] = groups;

                const msg = generateMessageRefine(tier, Number(quantity), Number(percentage));
                // bot.sendMessage(chatId, msg, { parse_mode: 'HTML' });

                answer.push({
                    type: 'article',
                    id: params,
                    title: params,
                    description: params,
                    input_message_content: {
                        parse_mode: 'HTML',
                        message_text: msg,
                    },
                });
            }
        }
        else if (action === 'market') {
            const results = await db.searchItems(params);
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
                    title: 'Not found',
                    description: 'Not found',
                    input_message_content: {
                        message_text: 'Not found',
                    },
                })
            }

        } else {

        }
        bot.answerInlineQuery(id, answer, {
            cache_time: 120,
        });
    }
});


bot.on('polling_error', (error) => {
    console.log(error);
});