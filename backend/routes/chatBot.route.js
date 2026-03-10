import express from 'express'
import { Message } from '../controllers/chatBot.message.js'

const router = express.Router()

router.post("/message", Message)

export default router