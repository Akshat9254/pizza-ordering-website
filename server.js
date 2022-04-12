const express = require('express')
const mongoose = require('mongoose')
const path = require('path')

const routes = require('./routes')

const { APP_PORT, DB_URL } = require('./config')
const { errorHandler } = require('./middlewares')

 
const app = express()

//db connection
mongoose.connect(DB_URL, { useNewUrlParser : true, useUnifiedTopology : true })
const db = mongoose.connection
db.on('error', console.error.bind(console, 'connertion error...'))
db.once('open', () => {
    console.log('db connected...')
})

global.appRoot = path.resolve(__dirname)

app.use(express.urlencoded({ extended : false }))
app.use(express.json())

app.use('/api', routes)
app.use('/uploads', express.static('uploads'))

app.use(errorHandler)

app.listen(APP_PORT, () => {
    console.log(`server listening at ${APP_PORT}`)
})