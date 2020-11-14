const fetch = require('node-fetch');
const moment = require('moment');
const { tierValueMaterial } = require('../resources');
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

function calculateRefine(tierValue, quantity, percentage) {
    //calcula el porcentaje
    const percent = (percentage - 1.1) / 100;
    //calcula el material a utilizar sin devolucion
    const material = Math.round(quantity * tierValue);
    //calcula la devolucion por el porcentaje.
    const devolution = Math.round(material * percent);
    //calcula material con devolucion
    const materialNeed = material - devolution;
    //calcula la cantidad de material del tier anterior
    const materialBefore = quantity - Math.round(quantity * percent);

    return { materialNeed, materialBefore };
}

function generateMessageRefine(tier, material, percentage) {
    const tierIterations = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
    const tierValueIndex = tierIterations.findIndex(v => v === tier);

    const main = `<pre>Tier:${tier} Cantidad Material:${material} Porcentaje:${percentage}% </pre>\n\n`;
    let materialRaw = 'Material Bruto\n';
    let materialProcceced = 'Material Procesado\n';

    let tmpMaterial = material;
    for (var i = tierValueIndex; i >= 0; i--) {
        const tierValue = tierValueMaterial[tierIterations[i]];
        const resultRefine = calculateRefine(tierValue, tmpMaterial, percentage);

        materialRaw += `<b>Tier: </b>${i+ 2}\t ${resultRefine.materialNeed}\n`;
        
        if (i != 0) {
            materialProcceced += `<b>Tier: </b>${i+ 1}\t ${resultRefine.materialBefore}\n`;
        }
        tmpMaterial = resultRefine.materialBefore;
    }

    return `${main}${materialRaw}\n${materialProcceced}`;
}

module.exports = { parseItem, thumbnailItem, fetchDataMarket, groupDataMarket, generateMessage, generateMessageRefine };