import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';

// Route Imports
import chatBotRoutes from './routes/chatBot.route.js';
import chatRoutes from './routes/chatRoute.js';
import userRouter from './routes/userRoutes.js';

// Initialization
dotenv.config();
const app = express();

// Use the port from .env (4002) or default to 3000
const port = process.env.PORT || 4000;

// 1. Middleware
app.use(express.json());

// Updated CORS to handle your local React dev server and old production links
app.use(cors({
    origin: ["http://localhost:5173","http://192.168.0.113:5173", "https://chatbote.up.railway.app"], 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// 2. Health Check Route
app.get("/", (req, res) => {
    res.json({ 
        status: "Backend is running!", 
        message: "BotSpoof API is live locally on port " + port 
    });
});

// 3. API Routes
// Auth & User Management
app.use('/bot/v1/api/auth', userRouter);

// Chatbot Logic (The one you are currently debugging)
app.use("/bot/v1", chatBotRoutes);

// Saved Chats / History
app.use("/bot/v1/api/auth/chat", chatRoutes);

// 4. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((error) => console.log("❌ Error connecting to MongoDB:", error));

// 5. Server Listener
// Using '0.0.0.0' allows connectivity across your local network and hosting services
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is running on: http://localhost:${port}`);
    console.log(`📡 Local API Endpoint: http://localhost:${port}/bot/v1`);
});