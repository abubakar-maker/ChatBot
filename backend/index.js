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
const port = process.env.PORT || 3000;

// 1. Middleware
app.use(express.json())
// IMPORTANT: Update this to your Vercel Frontend URL later for security
app.use(cors()) 

// 2. Routes
app.use('/bot/v1/api/auth', userRouter);
app.use("/bot/v1", chatBotRoutes)
app.use("/bot/v1/api/auth/chat", chatRoutes)

// 3. Optimized Database Connection for Serverless
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return; // Use existing connection
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");
    } catch (error) {
        console.log("Error connecting to MongoDB", error);
    }
};

// 4. Wrap the listener for Local Development only
if (process.env.NODE_ENV !== 'production') {
    connectDB(); // Connect immediately in dev mode
    app.listen(port, () => {
        console.log(`Server is listening on port http://localhost:${port}`);
    });
}

// 5. Middleware to ensure DB is connected for every request on Vercel
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// 6. CRITICAL: Export for Vercel
export default app;