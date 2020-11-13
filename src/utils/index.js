const fetch = require('node-fetch');
const moment = require('moment');

function parseItem(rawData) {
    const lang = 'ES-ES';

    return {
        'id': rawData['Index'],
        'name': rawData['LocalizedNames'][lang],
        'description': rawData['LocalizedDescriptions'][lang],
        'key': rawData['UniqueName'],
    }
}

function thumbnailItem(itemKey) {
    return `https://albiononline2d.ams3.cdn.digitaloceanspaces.com/thumbnails/orig/${itemKey}`;
}

async function fetchDataMarket(uniqueKeys) {
    const keys = encodeURIComponent(uniqueKeys.join(','));
    const locations = encodeURIComponent('Bridgewatch,Caerleon,Fort Sterling,Lymhurst,Martlock,Thetford');
    const urlApi = `https://www.albion-online-data.com/api/v2/stats/Prices/${keys}?locations=${locations}`;
    return fetch(urlApi).then(res => res.json());
}

function groupDataMarket(items, dataMarket) {
    const data = {};
    const newItems = [];
    for (const item of dataMarket) {
        if (item.item_id in data) {
            data[item.item_id].push(item);
        } else {
            data[item.item_id] = [item];
        }
    }

    for (const item of items) {
        const market = data[item.key];
        if (market) {
            newItems.push({ ...item, market });
        }
    }

    return newItems;
}

function generateMessage(dataItem) {
    let textMarket = '<b>Market</b>\n';
    if ('market' in dataItem) {
        for (const dataM of dataItem.market) {
            const dateSell = moment(dataM.sell_price_max_date).format("YYYY/MM/DD h:mm a");
            const dateBuy = moment(dataM.buy_price_max_date).format("YYYY/MM/DD h:mm a");
            textMarket += `🏠 ${dataM.city}\nSell Price:  Min: ${dataM.sell_price_min}  Max: ${dataM.sell_price_max} 🕔 ${dateSell}\nBuy Price:  Min: ${dataM.buy_price_min}  Max: ${dataM.buy_price_max} 🕔 ${dateBuy}\n\n`;
        }
    }
    return `<b>${dataItem.name}</b>\n${dataItem.description}\n\n${textMarket}`;
}

module.exports = { parseItem, thumbnailItem, fetchDataMarket, groupDataMarket, generateMessage };