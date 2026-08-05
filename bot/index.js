require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const WEB_APP_URL = "https://glax-miner.vercel.app/";

bot.start((ctx) => {
  ctx.reply(
    "🚀 Welcome to GlaxMiner!\n\nMine GLX, upgrade your pickaxe, and earn rewards!",
    Markup.inlineKeyboard([
      [
        Markup.button.webApp("⛏️ Open GlaxMiner", WEB_APP_URL),
      ],
    ])
  );
});

bot.launch();

console.log("✅ GlaxMiner Bot is running");