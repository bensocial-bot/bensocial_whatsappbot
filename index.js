import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";

import pino from "pino";
import { Boom } from "@hapi/boom";


// ============================================================
// CONFIG
// ============================================================

const PORT = process.env.PORT || 10000;

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "")
  .replace(/\D/g, "");

const ADMIN_NAME =
  process.env.ADMIN_NAME || "Bensocial Admin";

const PAIRING_NUMBER =
  (process.env.PAIRING_NUMBER || "")
    .replace(/\D/g, "");


// ============================================================
// EXPRESS SERVER
// ============================================================

const app = express();

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Bensocial WhatsApp Bot</title>

  <style>
    body {
      margin: 0;
      padding: 0;
      background: #111;
      color: white;
      font-family: Arial, sans-serif;
      text-align: center;
    }

    .container {
      padding: 70px 20px;
    }

    h1 {
      font-size: 42px;
      margin-bottom: 30px;
    }

    .status {
      font-size: 22px;
      color: #25D366;
      margin-top: 30px;
    }

    .info {
      margin-top: 30px;
      color: #ccc;
      font-size: 18px;
      line-height: 1.6;
    }
  </style>
</head>

<body>

  <div class="container">

    <h1>🤖 Bensocial WhatsApp Bot</h1>

    <div class="status">
      ✅ Bot server is running.
    </div>

    <div class="info">
      WhatsApp connection is being handled by the bot.
      <br><br>
      Check the Render logs for the WhatsApp pairing code.
    </div>

  </div>

