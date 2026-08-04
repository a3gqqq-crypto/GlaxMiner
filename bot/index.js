require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
    ctx.reply(
        "🚀 Welcome to Your Miner!\n\nStart mining and earn rewards!",
        Markup.inlineKeyboard([
            [Markup.button.webApp("⛏️ Open App", "https://google.com")]
        ])
    );
});

bot.launch();

console.log("✅ Bot is running!");