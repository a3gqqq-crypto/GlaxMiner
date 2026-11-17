const dotenv = require("dotenv");

dotenv.config();

const { initDatabase } = require("./db/init");
const { createApp } = require("./app");

if (!process.env.BOT_TOKEN) {
  console.error(
    "⚠️  BOT_TOKEN is not set: every authenticated request will fail until it is."
  );
}

initDatabase();

const app = createApp();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
