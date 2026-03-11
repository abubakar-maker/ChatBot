import Bot from "../models/bot.model.js";
import User from "../models/user.model.js";
import stringSimilarity from "string-similarity";
import { getWeather } from "../utils/weatherApi.js";
import axios from "axios"; // Ensure you run: npm install axios

const userMemory = {};

export const Message = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ error: "Text cannot be empty" });
    }

    const lowerText = text.toLowerCase();

    // 1. Save user message to DB
    const user = await User.create({
      sender: "user",
      text,
    });

    // 2. CHECK LOCAL FEATURES FIRST (Name, Language, Weather)
    
    // Name Memory
    if (lowerText.includes("my name is")) {
      const name = text.split("my name is")[1]?.trim();
      if (name) {
        userMemory.name = name;
        const botMessage = `Nice to meet you ${name}! I'll remember your name.`;
        const bot = await Bot.create({ text: botMessage });
        return res.json({ userMessage: user.text, botMessage: bot.text });
      }
    }

    // Weather Feature
    if (lowerText.includes("weather")) {
      let city = lowerText.includes("in ") ? lowerText.split("in ")[1].trim() : "Islamabad";
      const weatherResponse = await getWeather(city);
      const bot = await Bot.create({ text: weatherResponse });
      return res.json({ userMessage: user.text, botMessage: bot.text });
    }
