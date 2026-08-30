import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";

import pino from "pino";
import { Boom } from "@hapi/boom";

const PORT = process.env.PORT || 10000;

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "")
  .replace(/\D/g, "");

const ADMIN_NAME =
  process.env.ADMIN_NAME || "Bensocial Admin";

const PAIRING_NUMBER =
  (process.env.PAIRING_NUMBER || "")
    .replace(/\D/g, "");

const app = express();


// ============================================================
// WEB SERVER
// ============================================================

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Bensocial WhatsApp Bot</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>

<body style="
  background:#111;
  color:white;
  font-family:Arial;
  text-align:center;
  padding:50px;
">

<h1>🤖 Bensocial WhatsApp Bot</h1>

<h2>✅ Bot server is running</h2>

<p>
WhatsApp connection is being handled by the bot.
</p>

</body>
</html>
`);
});

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("🌐 BENSOCIAL WEB SERVER");
  console.log("======================================");
  console.log(`🌐 Port: ${PORT}`);
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
  accountName: "TOLUWANI BENJAMIN/Bensocial",
  accountNumber: "6550518571"
};


// ============================================================
// LOGGER
// ============================================================

const logger = pino({
  level: "silent"
});


// ============================================================
// WHATSAPP
// ============================================================

let reconnecting = false;

async function startWhatsApp() {

  try {

    console.log("");
    console.log("======================================");
    console.log("🤖 STARTING BENSOCIAL WHATSAPP BOT");
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

      logger,

      browser: Browsers.ubuntu(
        "Chrome"
      ),

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview: false

    });


    // ========================================================
    // SAVE AUTH
    // ========================================================

    sock.ev.on(
      "creds.update",
      saveCreds
    );


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


        // ----------------------------------------------------
        // QR
        // ----------------------------------------------------

        if (qr) {

          console.log("");
          console.log("======================================");
          console.log("📱 WHATSAPP QR CODE AVAILABLE");
          console.log("======================================");
          console.log("");

          console.log(
            "A QR code was generated."
          );

          console.log(
            "Use WhatsApp → Linked Devices → Link a Device."
          );

          console.log("");

        }


        // ----------------------------------------------------
        // CONNECTED
        // ----------------------------------------------------

        if (connection === "open") {

          reconnecting = false;

          console.log("");
          console.log("======================================");
          console.log("✅ WHATSAPP BOT CONNECTED");
          console.log("======================================");
          console.log("");

          console.log(
            "🤖 Bensocial is now online."
          );

          console.log("");

        }


        // ----------------------------------------------------
        // CLOSED
        // ----------------------------------------------------

        if (connection === "close") {

          const statusCode =
            new Boom(
              lastDisconnect?.error
            )?.output?.statusCode;


          console.log("");
          console.log("======================================");
          console.log("❌ WHATSAPP CONNECTION CLOSED");
          console.log("======================================");

          console.log(
            "Status code:",
            statusCode
          );


          console.log(
            "Error:",
            lastDisconnect?.error?.message ||
            lastDisconnect?.error ||
            "Unknown error"
          );


          const shouldReconnect =
            statusCode !==
            DisconnectReason.loggedOut;


          console.log(
            "Reconnect:",
            shouldReconnect
          );


          if (
            shouldReconnect &&
            !reconnecting
          ) {

            reconnecting = true;

            console.log("");
            console.log(
              "🔄 Restarting WhatsApp connection..."
            );

            setTimeout(
              () => {
                reconnecting = false;
                startWhatsApp();
              },
              5000
            );

          } else {

            console.log("");
            console.log(
              "⚠️ WhatsApp session logged out."
            );

          }

        }

      }
    );


    // ========================================================
    // PAIRING CODE
    // ========================================================

    if (
      !state.creds.registered &&
      PAIRING_NUMBER
    ) {

      console.log("");
      console.log("======================================");
      console.log("📱 WHATSAPP PAIRING");
      console.log("======================================");

      console.log(
        "📞 Number:",
        PAIRING_NUMBER
      );

      console.log("");
      console.log(
        "⏳ Waiting for WhatsApp connection..."
      );


      try {

        /*
         * Wait briefly for the socket to initialize.
         * Do NOT request multiple pairing codes.
         */

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              3000
            )
        );


        console.log("");
        console.log(
          "🔐 Requesting pairing code..."
        );


        const code =
          await sock.requestPairingCode(
            PAIRING_NUMBER
          );


        console.log("");
        console.log("======================================");
        console.log("🔐 WHATSAPP PAIRING CODE");
        console.log("======================================");
        console.log("");

        console.log(
          `👉 ${code}`
        );

        console.log("");

        console.log(
          "📱 On your phone:"
        );

        console.log(
          "WhatsApp → Settings → Linked Devices"
        );

        console.log(
          "→ Link a Device → Link with phone number instead"
        );

        console.log("");

        console.log(
          "Enter the pairing code shown above."
        );

        console.log("");

        console.log("======================================");

      } catch (error) {

        console.log("");
        console.log("======================================");
        console.log("❌ PAIRING CODE ERROR");
        console.log("======================================");

        console.log(
          "Message:",
          error?.message
        );

        console.log(
          "Name:",
          error?.name
        );

        console.log(
          "Stack:",
          error?.stack
        );

        console.log("");
        console.log(
          "Full error:",
          error
        );

        console.log("======================================");

      }

    }


    // ========================================================
    // MESSAGES
    // ========================================================

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

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
              !jid
            ) {
              continue;
            }


            const text =
              message.message.conversation ||
              message.message.extendedTextMessage?.text ||
              message.message.imageMessage?.caption ||
              "";


            const command =
              text
                .trim()
                .toLowerCase();


            if (!command) {
              continue;
            }


            // =================================================
            // MENU
            // =================================================

            if (
              command === "hi" ||
              command === "hello" ||
              command === "hey" ||
              command === "menu" ||
              command === "start"
            ) {

              await sendMenu(
                sock,
                jid
              );

              continue;
            }


            // =================================================
            // SERVICES
            // =================================================

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


            // =================================================
            // ADMIN
            // =================================================

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


            // =================================================
            // PAYMENT
            // =================================================

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

After payment, contact the admin with your payment receipt/order details.`
                }
              );

              continue;
            }


            // =================================================
            // HELP
            // =================================================

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

