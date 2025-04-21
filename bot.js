require("dotenv").config();
const express = require("express");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
const serverUrl = process.env.SERVER_URL; // 🔥 Render URL ni env ga qo'shamiz
const adminChatIds = ["1043780253", "5573431992"];

const app = express();
app.use(cors());
app.use(express.json());

const bot = new TelegramBot(token, { webHook: { port: false } });

// Bot uchun webhook URLni o‘rnatamiz
bot.setWebHook(`${serverUrl}/bot${token}`);

const mainMenu = {
    reply_markup: {
        keyboard: [[{ text: "Start" }, { text: "List" }]],
        resize_keyboard: true,
        one_time_keyboard: false,
    },
};

let applications = [];

// Telegram webhookni express orqali qabul qilamiz
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Botning xatti-harakatlari
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name;

    if (adminChatIds.includes(chatId.toString())) {
        bot.sendMessage(
            chatId,
            `👋 Assalomu alaykum, admin ${name}!\n\nQuyidagi buyruqlar orqali ishlashingiz mumkin:\n\n👉 /start - Botni ishga tushirish\n👉 /list - Arizalar ro‘yxati`,
            mainMenu
        );
    } else {
        bot.sendMessage(chatId, `👋 Xush kelibsiz, ${name}!`);
        console.log(`🚫 Oddiy foydalanuvchi /start bosdi: ${chatId}`);
    }
});

bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!adminChatIds.includes(chatId.toString())) return;

    if (text.toLowerCase() === "/start" || text.toLowerCase() === "start") {
        bot.sendMessage(chatId, "🔄 Bot yangidan ishga tushdi.", mainMenu);
    }

    if (text.toLowerCase() === "/list" || text.toLowerCase() === "list") {
        if (applications.length === 0) {
            bot.sendMessage(chatId, "📭 Hozircha hech qanday ariza yo‘q.");
        } else {
            let message = `📋 Arizalar ro‘yxati:\n\n`;

            applications.forEach((app, index) => {
                const appTime = new Date(app.time);
                const hours = appTime.getHours().toString().padStart(2, "0");
                const minutes = appTime
                    .getMinutes()
                    .toString()
                    .padStart(2, "0");
                const day = appTime.getDate().toString().padStart(2, "0");
                const month = (appTime.getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                const year = appTime.getFullYear();

                message += `${index + 1}. 👤 ${app.name}\n📞 ${app.phone}\n📚 ${
                    app.course
                }\n🕒 ${hours}:${minutes} | ${day}.${month}.${year}\n\n`;
            });

            bot.sendMessage(chatId, message);
        }
    }
});

// Frontenddan keladigan formani qabul qilish
app.post("/send", (req, res) => {
    const { name, phone, course } = req.body;

    const newApp = {
        name,
        phone,
        course,
        time: new Date().toISOString(),
    };

    applications.push(newApp);

    const message = `
📝 Yangi ariza:

👤 F.I.Sh: ${name}
📞 Tel: ${phone}
📚 Kurs: ${course}
  `;

    adminChatIds.forEach((id) => {
        bot.sendMessage(id, message).catch((err) => {
            console.error("❌ Yuborishdagi xato:", err);
        });
    });

    res.status(200).send("Yuborildi ✅");
});

// Serverni ishga tushiramiz
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server ishlayapti: http://localhost:${PORT}`);
});
