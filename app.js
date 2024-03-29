const express = require('express')
const app = express()
const initializeDatabases = require('./conn')
const routes = require('./routes')
const sanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const cors = require('cors')
const port = process.env.PORT || 3000;

app.use(cors())
app.use(sanitize())
app.use(helmet())

initializeDatabases().then(db => {

    routes(app, db).listen(port, () => console.log('Listening on port 3000'));

}).catch(err => {
    console.error('Failed to make all database connections!')
    console.error(err)
    process.exit(1)
})