</body>
</html>
  `);
});

app.get("/health", (req, res) => {
  res.json({
    status: "online",
    bot: "Bensocial WhatsApp Bot"
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("🌐 BENSOCIAL WEB SERVER");
  console.log("======================================");
  console.log(`🚀 Port: ${PORT}`);
  console.log("");
});


// ============================================================
// SERVICES
// ============================================================

const SERVICES = [

  {
    id: "1",
    name: "📱 WhatsApp Number",
    price: "₦4,500",
    stock: "Available"
  },

  {
    id: "2",
    name: "📲 TextNow",
    price: "₦2,200",
    stock: "Available"
  },

  {
    id: "3",
    name: "🌐 eSIM",
    price: "₦25,000",
    stock: "Available"
  },

  {
    id: "4",
    name: "📘 Facebook",
    price: "₦2,300",
    stock: "Available"
  },

  {
    id: "5",
    name: "🐦 Twitter",
    price: "₦2,860",
    stock: "Available"
  },

  {
    id: "6",
    name: "🇺🇸 USA Facebook",
    price: "₦2,200",
    stock: "35"
  },

  {
    id: "7",
    name: "📹 2026 Video Call Tools",
    price: "₦56,000",
    stock: "7"
  },

  {
    id: "8",
    name: "✅ Telegram Verification",
    price: "₦10,000",
    stock: "9"
  },

  {
    id: "9",
    name: "🍎 Apple iCloud",
    price: "₦7,000",
    stock: "24"
  },

  {
    id: "10",
    name: "🇫🇷 France TikTok",
    price: "₦1,800",
    stock: "6"
  },

  {
    id: "11",
    name: "🔐 HMA VPN — 1 Month",
    price: "₦3,780",
    stock: "62"
  },

  {
    id: "12",
    name: "🔐 ExpressVPN — 1 Month",
    price: "₦3,800",
    stock: "25"
  },

  {
    id: "13",
    name: "📸 USA Instagram",
    price: "₦2,300",
    stock: "23"
  }

];


// ============================================================
// PAYMENT
// ============================================================

const PAYMENT = {

  bank: "OPay",

  accountName:
    "TOLUWANI BENJAMIN/Bensocial",

  accountNumber:
    "6550518571"

};


// ============================================================
// WHATSAPP
// ============================================================

let isPairingRequested = false;

async function startWhatsApp() {

  console.log("");
  console.log("======================================");
  console.log("🤖 STARTING WHATSAPP");
  console.log("======================================");
  console.log("");


  const {
    state,
    saveCreds
  } = await useMultiFileAuthState(
    "./auth_info_baileys"
  );


  const sock = makeWASocket({

    auth: state,

    logger: pino({
      level: "silent"
    }),

    browser:
      Browsers.ubuntu("Chrome"),

    markOnlineOnConnect: false,

    syncFullHistory: false,

    generateHighQualityLinkPreview: false

  });


  // ==========================================================
  // SAVE LOGIN CREDENTIALS
  // ==========================================================

  sock.ev.on(
    "creds.update",
    saveCreds
  );


  // ==========================================================
  // CONNECTION
  // ==========================================================

  sock.ev.on(
    "connection.update",
    async (update) => {

      const {
        connection,
        lastDisconnect
      } = update;


      // ------------------------------------------------------
      // CONNECTION STARTED
      // ------------------------------------------------------

      if (
        connection === "connecting"
      ) {

        console.log("");
        console.log("======================================");
        console.log("🔄 CONNECTING TO WHATSAPP");
        console.log("======================================");
        console.log("");

      }


      // ------------------------------------------------------
      // PAIRING CODE
      // ------------------------------------------------------

      if (
        connection === "connecting" &&
        !state.creds.registered &&
        !isPairingRequested
      ) {

        isPairingRequested = true;


        if (!PAIRING_NUMBER) {

          console.log("");
          console.log("======================================");
          console.log("❌ PAIRING NUMBER MISSING");
          console.log("======================================");
          console.log("");
          console.log(
            "Add PAIRING_NUMBER to Render Environment Variables."
          );
          console.log("");
          console.log(
            "Example: 2347019999529"
          );
          console.log("");

          return;
        }


        try {

          console.log("");
          console.log("======================================");
          console.log("📱 REQUESTING WHATSAPP PAIRING CODE");
          console.log("======================================");
          console.log("");
          console.log(
            `📞 Number: ${PAIRING_NUMBER}`
          );
          console.log("");


          const code =
            await sock.requestPairingCode(
              PAIRING_NUMBER
            );


          console.log("");
          console.log("######################################");
          console.log("#                                    #");
          console.log("#     📱 WHATSAPP PAIRING CODE       #");
          console.log("#                                    #");
          console.log(`        ${code}`);
          console.log("#                                    #");
          console.log("######################################");
          console.log("");
          console.log("📱 On your phone:");
          console.log("");
          console.log("WhatsApp");
          console.log("→ Settings");
          console.log("→ Linked Devices");
          console.log("→ Link a Device");
          console.log("→ Link with phone number instead");
          console.log("");
          console.log(`Enter this code: ${code}`);
          console.log("");
          console.log("======================================");
          console.log("");

        } catch (error) {

          console.log("");
          console.log("======================================");
          console.log("❌ PAIRING CODE ERROR");
          console.log("======================================");
          console.log("");
          console.log(
            error?.message || error
          );
          console.log("");

          isPairingRequested = false;

        }

      }


      // ------------------------------------------------------
      // CONNECTED
      // ------------------------------------------------------

      if (
        connection === "open"
      ) {

        console.log("");
        console.log("======================================");
        console.log("✅ WHATSAPP BOT CONNECTED");
        console.log("======================================");
        console.log("");
        console.log("🤖 Bensocial is now online.");
        console.log("");

      }


      // ------------------------------------------------------
      // DISCONNECTED
      // ------------------------------------------------------

      if (
        connection === "close"
      ) {

        const statusCode =
          new Boom(
            lastDisconnect?.error
          )?.output?.statusCode;


        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;


        console.log("");
        console.log("======================================");
        console.log("❌ WHATSAPP CONNECTION CLOSED");
        console.log("======================================");
        console.log("");

        console.log(
          "Status code:",
          statusCode
        );

        console.log(
          "Reconnect:",
          shouldReconnect
        );

        console.log("");


        if (shouldReconnect) {

          console.log(
            "🔄 Restarting WhatsApp connection..."
          );

          isPairingRequested = false;


          setTimeout(
            () => {
              startWhatsApp();
            },
            5000
          );

        } else {

          console.log("");
          console.log(
            "⚠️ WhatsApp logged out."
          );

          console.log("");
          console.log(
            "Delete the auth_info_baileys folder"
          );

          console.log(
            "and redeploy to generate a new pairing code."
          );

          console.log("");

        }

      }

    }
  );


  // ==========================================================
  // MESSAGES
  // ==========================================================

  sock.ev.on(
    "messages.upsert",
    async ({
      messages
    }) => {

      for (
        const message of messages
      ) {

        try {

          if (
            !message.message
          ) {
            continue;
          }


          if (
            message.key.fromMe
          ) {
            continue;
          }


          const jid =
            message.key.remoteJid;


          if (
            !jid ||
            jid === "status@broadcast"
          ) {
            continue;
          }


          const text =

            message.message
              .conversation ||

            message.message
              .extendedTextMessage
              ?.text ||

            message.message
              .imageMessage
              ?.caption ||

            message.message
              .videoMessage
              ?.caption ||

            "";


          const command =
            text
              .trim()
              .toLowerCase();


          if (!command) {
            continue;
          }


          // ==================================================
          // MENU
          // ==================================================

          if (

            command === "hi" ||

            command === "hello" ||

            command === "hey" ||

            command === "menu" ||

            command === "start" ||

            command === "1"

          ) {

            await sendMenu(
              sock,
              jid
            );

            continue;
          }


          // ==================================================
          // SERVICES
          // ==================================================

          const service =
            SERVICES.find(
              item =>
                item.id === command
            );


          if (service) {

            await sendService(
              sock,
              jid,
              service
            );

            continue;
          }


          // ==================================================
          // ADMIN
          // ==================================================

          if (

            command === "admin" ||

            command === "contact admin"

          ) {

            await sendAdmin(
              sock,
              jid
            );

            continue;
          }


          // ==================================================
          // PAYMENT
          // ==================================================

          if (

            command === "payment" ||

            command === "pay"

          ) {

            await sock.sendMessage(
              jid,
              {
                text:
`💳 *PAYMENT DETAILS*

