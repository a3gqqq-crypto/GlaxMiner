require("dotenv").config();

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);

const WEB_APP_URL = "https://glax-miner.vercel.app/";

// Optional, for testing an unreleased build inside Telegram:
//   PREVIEW_WEB_APP_URL = a Vercel preview URL of the app
//   PREVIEW_USER_IDS    = comma-separated Telegram user IDs allowed to open it
// /preview does nothing for anyone else. Production users only ever get
// WEB_APP_URL from /start.
const PREVIEW_URL = process.env.PREVIEW_WEB_APP_URL || "";
const PREVIEW_IDS = new Set(
  (process.env.PREVIEW_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

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

bot.command("preview", (ctx) => {
  const id = String(ctx.from?.id || "");
  if (!PREVIEW_URL || !PREVIEW_IDS.has(id)) {
    console.log(`/preview refused for Telegram user ${id || "unknown"}`);
    return;
  }
  ctx.reply(
    "Preview build (not released). It uses the live API and your real account.",
    Markup.inlineKeyboard([[Markup.button.webApp("Open preview", PREVIEW_URL)]])
  );
});

bot.launch();

console.log("✅ GlaxMiner Bot is running");
