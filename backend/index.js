// import express from 'express'
// import dotenv from 'dotenv'
// import mongoose from 'mongoose';
// import chatBotRoutes from './routes/chatBot.route.js'
// import chatRoutes from './routes/chatRoute.js'
// import cors from 'cors'
// import userRouter from './routes/userRoutes.js';

// const app = express();
// dotenv.config()
// const port = process.env.PORT || 3000;

// //Middleware....

// app.use(express.json())
// app.use(cors())

// app.use('/bot/v1/api/auth', userRouter);
// app.use("/bot/v1", chatBotRoutes)
// app.use("/bot/v1/api/auth/chat",chatRoutes)
// // DATABASE CONNECTION 
// mongoose.connect(process.env.MONGO_URI)
// .then(()=> {
//     console.log("Coonected to  mongoDb");
    
// }).catch((error)=> {
//     console.log("error connecting to MONGODB",error);
    
// })


// app.listen(port,()=> {
//     console.log(`Server is listning on port http://localhost:${port}`);
    
// })
import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import chatBotRoutes from './routes/chatBot.route.js'
import chatRoutes from './routes/chatRoute.js'
import cors from 'cors'
import userRouter from './routes/userRoutes.js';

dotenv.config()
const app = express();

// Railway automatically assigns a PORT; process.env.PORT is mandatory
const port = process.env.PORT || 3000;

// 1. Middleware
app.use(express.json())

// Updated CORS: Allows both local testing and your live Vercel site
app.use(cors({
    origin: ["https://chatbote.up.railway.app", "http://localhost:5173"], 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// Health Check Route (Helps Railway see the app is 'Active')
app.get("/", (req, res) => {
    res.json({ status: "Backend is running!", message: "BotSpoof API is live on Railway." });
});

// 2. Routes
app.use('/bot/v1/api/auth', userRouter);
app.use("/bot/v1", chatBotRoutes)
app.use("/bot/v1/api/auth/chat", chatRoutes)

// 3. Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => console.log("Error connecting to MongoDB", error));

// 4. Standard Listener
// '0.0.0.0' is essential for Railway to route external traffic to your app
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is listening on port ${port}`);
});