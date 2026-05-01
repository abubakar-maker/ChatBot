import Bot from "../models/bot.model.js";
import User from "../models/user.model.js";
import { getWeather } from "../utils/weatherApi.js";
import { Groq } from "groq-sdk";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const userMemory = {};
const MAX_HISTORY = 20;

function getMemory(userId) {
  if (!userMemory[userId]) userMemory[userId] = { name: null, history: [] };
  return userMemory[userId];
}

function pushToHistory(userId, role, content) {
  const mem = getMemory(userId);
  mem.history.push({ role, content });
  if (mem.history.length > MAX_HISTORY) mem.history = mem.history.slice(-MAX_HISTORY);
}

/* ── Image generation helper ── */
async function generateImage(prompt) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token     = process.env.CLOUDFLARE_API_TOKEN;
  const model     = process.env.CLOUDFLARE_IMAGE_MODEL || "@cf/stabilityai/stable-diffusion-xl-base-1.0";

  if (!accountId || !token) {
    throw new Error("Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env");
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;

  console.log(`🖼️  Generating image via Cloudflare: ${url}`);
  const cleanPrompt = prompt.replace(/(generate image|draw|create image|image of|show me a picture of|make an image)/gi, "").trim();

  const response = await axios.post(
    url,
    { prompt: cleanPrompt || prompt },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      responseType: "arraybuffer",
      timeout: 60000,
    }
  );

  const base64 = Buffer.from(response.data, "binary").toString("base64");
  return `data:image/png;base64,${base64}`;
}

/* ═══════════════════════════════════════════
   MAIN MESSAGE HANDLER
═══════════════════════════════════════════ */
export const Message = async (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: "Text cannot be empty" });

    const startTime = Date.now();
    const lowerText = text.toLowerCase().trim();
    const uid       = userId || "anonymous";
    const mem       = getMemory(uid);

    const userSavePromise = User.create({ sender: "user", text });

    /* ── 1. IMPROVED IMAGE TRIGGER ──────────────────── */
    // We check if the message STARTS with these words to avoid accidental triggers
    const imageCommands = ["generate image", "draw", "create image", "make an image"];
    const isExplicitCommand = imageCommands.some(cmd => lowerText.startsWith(cmd));
    
    // We only trigger "image of" if it's at the start or follows "a" or "an"
    const isDescriptionRequest = lowerText.startsWith("image of") || lowerText.startsWith("picture of");

    if (isExplicitCommand || isDescriptionRequest) {
      console.log("🎨 Image generation triggered");
      try {
        const base64Image = await generateImage(text);

        pushToHistory(uid, "user", text);
        pushToHistory(uid, "assistant", "[Generated Image]");
        await userSavePromise;

        res.status(200).json({
          userMessage: text,
          botMessage:  base64Image,
          isImage:     true,
        });

        return Bot.create({ text: "Sent an AI generated image." });

      } catch (imgError) {
        console.error("❌ Image generation failed:", imgError.message);
        const fallback = "I tried to generate that image but hit an error. 🖼️\n\n💬 Want me to describe what it would look like instead?";
        await userSavePromise;
        return res.status(200).json({ userMessage: text, botMessage: fallback, isImage: false });
      }
    }

    /* ── 2. NAME TRIGGER ──────────────────────── */
    if (lowerText.includes("my name is")) {
      const name = text.split(/my name is/i)[1]?.trim().split(/[.!?,]/)[0].trim();
      if (name) {
        mem.name = name;
        const reply = `Nice to meet you, **${name}**! 👋\n\n💬 Want me to remember anything else?`;
        pushToHistory(uid, "user", text);
        pushToHistory(uid, "assistant", reply);
        await userSavePromise;
        res.json({ userMessage: text, botMessage: reply, isImage: false });
        return Bot.create({ text: reply });
      }
    }

    /* ── 3. WEATHER TRIGGER ───────────────────── */
    if (lowerText.includes("weather")) {
      const city = lowerText.includes(" in ")
        ? lowerText.split(" in ")[1].replace(/[?!.,]/g, "").trim()
        : "Lalamusa";
      const weatherReply = await getWeather(city);
      pushToHistory(uid, "user", text);
      pushToHistory(uid, "assistant", weatherReply);
      await userSavePromise;
      res.json({ userMessage: text, botMessage: weatherReply, isImage: false });
      return Bot.create({ text: weatherReply });
    }

    /* ── 4. GROQ AI (LLaMA) ──────────────────── */
    try {
      const systemPrompt = [
        "You are BotSpoof, a smart AI assistant created by Abubakar.",
        mem.name ? `The user's name is ${mem.name}.` : "",
        "FORMAT RULES:",
        "1. Short answers (2-5 sentences).",
        "2. End with a follow-up starting with 💬",
        "3. Use **bold** and bullet points.",
      ].filter(Boolean).join(" ");

      const msgs = [
        { role: "system", content: systemPrompt },
        ...mem.history,
        { role: "user", content: text },
      ];

      const [completion] = await Promise.all([
        groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: msgs,
          temperature: 0.7,
          max_tokens: 400,
        }),
        userSavePromise,
      ]);

      const botResponse = completion.choices[0]?.message?.content?.trim() || "I'm thinking… try again.";

      pushToHistory(uid, "user", text);
      pushToHistory(uid, "assistant", botResponse);

      const elapsed = Date.now() - startTime;
      if (elapsed < 1200) await sleep(1200 - elapsed);

      res.status(200).json({ userMessage: text, botMessage: botResponse, isImage: false });
      Bot.create({ text: botResponse }).catch(e => console.error("DB save:", e));

    } catch (aiError) {
      console.error("Groq error:", aiError);
      res.status(200).json({ userMessage: text, botMessage: "Brain freeze! 🧊 Try again.", isImage: false });
    }

  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const testImage = async (req, res) => {
  try {
    const base64Image = await generateImage("a cute robot waving hello");
    res.status(200).json({ success: true, botMessage: base64Image, isImage: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};