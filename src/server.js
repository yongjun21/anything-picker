import express from 'express'
import compression from 'compression'
import path from 'path'
import fallback from 'express-history-api-fallback'

const app = express()

const root = path.join(__dirname, '../public')

if (process.env.NODE_ENV === 'production') app.use(compression())

app.use(express.static(root))
app.use(fallback('index.html', {root}))

const port = process.env.PORT || 8080
app.listen(port)
console.log('Listening at:', port)
