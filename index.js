const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");

const P = require("pino");
const qrcode = require("qrcode-terminal");
const express = require("express");

// ============================================================
// CONFIG
// ============================================================

const PORT = process.env.PORT || 3000;

const ADMIN_WHATSAPP = (
  process.env.ADMIN_WHATSAPP || ""
).replace(/\D/g, "");

const ADMIN_USERNAME = (
  process.env.ADMIN_USERNAME || "silverfoxoftiktok"
).replace("@", "");

const BANK = process.env.BANK || "OPay";

const ACCOUNT_NAME =
  process.env.ACCOUNT_NAME ||
  "TOLUWANI BENJAMIN/Bensocial";

const ACCOUNT_NUMBER =
  process.env.ACCOUNT_NUMBER ||
  "6550518571";


// ============================================================
// SERVICES
// ============================================================

const SERVICES = {
  whatsapp: {
    name: "📱 WhatsApp Number",
    price: "₦4,500",
    stock: "Available"
  },

  textnow: {
    name: "📲 TextNow",
    price: "₦2,200",
    stock: "Available"
  },

  esim: {
    name: "🌐 eSIM",
    price: "₦25,000",
    stock: "Available"
  },

  facebook: {
    name: "📘 Facebook",
    price: "₦2,300",
    stock: "Available"
  },

  twitter: {
    name: "🐦 Twitter",
    price: "₦2,860",
    stock: "Available"
  },

  usa_facebook: {
    name: "🇺🇸 USA Facebook",
    price: "₦2,200",
    stock: "35"
  },

  video_tools: {
    name: "📹 2026 Video Call Tools",
    price: "₦56,000",
    stock: "7"
  },

  telegram_verification: {
    name: "✅ Telegram Verification",
    price: "₦10,000",
    stock: "9"
  },

  apple: {
    name: "🍎 Apple iCloud",
    price: "₦7,000",
    stock: "24"
  },

  france_tiktok: {
    name: "🇫🇷 France TikTok",
    price: "₦1,800",
    stock: "6"
  },

  hma: {
    name: "🔐 HMA VPN — 1 Month",
    price: "₦3,780",
    stock: "62"
  },

  expressvpn: {
    name: "🔐 ExpressVPN — 1 Month",
    price: "₦3,800",
    stock: "25"
  },

  instagram: {
    name: "📸 USA Instagram",
    price: "₦2,300",
    stock: "23"
  }
};


// ============================================================
// WEB SERVER
// ============================================================

const app = express();

app.get("/", (req, res) => {
  res.send("✅ Bensocial WhatsApp Bot is running!");
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: "Bensocial WhatsApp Bot"
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});


// ============================================================
// ADMIN CHECK
// ============================================================

function isAdmin(message) {
  const number = message.key.participant ||
    message.key.remoteJid ||
    "";

  const cleanNumber = number
    .replace("@s.whatsapp.net", "")
    .replace("@g.us", "")
    .replace(/\D/g, "");

  return (
    ADMIN_WHATSAPP &&
    cleanNumber === ADMIN_WHATSAPP
  );
}


// ============================================================
// SERVICE MENU
// ============================================================

function getServiceList() {
  let text = "🛍️ *BENSOCIAL SERVICES*\n\n";

  Object.entries(SERVICES).forEach(
    ([key, service], index) => {

      text +=
        `${index + 1}. ${service.name}\n` +
        `💰 Price: ${service.price}\n` +
        `📦 Stock: ${service.stock}\n` +
        `🔑 Code: ${key}\n\n`;
    }
  );

  text +=
    "━━━━━━━━━━━━━━━━━━\n" +
    "Reply with the service code to view payment details.";

  return text;
}


// ============================================================
// SERVICE DETAILS
// ============================================================

function getServiceDetails(key) {

  const service = SERVICES[key];

  if (!service) {
    return null;
  }

  let adminContact = "";

  if (ADMIN_WHATSAPP) {
    adminContact =
      `https://wa.me/${ADMIN_WHATSAPP}`;
  }

  return (
    `${service.name}\n\n` +

    `💰 *Price:* ${service.price}\n` +
    `📦 *Stock:* ${service.stock}\n\n` +

    `💳 *PAYMENT DETAILS*\n\n` +
    `🏦 Bank: ${BANK}\n` +
    `👤 Account Name: ${ACCOUNT_NAME}\n` +
    `💳 Account Number: ${ACCOUNT_NUMBER}\n\n` +

    `━━━━━━━━━━━━━━━━━━\n\n` +

    `✅ After making payment, send your ` +
    `payment receipt/order details to the admin.\n\n` +

    (
      adminContact
        ? `👤 *Contact Admin:*\n${adminContact}\n\n`
        : ""
    ) +

    `⚠️ Please confirm the account details ` +
    `before making payment.`
  );
}


// ============================================================
// ADMIN MENU
// ============================================================