• menu
• 1 - 13
• payment
• admin
• help`
                }
              );

              continue;
            }


            // =================================================
            // DEFAULT
            // =================================================

            await sock.sendMessage(
              jid,
              {
                text:
`👋 *WELCOME TO BENSOCIAL!*

Send *menu* to view our available services.`
              }
            );

          } catch (error) {

            console.log(
              "❌ Message handling error:",
              error?.message
            );

          }

        }

      }
    );


  } catch (error) {

    console.log("");
    console.log("======================================");
    console.log("❌ WHATSAPP START ERROR");
    console.log("======================================");

    console.log(
      error?.message
    );

    console.log(
      error?.stack
    );

    console.log("");

  }

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

🛍️ *CHOOSE A SERVICE*

`;


  for (
    const service of SERVICES
  ) {

    text +=
`${service.id}. ${service.name}
💰 ${service.price}
📦 Stock: ${service.stock}

`;

  }


  text +=
`💳 Send *payment* for payment details.

💬 Send *admin* to contact the admin.`;


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

━━━━━━━━━━━━━━━━━━

💳 *PAYMENT DETAILS*

🏦 Bank:
${PAYMENT.bank}

👤 Account Name:
${PAYMENT.accountName}

💳 Account Number:
${PAYMENT.accountNumber}

━━━━━━━━━━━━━━━━━━

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

Admin number has not been configured.

Please configure ADMIN_NUMBER in Render Environment Variables.`
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

📞 WhatsApp:
https://wa.me/${ADMIN_NUMBER}`
    }
  );


  try {

    await sock.sendMessage(
      adminJid,
      {
        text:
`🔔 *NEW CUSTOMER*

A customer requested to contact the admin.

Customer:
${jid.replace(
  "@s.whatsapp.net",
  ""
)}`
      }
    );

  } catch (error) {

    console.log(
      "⚠️ Could not notify admin:",
      error?.message
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

console.log(
  "PAIRING_NUMBER:",
  PAIRING_NUMBER || "NOT SET"
);

console.log("");

startWhatsApp();
