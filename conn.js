const MongoClient = require('mongodb').MongoClient;
const PROD_URI = "<:connection string>";

function connect(uri) {

    return MongoClient
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, })
    .then(client => client.db('ads'))
    .catch(err => console.log(err))
}

module.exports = async function() {

    return await connect(PROD_URI);
}