function adminMenu() {

  return (
    `🔐 *BENSOCIAL ADMIN PANEL*\n\n` +

    `📋 *View Services*\n` +
    `!services\n\n` +

    `➕ *Add Service*\n` +
    `!add key | name | price | stock\n\n` +

    `💰 *Change Price*\n` +
    `!price key | new price\n\n` +

    `📦 *Change Stock*\n` +
    `!stock key | new stock\n\n` +

    `🗑️ *Delete Service*\n` +
    `!delete key\n\n` +

    `💳 *Payment Details*\n` +
    `!payment\n\n` +

    `ℹ️ *Admin username:* @${ADMIN_USERNAME}`
  );
}


// ============================================================
// ADD SERVICE
// ============================================================

function addService(text) {

  const parts = text
    .split("|")
    .map(x => x.trim());

  if (parts.length !== 4) {
    return (
      `❌ Wrong format.\n\n` +
      `Use:\n` +
      `!add key | name | price | stock\n\n` +
      `Example:\n` +
      `!add netflix | 🎬 Netflix | ₦5,000 | 10`
    );
  }

  const [key, name, price, stock] = parts;

  const serviceKey = key
    .toLowerCase()
    .replace(/\s+/g, "_");

  if (SERVICES[serviceKey]) {
    return `❌ Service "${serviceKey}" already exists.`;
  }

  SERVICES[serviceKey] = {
    name,
    price,
    stock
  };

  return (
    `✅ *SERVICE ADDED*\n\n` +
    `🔑 Key: ${serviceKey}\n` +
    `📌 Name: ${name}\n` +
    `💰 Price: ${price}\n` +
    `📦 Stock: ${stock}`
  );
}


// ============================================================
// CHANGE PRICE
// ============================================================

function changePrice(text) {

  const parts = text
    .split("|")
    .map(x => x.trim());

  if (parts.length !== 2) {
    return (
      `❌ Wrong format.\n\n` +
      `Use:\n` +
      `!price key | new price\n\n` +
      `Example:\n` +
      `!price whatsapp | ₦5,000`
    );
  }

  const [key, price] = parts;

  if (!SERVICES[key]) {
    return `❌ Service "${key}" not found.`;
  }

  SERVICES[key].price = price;

  return (
    `✅ *PRICE UPDATED*\n\n` +
    `${SERVICES[key].name}\n` +
    `💰 New price: ${price}`
  );
}


// ============================================================
// CHANGE STOCK
// ============================================================

function changeStock(text) {

  const parts = text
    .split("|")
    .map(x => x.trim());

  if (parts.length !== 2) {
    return (
      `❌ Wrong format.\n\n` +
      `Use:\n` +
      `!stock key | new stock\n\n` +
      `Example:\n` +
      `!stock whatsapp | 20`
    );
  }

  const [key, stock] = parts;

  if (!SERVICES[key]) {
    return `❌ Service "${key}" not found.`;
  }

  SERVICES[key].stock = stock;

  return (
    `✅ *STOCK UPDATED*\n\n` +
    `${SERVICES[key].name}\n` +
    `📦 New stock: ${stock}`
  );
}


// ============================================================
// DELETE SERVICE
// ============================================================

function deleteService(key) {

  if (!SERVICES[key]) {
    return `❌ Service "${key}" not found.`;
  }

  const name = SERVICES[key].name;

  delete SERVICES[key];

  return (
    `🗑️ *SERVICE DELETED*\n\n` +
    `${name}`
  );
}


// ============================================================
// PAYMENT INFO
// ============================================================

function paymentInfo() {

  return (
    `💳 *CURRENT PAYMENT DETAILS*\n\n` +
    `🏦 Bank: ${BANK}\n` +
    `👤 Account Name: ${ACCOUNT_NAME}\n` +
    `💳 Account Number: ${ACCOUNT_NUMBER}`
  );
}


// ============================================================
// WHATSAPP BOT
// ============================================================

