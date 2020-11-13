const MongoClient = require('mongodb').MongoClient;

const LIMIT_RECORDS = 10;
class Database {
    constructor(url, dbname) {
        this._instance = new MongoClient(url);
        this._dbname = dbname;
        this._client = null;
        this._db = null;
        this._connected = false;
    }

    async getDB() {
        if (this._connected) return this._db;
        this._client = await this._instance.connect()
        this._db = this._client.db(this._dbname);
        this._connected = true;
        return this._db;
    }

    async searchItems(query) {
        const db = await this.getDB();
        return db.collection('items').find({
            $text: { $search: '"' + query + '"' }
        }).limit(LIMIT_RECORDS).toArray();
    }

}

module.exports = Database;