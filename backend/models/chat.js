import mongoose from "mongoose";
const chatSchema = new mongoose.Schema({
 
userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"UserAuth",
    required:true
},

    message:[{
         text:String,
        sender:String,
    },
]
},{timestamps:true})
const Chat = mongoose.model("Chat",chatSchema)
export default Chat