import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3003

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// API routes will be added here
app.get('/api', (req, res) => {
  res.json({ message: 'Café Coworking Platform API' })
})

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`)
})