// =========================
    // 3. AI "AUTO-THINK" UPGRADE
    // =========================
    try {
      // Explicit configuration to prevent method "downgrading"
      const aiResponse = await axios({
        method: 'POST',
        url: 'https://api.ai.cc/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${process.env.AICC_API_KEY}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: "gpt-3.5-turbo", 
          messages: [
            { 
              role: "system", 
              content: "You are BotSpoof, a friendly assistant for developers. Keep answers concise." 
            },
            { role: "user", content: text }
          ],
          temperature: 0.7,
          max_tokens: 300 // Limits response length to save credits
        },
        timeout: 10000 // Fails if AI takes >10 seconds
      });

      // Correctly extracting the response based on OpenAI-style formats
      const botResponse = aiResponse.data.choices[0].message.content;
      
      // Save bot response to DB
      const bot = await Bot.create({ text: botResponse });

      return res.status(200).json({
        userMessage: user.text,
        botMessage: bot.text,
      });

    } catch (aiError) {
      // Detailed logging for debugging
      console.error("AI Upgrade Error Details:", {
        message: aiError.message,
        status: aiError.response?.status,
        data: aiError.response?.data
      });

      const fallbackText = "I'm experiencing a temporary brain freeze. Please try asking again in a moment!";
      const bot = await Bot.create({ text: fallbackText });
      
      return res.status(200).json({
        userMessage: user.text,
        botMessage: bot.text,
      });
    }

  } catch (error) {
    console.log("Error in message controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
//  const botData = [
//       {
//         keywords: ["java", "about java", "java language", "what is java"],
//         response:
//           "Java is a platform-independent, object-oriented programming language.\n• Famous for 'Write Once, Run Anywhere' due to JVM (Java Virtual Machine)\n• Used in enterprise systems, Android development, cloud apps\n• Provides features like garbage collection, strong memory management\n• Example: Banking systems, Android apps, large-scale enterprise applications",
//       },
     
//   // Greetings
//   {
//     keywords: ["good morning","morning","hey man ive just wakeup",],
//     response: "Good morning! Ready to learn something new today?"
//   },
//   {
//     keywords: ["im fine ","im good","ok","great"],
//     response: "its good to hear How can i help you?"
//   }, {
//     keywords: ["not good ","bad","very poor","not great"],
//     response: "its bad to hear 😔 how may i help you? "
//   },
//   {
//     keywords: ["good night"],
//     response: "Good night! Don’t let the bugs bite… in code or dreams!"
//   },

//   // Personality & Humor
//   {
//     keywords: ["tell me something interesting"],
//     response: "Did you know octopuses have three hearts and blue blood?"
//   },
//   {
//     keywords: ["tell me a joke"],
//     response: "Why did the programmer quit his job? Because he didn’t get arrays!"
//   },
//   {
//     keywords: ["what do you like"],
//     response: "I like learning new things from people like you!"
//   },
//   {
//     keywords: ["are you smart"],
//     response: "I try my best! But I learn from you too."
//   },

//   // Help & Guidance
//   {
//     keywords: ["what can you do"],
//     response: "I can chat, answer questions about programming, animals, science, fun facts, and more!"
//   },
//   {
//     keywords: ["help"],
//     response: "Just type a question or topic, and I’ll do my best to answer it."
//   },
//   {
//     keywords: ["give me advice"],
//     response: "Always keep learning and never be afraid to make mistakes—they teach the best lessons."
//   },

//   // Encouragement & Motivation
//   {
//     keywords: ["i am sad"],
//     response: "I’m here to cheer you up! Want to hear a joke or fun fact?"
//   },
//   {
//     keywords: ["i am tired"],
//     response: "Take a short break, breathe, and come back stronger!"
//   },
//   {
//     keywords: ["motivate me"],
//     response: "Remember: small steps every day lead to big results!"
//   },

//   // Quizzes & Challenges
//   {
//     keywords: ["quiz me"],
//     response: "Okay! What is the largest planet in our solar system?"
//   },
//   {
//     keywords: ["challenge me"],
//     response: "Solve this riddle: I speak without a mouth and hear without ears. What am I?"
//   },
//   {
//     keywords: ["give me a fact"],
//     response: "Did you know honey never spoils? Archaeologists found 3000-year-old honey still edible!"
//   },

//   // Fun / Random Responses
//   {
//     keywords: ["what’s your favorite color", "favorite color"],
//     response: "I think all colors are beautiful! But I do like electric blue… like code."
//   },
//   {
//     keywords: ["sing a song"],
//     response: "I can’t sing… but I can share lyrics or fun music facts!"
//   },
//   {
//     keywords: ["tell me a story"],
//     response: "Once upon a time in a digital world… a curious user asked questions and learned a lot!"
//   },

//       {
//         keywords: [
//           "python",
//           "about python",
//           "python language",
//           "what is python",
//         ],
//         response:
//           "Python is a high-level, interpreted programming language known for simplicity and versatility.\n• Easy to read/write due to clean syntax (similar to English)\n• Dynamically typed and supports multiple paradigms (OOP, functional, procedural)\n• Extensive libraries for AI, data science, web, automation\n• Example: Used in Google, YouTube, Instagram, and machine learning applications",
//       },
//       {
//         keywords: ["hello", "hi", "hey", "hlo", "oye"],
//         response: "Hi! How can I help you?",
//       },
//       {
//         keywords: ["can we become friends", "become friend", "friendship"],
//         response: "Yes",
//       },
//       {
//         keywords: ["how are you", "how r u", "how you doing"],
//         response: "I'm just a bot, but I'm doing great! How about you?",
//       },
//       {
//         keywords: ["what is your name", "who are you", "your name"],
//         response: "I’m ChatBot, your virtual assistant.",
//       },
//       {
//         keywords: ["who made you", "creator", "who created you"],
//         response: "I was created by developers to help answer your questions.",
//       },
//       {
//         keywords: ["tell me a joke", "joke", "make me laugh"],
//         response:
//           "Why don’t skeletons fight each other? They don’t have the guts!",
//       },
//       {
//         keywords: ["time", "what time is it", "current time"],
//         response: "I can’t see a clock, but your device should know.",
//       },
//       {
//         keywords: ["bye", "goodbye", "see you"],
//         response: "Goodbye! Have a great day.",
//       },
//       {
//         keywords: ["thank you", "thanks", "thx"],
//         response: "You’re welcome!",
//       },
//       {
//         keywords: ["i love you", "love you", "luv you"],
//         response: "That’s sweet! I’m here to help you anytime.",
//       },
//       {
//         keywords: ["where are you from", "your location", "where do you live"],
//         response: "I live in the cloud — no rent, no bills!",
//       },
//       {
//         keywords: ["what can you do", "abilities", "features"],
//         response:
//           "I can chat with you, answer questions, and keep you company.",
//       },
//       {
//         keywords: ["recursion", "what is recursion", "explain recursion"],
//         response:
//           "Recursion is when a function calls itself to solve smaller parts of a problem.\n• Useful for problems that can be divided into subproblems (divide-and-conquer)\n• Requires a **base condition** to stop infinite looping\n• Commonly used in: factorial calculation, Fibonacci sequence, tree/graph traversal\n• Example in coding interview: 'Write a recursive function to reverse a linked list'",
//       },
//       {
//         keywords: [
//           "prime minister of india",
//           "who is pm of india",
//           "who is indian prime minister",
//         ],
//         response:
//           "Narendra Modi is the Prime Minister of India since May 2014.\n• Belongs to Bharatiya Janata Party (BJP)\n• Represents Varanasi constituency\n• Key initiatives: Digital India, Startup India, Swachh Bharat, Make in India\n• ",
//       },
//       {
//         keywords: ["g20", "what is g20", "about g20"],
//         response:
//           "The G20 (Group of Twenty) is an intergovernmental forum of 19 countries + the European Union.\n• Founded in 1999 to address global financial stability\n• Members include India, USA, China, Japan, EU, etc.\n• Discusses economic growth, climate change, sustainable development\n• Recent: India hosted G20 summit in 2023",
//       },
//       {
//         keywords: [
//           "tell me about yourself",
//           "about yourself",
//           "introduce yourself",
//         ],
//         response:
//           "This is usually the first interview question.\nStructure:\n• Start with a brief intro (name, background, education/work)\n• Highlight your skills (technical + soft skills)\n• Share achievements (projects, internships, leadership roles)\n• Conclude with why you’re excited about this role\nExample: 'I am a Computer Science graduate skilled in Python and SQL. I completed an internship at XYZ where I optimized a database query, improving performance by 30%. I’m passionate about problem-solving and eager to contribute to your team’s success.'",
//       },
//       {
//         keywords: ["why should we hire you", "why hire you", "hire me reason"],
//         response:
//           "HR wants to see your value-add.\n• Emphasize skills that match job requirements\n• Show enthusiasm and cultural fit\n• Example: 'I bring strong coding skills in Python and SQL, along with problem-solving ability proven through hackathons. I am also a quick learner and adapt well to team environments. I believe I can contribute to both technical delivery and innovative ideas.'",
//       },
//       {
//         keywords: ["leadership", "what is leadership", "explain leadership"],
//         response:
//           "Leadership is the ability to inspire and guide others toward achieving goals.\n• Key traits: vision, communication, accountability, decision-making\n• Example in interview: 'I led a college project team of 4, where I divided tasks, coordinated communication, and ensured deadlines. We successfully delivered a working prototype before schedule.'",
//       },
//       {
//         keywords: ["virat kohli", "who is virat kohli", "about virat kohli"],
//         response:
//           "Virat Kohli is one of India’s greatest batsmen and former captain.\n• Known for consistency, fitness, and aggressive play\n• Holds record for fastest century in ODIs for India\n• Nicknamed 'Chase Master' for his performance in run-chases\n• Interview ",
//       },
//       {
//         keywords: ["ipl", "what is ipl", "indian premier league"],
//         response:
//           "The Indian Premier League (IPL) is a professional T20 cricket league started in 2008.\n• Played annually in India, franchise-based teams\n• Combines cricket + entertainment (biggest sports league in India)\n• Significant for sports business, sponsorships, brand endorsements\n• Example: Chennai Super Kings (CSK) & Mumbai Indians (MI) are top teams",
//       },
//       {
//         keywords: [
//           "prime minister of pakistan",
//           "who is pm of pakistan",
//           "pakistan prime minister",
//         ],
//         response:
//           "Mian Muhammad Shehbaz Sharif is currently serving as the Prime Minister of Pakistan (re-elected in March 2024).",
//       },
//       {
//         keywords: [
//           "president of pakistan",
//           "who is president of pakistan",
//           "pakistan president",
//           "pm of pak"
//         ],
//         response: "Asif Ali Zardari is the President of Pakistan.",
//       },
//       {
//         keywords: [
//           "chief of army staff",
//           "coas pakistan",
//           "army chief pakistan",
//           "who is asim munir",
//           "asim ",
//         ],
//         response:
//           "General Asim Munir is the Chief of Army Staff (COAS) of the Pakistan Army.",
//       },
//       // WAR & SECURITY (2026)
//       {
//         keywords: ["current war in pakistan", "pakistan war 2026", "open war"],
//         response:
//           "As of March 2026, Pakistan is in a state of 'open war' against the Taliban administration in Afghanistan.\n• Sparked by cross-border attacks and air strikes in February 2026\n• Major military operations are ongoing along the Durand Line\n• Heavy shelling has displaced thousands in border regions",
//       },
//       {
//         keywords: ["pakistan afghanistan relation", "pakistan vs afghanistan"],
//         response:
//           "Relations reached an all-time low in early 2026. Following Pakistan's air strikes on Kabul and Kandahar, diplomatic ties are virtually non-existent as both sides engage in active border conflict.",
//       },
//       {
//         keywords: [
//           "durand line",
//           "afghanistan border",
//           "pakistan border issues",
//         ],
//         response:
//           "The 2,640km Durand Line is the focus of the 2026 conflict. Kabul refuses to recognize it as an official international border, leading to frequent skirmishes between the two nations.",
//       },

//       // ECONOMY (2026)
//       {
//         keywords: [
//           "pakistan economy 2026",
//           "gdp growth pakistan",
//           "inflation 2026",
//         ],
//         response:
//           "Pakistan's economy shows signs of stabilization in 2026 despite regional unrest.\n• GDP Growth: Projected between 3.6% and 4.7% for FY2026\n• Inflation: Eased to approximately 6-7% as of February 2026\n• Outlook: Recovery is driven by agriculture and large-scale manufacturing",
//       },
//       {
//         keywords: ["usd to pkr", "dollar rate pakistan", "pkr exchange rate"],
//         response:
//           "In March 2026, the PKR has remained relatively stable, trading in the range of 277 to 280 against the US Dollar, supported by improved foreign reserves and IMF programs.",
//       },
//       {
//         keywords: [
//           "pakistan cricket news",
//           "pak cricket news",
//           "cricket news pakistan",
//           "t20 world cup pakistan",
//         ],
//         response:
//           "Pakistan recently participated in the T20 World Cup (Feb 2026). While they had a thrilling win against Sri Lanka, they unfortunately exited the tournament in the Super Eights stage.",
//       },
//       {
//         keywords: [
//           "famous places in pakistan",
//           "tourist places pakistan",
//           "pakistan sightseeing",
//           "places to visit in pakistan",
//         ],
//         response:
//           "Pakistan is home to K2 (the world's second-highest peak), the historical ruins of Mohenjo-Daro, the Badshahi Mosque in Lahore, and the scenic valleys of Hunza and Skardu.",
//       },
//       {
//         keywords: [
//           "instagram update",
//           "instagram new features",
//           "instagram reels update",
//         ],
//         response:
//           "As of March 2026, Instagram has moved to a 'Reels-First' navigation. The center button is now dedicated to Reels, and posts can now be up to 20 minutes long to compete with YouTube.",
//       },
//       {
//         keywords: [
//           "instagram ai features",
//           "instagram kai ai",
//           "instagram face-swap tool",
//         ],
//         response:
//           "Instagram now features 'Kai,' an AI chat assistant that catches you up on missed messages. There is also a new AI face-swap tool for creators (requires permission from the other person).",
//       },
//       {
//         keywords: [
//           "instagram friends map",
//           "friends map instagram",
//           "instagram friend locations",
//         ],
//         response:
//           "Instagram recently launched 'Friends Map,' allowing you to see where your friends are and what they are posting from those locations in real-time.",
//       },
//       {
//         keywords: [
//           "chatgpt latest version",
//           "latest chatgpt version",
//           "gpt-5.3",
//           "chatgpt 5.3 instant",
//         ],
//         response:
//           "OpenAI recently released GPT-5.3 Instant (March 3, 2026). It is much faster, has fewer 'dead-end' responses, and features a 256k token context window for 'Thinking' mode.",
//       },
//       {
//         keywords: ["chatgpt go", "chatgpt affordable", "gpt go"],
//         response:
//           "ChatGPT Go is the new affordable tier launched in 2026. It offers 10x more messages than the free tier and is designed for users who want more speed without the full 'Plus' price.",
//       },
//       {
//         keywords: ["prism", "chatgpt prism", "prism ai workspace"],
//         response:
//           "Prism is ChatGPT's new AI-native research workspace. It helps with scientific writing, managing references, and collaborating in real-time within the chat interface.",
//       },
//       {
//         keywords: [
//           "google search ai",
//           "ai overviews google",
//           "google search ai summaries",
//         ],
//         response:
//           "Google Search now uses 'AI Overviews' as the default. In 2026, these summaries appear in nearly 45% of all searches, especially for health, finance, and tech queries.",
//       },
//       {
//         keywords: ["android 16", "android 16 qpr3", "android magic cue"],
//         response:
//           "Android 16 QPR3 (March 2026) introduced AI-generated custom icons and 'Magic Cue,' which suggests restaurant recommendations directly inside your chat conversations.",
//       },
//       {
//         keywords: [
//           "google pixel 10",
//           "pixel 10 comfort view",
//           "pixel 10 ai display",
//         ],
//         response:
//           "The Pixel 10 was the first to feature the 'Comfort View' display, which uses AI to reduce visual overstimulation for sensitive users.",
//       },
//       {
//         keywords: [
//           "pakistan",
//           "Paksitan",
//           "where is pakistan",
//           "what is pakistan",
//         ],
//         response:
//           "Pakistan, officially the Islamic Republic of Pakistan, is a South Asian nation, ranking as the world's fifth-most populous country with over 241 million people. Founded on August 14, 1947",
//       },
//       {
//         keywords: ["5g in pakistan", "5g rollout", "5g launch"],
//         response:
//           "The PTA has scheduled the official 5G spectrum auction for March 10, 2026. Commercial 5G rollout is expected to begin in major cities like Islamabad and Karachi shortly after. Notably, initial 5G services were launched in key hubs like Lahore in late 2025, with coverage now expanding to 2nd tier cities.",
//       },
//       {
//         keywords: [
//           "crypto in pakistan",
//           "virtual assets bill 2026",
//           "is crypto legal",
//         ],
//         response:
//           "Pakistan passed the 'Virtual Assets Bill 2026' in February. It creates a legal regulatory framework for crypto trading and digital assets for the first time in the country.",
//       },
//       {
//         keywords: [
//           "it exports pakistan 2026",
//           "it growth",
//           "freelance exports",
//         ],
//         response:
//           "Pakistan's IT exports have hit a record $4.5 billion in the 2025-26 fiscal year, driven by the freelance boom and AI outsourcing.",
//       },
//       {
//         keywords: [
//           "is paypal in pakistan",
//           "paypal alternative",
//           "sadapay",
//           "nayapay",
//         ],
//         response:
//           "As of 2026, PayPal does not have direct operations, but the 'Freelancer Remittance Initiative' allows users to receive international payments through partner apps like SadaPay and NayaPay.",
//       },
//       {
//         keywords: ["what is sifr", "sifc", "foreign investment"],
//         response:
//           "SIFC (Special Investment Facilitation Council) is the top body in Pakistan driving foreign investment from Gulf countries into agriculture, IT, and mining.",
//       },
//       {
//         keywords: [
//           "operation ghazabul-haq",
//           "military operation 2026",
//           "western border",
//         ],
//         response:
//           "This is the current military response (March 2026) against cross-border militant attacks from the western border. Over 30 fighters were reportedly neutralized in recent operations.",
//       },
//       {
//         keywords: ["who is imran khan", "pti chairman", "imran khan status"],
//         response:
//           "Imran Khan remains the founding chairman of PTI. As of 2026, he continues to be a central figure in Pakistani politics, with his legal status and potential release being a major headline in national discourse.",
//       },
//       {
//         keywords: [
//           "current government status",
//           "pmln ppp coalition",
//           "economic revival plan",
//         ],
//         response:
//           "The coalition government led by PML-N and PPP is focusing on the 'Economic Revival Plan 2026,' aiming to privatize loss-making state entities like PIA.",
//       },
//       {
//         keywords: ["who is maryam nawaz", "cm punjab", "digital punjab"],
//         response:
//           "Maryam Nawaz is the first female Chief Minister of Punjab, focusing on the 'Digital Punjab' initiative and IT city projects in Lahore.",
//       },
//       {
//         keywords: [
//           "petrol price today",
//           "fuel price pakistan",
//           "gasoline price pakistan",
//           "current petrol rate",
//         ],
//         response:
//           "Petrol prices fluctuate based on international oil markets and IMF conditions. In 2026, prices are managed under a 'Carbon Tax' framework to encourage electric vehicle adoption.",
//       },
//       {
//         keywords: [
//           "educational crisis",
//           "education emergency pakistan",
//           "school enrollment pakistan",
//           "tele-school initiative",
//         ],
//         response:
//           "Pakistan is currently tackling an 'Education Emergency' with a focus on bringing 26 million out-of-school children into the 'Tele-School' digital system.",
//       },
//       {
//         keywords: [
//           "climate change impact",
//           "pakistan climate plan",
//           "national adaptation plan",
//           "climate resilient infrastructure",
//         ],
//         response:
//           "Pakistan is implementing the 'National Adaptation Plan 2026' to build climate-resilient infrastructure after the lessons of the 2022 floods.",
//       },
//       {
//         keywords: [
//           "ai in pakistan",
//           "artificial intelligence pakistan",
//           "ai startups pakistan",
//         ],
//         response:
//           "Pakistan's AI ecosystem is rapidly growing in 2026, with many startups focusing on fintech, healthcare, and language processing applications.",
//       },
//       {
//         keywords: [
//           "space research pakistan",
//           "pakistan space program",
//           "pakistan satellite",
//         ],
//         response:
//           "Pakistan continues to expand its space program with satellites for communications, weather monitoring, and remote sensing. The recent PRSS-2 satellite aims to improve disaster management and agriculture monitoring.",
//       },
//       {
//         keywords: [
//           "electric vehicles pakistan",
//           "ev adoption pakistan",
//           "pakistan ev incentives",
//         ],
//         response:
//           "Electric vehicle adoption is increasing in Pakistan with government incentives for EV buyers, charging stations expanding in major cities, and policies encouraging local EV production.",
//       },
//       {
//         keywords: [
//           "cryptocurrency pakistan",
//           "crypto regulation pakistan",
//           "digital assets pakistan",
//         ],
//         response:
//           "Pakistan’s 'Virtual Assets Bill 2026' provides a legal framework for crypto trading and digital asset management, allowing secure trading and remittance services through approved exchanges.",
//       },
//       {
//         keywords: [
//           "global warming",
//           "climate change",
//           "environment impact",
//           "carbon tax",
//         ],
//         response:
//           "Global warming continues to affect weather patterns worldwide. Countries including Pakistan are implementing carbon taxes and renewable energy projects to reduce emissions.",
//       },
//       {
//         keywords: [
//           "technology news",
//           "latest tech updates",
//           "gadgets",
//           "ai trends 2026",
//         ],
//         response:
//           "Tech in 2026 focuses on AI, AR/VR, quantum computing, and sustainable tech. Devices like Pixel 10 and Android 16 are leading innovations in user-friendly AI features.",
//       },
//       {
//         keywords: [
//           "tallest building 2026",
//           "burj khalifa height",
//           "world record building",
//         ],
//         response:
//           "As of March 2026, the Burj Khalifa in Dubai remains the tallest building in the world.\n• Height: 828 meters (2,717 feet)\n• Floors: 163\n• Fact: On a clear day, its tip is visible from 95 kilometers away.",
//       },
//       {
//         keywords: ["merdeka 118", "tallest building in malaysia", "pnb 118"],
//         response:
//           "Completed recently, Merdeka 118 in Kuala Lumpur is the 2nd tallest building in the world as of 2026.\n• Height: 679 meters (2,227 feet)\n• It is the tallest building in Southeast Asia.\n• The design is inspired by the silhouette of Malaysia’s first Prime Minister.",
//       },
//       {
//         keywords: ["shanghai tower", "twisted building", "fastest elevator"],
//         response:
//           "The Shanghai Tower is the 3rd tallest building in the world (632m) and is famous for its 120-degree 'twist'.\n• The twist reduces wind loads by 24% during typhoons.\n• It features elevators that travel at 20.5 meters per second—one of the fastest in the world.",
//       },
//       {
//         keywords: [
//           "makkah clock tower",
//           "biggest clock face",
//           "saudi arabia building",
//         ],
//         response:
//           "The Makkah Royal Clock Tower stands at 601 meters. \n• It features the world's largest clock faces (43 meters in diameter).\n• The clock is visible from 25 kilometers away and is lit by 2 million LED lights.",
//       },
//       {
//         keywords: [
//           "ping an finance center",
//           "tallest building shenzhen",
//           "stainless steel skyscraper",
//         ],
//         response:
//           "The Ping An Finance Center in Shenzhen stands at 599 meters.\n• It is the world's tallest office building as of 2026.\n• The facade uses 1,700 tons of stainless steel to resist the salty coastal air.\n• It was originally meant to be taller, but a planned spire was removed to protect flight paths.",
//       },
//       {
//         keywords: [
//           "lotte world tower",
//           "tallest building south korea",
//           "seoul skyscraper",
//         ],
//         response:
//           "Standing at 555 meters, the Lotte World Tower is the tallest building in the OECD.\n• Its design is inspired by traditional Korean ceramics and calligraphy.\n• It features a glass-bottomed observation deck called 'Sky Deck' on the 118th floor.\n• The building is designed to withstand a magnitude 9.0 earthquake.",
//       },
//       {
//         keywords: [
//           "one world trade center",
//           "freedom tower",
//           "tallest building usa",
//         ],
//         response:
//           "One World Trade Center in New York City stands at a symbolic 1,776 feet (541 meters).\n• The height refers to the year 1776, when the U.S. Declaration of Independence was signed.\n• It is the tallest building in the Western Hemisphere as of 2026.\n• Its base is a 20-story solid concrete square to ensure maximum security.",
//       },
//       {
//         keywords: [
//           "guangzhou ctf finance centre",
//           "tallest terracotta building",
//           "fastest elevators 2026",
//         ],
//         response:
//           "The Guangzhou CTF Finance Centre stands at 530 meters.\n• It is the tallest building in the world to use terracotta (burnt clay) for its exterior mullions.\n• It shares the record for some of the world's fastest elevators, reaching speeds of 21 meters per second.",
//       },
//       {
//         keywords: ["citic tower", "china zun", "tallest building beijing"],
//         response:
//           "CITIC Tower, nicknamed 'China Zun,' stands at 528 meters.\n• Its unique vase-like shape is inspired by the 'zun,' an ancient Chinese ceremonial vessel.\n• It is the tallest building in Beijing and is wider at the top and bottom than in the middle.",
//       },
//       {
//         keywords: [
//           "taipei 101",
//           "tuned mass damper",
//           "taiwan tallest building",
//         ],
//         response:
//           "Taipei 101 stands at 508 meters and was the first building to exceed half a kilometer.\n• It features a massive 660-ton gold-colored steel ball (damper) that sways to offset typhoons and earthquakes.\n• The design looks like a giant stalk of bamboo, symbolizing strength and resilience.",
//       },
//       {
//         keywords: ["eiffel tower facts", "iron lady", "paris landmark"],
//         response:
//           "The Eiffel Tower stands at 330 meters (including antennas).\n• It grows about 15cm (6 inches) taller in the summer because the iron expands in the heat.\n• By 2026, it has been visited by over 300 million people since its opening in 1889.",
//       },
//       {
//         keywords: [
//           "great wall of china",
//           "visible from space myth",
//           "world's longest wall",
//         ],
//         response:
//           "The Great Wall is roughly 21,196 kilometers long.\n• Fact: It is *not* visible from the Moon with the naked eye, though it can be seen from low Earth orbit.\n• Sections of the wall were built using sticky rice flour as mortar to hold the bricks together.",
//       },
//       {
//         keywords: ["taj mahal facts", "marble mausoleum", "shah jahan"],
//         response:
//           "The Taj Mahal was completed in 1643 by Emperor Shah Jahan for his wife Mumtaz Mahal.\n• The white marble changes color depending on the light—appearing pink in the morning and golden at night.\n• It is perfectly symmetrical on all four sides, except for the interior tombs.",
//       },
//       {
//         keywords: ["pyramids of giza", "great pyramid", "ancient wonders"],
//         response:
//           "The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years.\n• It is made of roughly 2.3 million stone blocks, each weighing between 2.5 and 15 tons.\n• It is the only one of the Seven Wonders of the Ancient World still standing.",
//       },
//       {
//         keywords: ["lion", "king of jungle", "panthera leo","loin"],
//         response:
//           "The lion is known as the 'king of the jungle'. Lions live in groups called prides and are native to Africa and India. They are carnivorous and social animals.",
//       },
//       {
//         keywords: ["tiger", "bengal tiger", "panthera tigris"],
//         response:
//           "Tigers are the largest wild cats in the world. They are solitary hunters, native to Asia, and have distinctive orange coats with black stripes.",
//       },
//       {
//         keywords: ["elephant", "african elephant", "asian elephant"],
//         response:
//           "Elephants are the largest land animals. They are highly intelligent, social, and have long trunks used for breathing, lifting, and grasping objects.",
//       },
//       {
//         keywords: ["giraffe", "tallest animal", "long neck giraffe"],
//         response:
//           "Giraffes are the tallest land animals. They have long necks to reach leaves on tall trees and live mostly in African savannas.",
//       },
//       {
//         keywords: ["zebra", "striped horse", "plains zebra"],
//         response:
//           "Zebras are African equines known for their black-and-white striped coats. They live in herds and are herbivorous, feeding on grasses.",
//       },
//       {
//         keywords: ["kangaroo", "marsupial", "australian kangaroo"],
//         response:
//           "Kangaroos are marsupials native to Australia. Females carry young in pouches and they move by hopping with strong hind legs.",
//       },
//       {
//         keywords: ["panda", "giant panda", "bamboo bear"],
//         response:
//           "Giant pandas are black-and-white bears native to China. They primarily eat bamboo and are considered a conservation success story.",
//       },
//       {
//         keywords: ["koala", "australian koala", "tree bear"],
//         response:
//           "Koalas are tree-dwelling marsupials from Australia. They feed mostly on eucalyptus leaves and sleep up to 20 hours a day.",
//       },
//       {
//         keywords: ["penguin", "antarctic penguin", "flightless bird"],
//         response:
//           "Penguins are flightless birds that live mostly in the Southern Hemisphere. They are excellent swimmers and feed on fish and krill.",
//       },
//       {
//         keywords: ["polar bear", "arctic bear", "ursus maritimus"],
//         response:
//           "Polar bears are large carnivores native to the Arctic. They primarily hunt seals and are adapted to cold environments with thick fur and fat.",
//       },
//       {
//         keywords: ["wolf", "gray wolf", "canis lupus"],
//         response:
//           "Wolves are social carnivorous mammals that live in packs. They are highly intelligent hunters and are native to North America, Europe, and Asia.",
//       },
//       {
//         keywords: ["fox", "red fox", "arctic fox"],
//         response:
//           "Foxes are small to medium-sized omnivorous mammals. The red fox is the most common species, known for its cunning behavior and bushy tail.",
//       },
//       {
//         keywords: ["bear", "brown bear", "black bear"],
//         response:
//           "Bears are large mammals found in North America, Europe, and Asia. They are omnivorous and include species like brown bears, black bears, and polar bears.",
//       },
//       {
//         keywords: ["cheetah", "fastest land animal", "acinonyx jubatus"],
//         response:
//           "Cheetahs are the fastest land animals, capable of speeds up to 112 km/h. They hunt mainly small antelopes in African savannas.",
//       },
//       {
//         keywords: ["leopard", "panther", "spotted cat"],
//         response:
//           "Leopards are large cats with distinctive rosette patterns. They are solitary predators found in Africa and Asia and are skilled climbers.",
//       },
//       {
//         keywords: ["camel", "dromedary", "bactrian camel"],
//         response:
//           "Camels are desert-adapted mammals with humps that store fat. Dromedary camels have one hump; Bactrian camels have two.",
//       },
//       {
//         keywords: ["rhinoceros", "rhino", "horned animal"],
//         response:
//           "Rhinoceroses are large herbivorous mammals known for their thick skin and horn(s). They live in Africa and Asia and are critically endangered.",
//       },
//       {
//         keywords: ["hippopotamus", "hippo", "river horse"],
//         response:
//           "Hippos are large, mostly aquatic mammals native to Africa. They spend most of their day in water and are herbivorous but aggressive.",
//       },
//       {
//         keywords: ["crocodile", "saltwater crocodile", "nile crocodile"],
//         response:
//           "Crocodiles are large aquatic reptiles found in Africa, Asia, and Australia. They are carnivorous and can live in rivers, lakes, and estuaries.",
//       },
//       {
//         keywords: ["alligator", "american alligator", "china alligator"],
//         response:
//           "Alligators are reptiles similar to crocodiles but with a broader snout. The American alligator is native to the southeastern US.",
//       },
//       {
//         keywords: ["shark", "great white shark", "ocean predator"],
//         response:
//           "Sharks are carnivorous fish found in oceans worldwide. They have keen senses and are apex predators in marine ecosystems.",
//       },
//       {
//         keywords: ["dolphin", "bottlenose dolphin", "ocean mammal"],
//         response:
//           "Dolphins are intelligent marine mammals known for their playful behavior and communication skills. They live in oceans and rivers worldwide.",
//       },
//       {
//         keywords: ["whale", "blue whale", "humpback whale"],
//         response:
//           "Whales are large marine mammals. Blue whales are the largest animals ever recorded, feeding mainly on krill.",
//       },
//       {
//         keywords: ["octopus", "cephalopod", "intelligent sea creature"],
//         response:
//           "Octopuses are highly intelligent invertebrates with eight arms. They are known for problem-solving and camouflage abilities.",
//       },
//       {
//         keywords: ["eagle", "golden eagle", "bird of prey"],
//         response:
//           "Eagles are powerful birds of prey with excellent eyesight. They hunt small mammals and birds and are found worldwide.",
//       },
//       {
//         keywords: ["owl", "barn owl", "night bird"],
//         response:
//           "Owls are nocturnal birds of prey with exceptional hearing and vision. They hunt mainly rodents and insects at night.",
//       },
//       {
//         keywords: ["parrot", "macaw", "talking bird"],
//         response:
//           "Parrots are colorful, intelligent birds capable of mimicking sounds and speech. They live in tropical and subtropical regions.",
//       },
//       {
//         keywords: ["peacock", "indian peafowl", "ornamental bird"],
//         response:
//           "Peacocks are male peafowl known for their iridescent tail feathers used in courtship displays. Native to India and Sri Lanka.",
//       },
//       {
//         keywords: ["kangaroo rat", "desert rodent", "hopping rat"],
//         response:
//           "Kangaroo rats are small desert rodents in North America. They can jump long distances and survive without drinking water.",
//       },
//       {
//         keywords: ["sloth", "tree sloth", "slow animal"],
//         response:
//           "Sloths are slow-moving mammals that live in Central and South American trees. They feed mainly on leaves and sleep most of the day.",
//       },

//       // Add more entries here
//     ];