import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import chatBotRoutes from './routes/chatBot.route.js'
import chatRoutes from './routes/chatRoute.js'
import cors from 'cors'
import userRouter from './routes/userRoutes.js';

const app = express();
dotenv.config()
const port = process.env.PORT || 3000;

//Middleware....

app.use(express.json())
app.use(cors())

app.use('/bot/v1/api/auth', userRouter);
app.use("/bot/v1", chatBotRoutes)
app.use("/bot/v1/api/auth/chat",chatRoutes)
// DATABASE CONNECTION 
mongoose.connect(process.env.MONGO_URI)
.then(()=> {
    console.log("Coonected to  mongoDb");
    
}).catch((error)=> {
    console.log("error connecting to MONGODB",error);
    
})


app.listen(port,()=> {
    console.log(`Server is listning on port http://localhost:${port}`);
    
})