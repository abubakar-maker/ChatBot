 import express from 'express'
import Chat from '../models/chat.js'

const router = express.Router()
router.post('/save',async (req,res) => {
    try {
        const {userId,message} = req.body;
        const chat = new Chat({
            userId,
            message,
        })
        await chat.save()
        res.json(chat)
    } catch (error) {
         res.status(500).json({ message: "Error saving chat" });
    }

})
router.post('/save/:id', async (req, res) => {
  try {
    const { messages } = req.body;
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // Append new messages
    chat.message.push(...messages);
    await chat.save();

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: "Error updating chat" });
  }
});

router.delete("/:id", async(req,res)=> {
    try {
        await Chat.findByIdAndDelete(req.params.id)
        res.json({message:"chat Deleted"})
    } catch (error) {
            res.status(500).json({ message: "Delete failed" });
    }
})

router.get("/user/:id",async (req,res) => {
    try {
        const chats =  await Chat.find({userId:req.params.id}).sort({createdAt:-1})
        res.json(chats)
    } catch (error) {
        res.status(500).json({ message: "Error fetching chats" });
    }    
})

export default router