🏦 Bank: ${PAYMENT.bank}

👤 Account Name:
${PAYMENT.accountName}

💳 Account Number:
${PAYMENT.accountNumber}

After payment, contact the admin with your payment receipt/order details.

Send *admin* to contact the admin.`
              }
            );

            continue;
          }


          // ==================================================
          // HELP
          // ==================================================

          if (
            command === "help"
          ) {

            await sock.sendMessage(
              jid,
              {
                text:
`🤖 *BENSOCIAL BOT*

Send *menu* to view our services.

Commands:

• menu - View services
• 1 - 13 - Select service
• payment - Payment details
• admin - Contact admin
• help - Help`
              }
            );

            continue;
          }


          // ==================================================
          // DEFAULT
          // ==================================================

          await sock.sendMessage(
            jid,
            {
              text:
`👋 *WELCOME TO BENSOCIAL!*

Send *menu* to view our available services.

Send *help* for available commands.`
            }
          );

        } catch (error) {

          console.log(
            "❌ Message handling error:",
            error?.message || error
          );

        }

      }

    }
  );

}


// ============================================================
// MENU
// ============================================================

async function sendMenu(
  sock,
  jid
) {

  let text =
`👋 *WELCOME TO BENSOCIAL*

🛍️ *AVAILABLE SERVICES*

`;


  for (
    const service of SERVICES
  ) {

    text +=

`${service.id}. ${service.name}
💰 Price: ${service.price}
📦 Stock: ${service.stock}

`;

  }


  text +=

`💳 Send *payment* for payment details.

💬 Send *admin* to contact the admin.

ℹ️ Send a number from *1 - 13* to select a service.`;


  await sock.sendMessage(
    jid,
    {
      text
    }
  );

}


// ============================================================
// SERVICE
// ============================================================

async function sendService(
  sock,
  jid,
  service
) {

  const text =

`${service.name}

💰 *Price:* ${service.price}

📦 *Stock:* ${service.stock}

💳 *PAYMENT DETAILS*

🏦 Bank:
${PAYMENT.bank}

👤 Account Name:
${PAYMENT.accountName}

💳 Account Number:
${PAYMENT.accountNumber}

After payment, contact the admin with your payment receipt/order details.

Send *admin* to contact the admin.`;


  await sock.sendMessage(
    jid,
    {
      text
    }
  );

}


// ============================================================
// ADMIN
// ============================================================

async function sendAdmin(
  sock,
  jid
) {

  if (!ADMIN_NUMBER) {

    await sock.sendMessage(
      jid,
      {
        text:
`💬 *CONTACT ADMIN*

Please contact Bensocial Admin.

⚠️ ADMIN_NUMBER has not been configured in Render.`
      }
    );

    return;
  }


  const adminJid =
    `${ADMIN_NUMBER}@s.whatsapp.net`;


  await sock.sendMessage(
    jid,
    {
      text:
`💬 *CONTACT ADMIN*

👤 ${ADMIN_NAME}

📱 WhatsApp:
https://wa.me/${ADMIN_NUMBER}`
    }
  );


  // ----------------------------------------------------------
  // NOTIFY ADMIN
  // ----------------------------------------------------------

  try {

    const customerNumber =
      jid
        .replace(
          "@s.whatsapp.net",
          ""
        );


    await sock.sendMessage(
      adminJid,
      {
        text:
`🔔 *NEW CUSTOMER*

A customer requested to contact the admin.

📱 Customer:
${customerNumber}`
      }
    );

  } catch (error) {

    console.log(
      "⚠️ Could not notify admin:",
      error?.message || error
    );

  }

}


// ============================================================
// START
// ============================================================

console.log("");
console.log("======================================");
console.log("🤖 BENSOCIAL WHATSAPP BOT");
console.log("======================================");
console.log("");
console.log("🚀 Starting bot...");
console.log("");

startWhatsApp().catch(
  (error) => {

    console.log("");
    console.log("======================================");
    console.log("❌ BOT STARTUP ERROR");
    console.log("======================================");
    console.log("");

    console.log(
      error?.message || error
    );

    console.log("");

  }
);