async function startBot() {

  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    "./auth_info_baileys"
  );

  const sock = makeWASocket({

    auth: {
      creds: state.creds,

      keys: makeCacheableSignalKeyStore(
        state.keys,
        P().child({
          level: "silent"
        })
      )
    },

    logger: P({
      level: "silent"
    }),

    printQRInTerminal: false,

    browser: [
      "Bensocial Bot",
      "Chrome",
      "1.0.0"
    ]
  });


  // ========================================================
  // CONNECTION
  // ========================================================

  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect,
        qr
      } = update;


      if (qr) {

        console.log("");
        console.log(
          "📱 SCAN THIS QR CODE WITH WHATSAPP:"
        );
        console.log("");

        qrcode.generate(
          qr,
          {
            small: true
          }
        );

        console.log("");
      }


      if (connection === "open") {

        console.log("");
        console.log(
          "✅ BENSOCIAL WHATSAPP BOT CONNECTED!"
        );
        console.log("");

      }


      if (connection === "close") {

        const shouldReconnect =
          lastDisconnect?.error?.output
            ?.statusCode !== DisconnectReason.loggedOut;

        console.log(
          "❌ WhatsApp connection closed."
        );

        if (shouldReconnect) {

          console.log(
            "🔄 Reconnecting..."
          );

          setTimeout(
            startBot,
            5000
          );
        }
      }
    }
  );


  // ========================================================
  // SAVE LOGIN
  // ========================================================

  sock.ev.on(
    "creds.update",
    saveCreds
  );


  // ========================================================
  // MESSAGES
  // ========================================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      try {

        const message = messages[0];

        if (!message) return;

        if (message.key.fromMe) return;

        if (!message.message) return;


        const jid =
          message.key.remoteJid;

        if (!jid) return;


        const text =
          message.message.conversation ||
          message.message.extendedTextMessage
            ?.text ||
          "";


        const input =
          text.trim();

        const lower =
          input.toLowerCase();


        // ==================================================
        // START
        // ==================================================

        if (
          lower === "hi" ||
          lower === "hello" ||
          lower === "hey" ||
          lower === "start" ||
          lower === "/start"
        ) {

          await sock.sendMessage(
            jid,
            {
              text:
                `👋 *WELCOME TO BENSOCIAL!*\n\n` +
                `🛍️ Choose a service below.\n\n` +
                getServiceList()
            }
          );

          return;
        }


        // ==================================================
        // MENU
        // ==================================================

        if (
          lower === "menu" ||
          lower === "services" ||
          lower === "/services"
        ) {

          await sock.sendMessage(
            jid,
            {
              text: getServiceList()
            }
          );

          return;
        }


        // ==================================================
        // ADMIN
        // ==================================================

        if (
          lower === "admin" ||
          lower === "/admin"
        ) {

          if (!isAdmin(message)) {

            await sock.sendMessage(
              jid,
              {
                text:
                  "⛔ Admin access only."
              }
            );

            return;
          }

          await sock.sendMessage(
            jid,
            {
              text: adminMenu()
            }
          );

          return;
        }


        // ==================================================
        // ADMIN SERVICES
        // ==================================================

        if (
          lower === "!services"
        ) {

          if (!isAdmin(message)) {

            await sock.sendMessage(
              jid,
              {
                text:
                  "⛔ Admin access only."
              }
            );

            return;
          }

          await sock.sendMessage(
            jid,
            {
              text: getServiceList()
            }
          );

          return;
        }


        // ==================================================
        // ADD
        // ==================================================

        if (
          lower.startsWith("!add ")
        ) {

          if (!isAdmin(message)) {

            await sock.sendMessage(
              jid,
              {
                text:
                  "⛔ Admin access only."
              }
            );

            return;
          }

          const data =
            input.substring(5).trim();

          await sock.sendMessage(
            jid,
            {
              text: addService(data)
            }
          );

          return;
        }


        // ==================================================
        // PRICE
        // ==================================================

        if (
          lower.startsWith("!price ")
        ) {

          if (!isAdmin(message)) {

            await sock.sendMessage(
              jid,
              {
                text:
                  "⛔ Admin access only."
              }
            );

            return;
          }

          const data =
            input.substring(7).trim();

          await sock.sendMessage(
            jid,
            {
              text: changePrice(data)
            }
          );

          return;
        }


        // ==================================================
        // STOCK
        // ==================================================

        if (
          lower.startsWith("!stock ")
        ) {

          if (!isAdmin(message)) {

            await sock.sendMessage(
              jid,
              {
                text:
                  "⛔ Admin access only."
              }
            );

            return;
          }

          const data =
            input.substring(7).trim();

          await sock.sendMessage(
            jid,
            {
              text: changeStock(data)
            }
          );

          return;
        }


        // ==================================================
        // DELETE
        // ==================================================

        if (
          lower.startsWith("!delete ")
        ) {

          if (!isAdmin(message)) {

            await sock.sendMessage(
              jid,
              {
                text:
                  "⛔ Admin access only."
              }
            );

            return;
          }

          const key =
            input.substring(8)
              .trim()
              .toLowerCase();

          await sock.sendMessage(
            jid,
            {
              text: deleteService(key)
            }
          );

          return;
        }


        // ==================================================
        // PAYMENT
        // ==================================================

        if (
          lower === "!payment"
        ) {

          if (!isAdmin(message)) {

            await sock.sendMessage(
              jid,
              {
                text:
                  "⛔ Admin access only."
              }
            );

            return;
          }

          await sock.sendMessage(
            jid,
            {
              text: paymentInfo()
            }
          );

          return;
        }


        // ==================================================
        // SERVICE CODE
        // ==================================================

        if (
          SERVICES[lower]
        ) {

          const details =
            getServiceDetails(lower);

          await sock.sendMessage(
            jid,
            {
              text: details
            }
          );

          return;
        }


        // ==================================================
        // DEFAULT
        // ==================================================

        await sock.sendMessage(
          jid,
          {
            text:
              `❓ I didn't understand that.\n\n` +
              `Send *menu* to see all available services.`
          }
        );

      } catch (error) {

        console.error(
          "Message error:",
          error
        );

      }
    }
  );
}


// ============================================================
// START
// ============================================================

startBot().catch(
  error => {
    console.error(
      "❌ Bot failed to start:",
      error
    );
  }
);
