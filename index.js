import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";
import pino from "pino";
import { Boom } from "@hapi/boom";


// ============================================================
// CONFIGURATION
// ============================================================

const PORT = process.env.PORT || 10000;

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "")
  .replace(/\D/g, "");

const ADMIN_NAME =
  process.env.ADMIN_NAME || "Bensocial Admin";

const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || "")
  .replace(/\D/g, "");


// ============================================================
// WEB SERVER
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
</head>

<body style="
  font-family: Arial, sans-serif;
  text-align: center;
  padding: 50px;
  background: #111;
  color: white;
">

  <h1>🤖 Bensocial WhatsApp Bot</h1>

  <p>✅ Bot server is running.</p>

  <p>WhatsApp connection is being handled by the bot.</p>

</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
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
// PAYMENT DETAILS
// ============================================================

const PAYMENT = {
  bank: "OPay",
  accountName: "TOLUWANI BENJAMIN/Bensocial",
  accountNumber: "6550518571"
};


// ============================================================
// CONNECTION CONTROL
// ============================================================

let starting = false;


// ============================================================
// START WHATSAPP
// ============================================================

async function startWhatsApp() {

  if (starting) {
    return;
  }

  starting = true;

  try {

    console.log("");
    console.log("======================================");
    console.log("🤖 BENSOCIAL WHATSAPP BOT");
    console.log("======================================");
    console.log("");


    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      "./auth_info_baileys"
    );


    // --------------------------------------------------------
    // CREATE SOCKET
    // --------------------------------------------------------

    const sock = makeWASocket({

      auth: state,

      logger: pino({
        level: "silent"
      }),

      printQRInTerminal: false,

      markOnlineOnConnect: false,

      syncFullHistory: false,

      browser: [
        "Bensocial Bot",
        "Chrome",
        "1.0.0"
      ]

    });


    // --------------------------------------------------------
    // SAVE CREDENTIALS
    // --------------------------------------------------------

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    // ========================================================
    // CONNECTION UPDATE
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
        // QR FALLBACK
        // ----------------------------------------------------

        if (qr) {

          console.log("");
          console.log("======================================");
          console.log("📱 WHATSAPP QR CODE");
          console.log("======================================");
          console.log("");

          qrcode.generate(
            qr,
            {
              small: true
            }
          );

          console.log("");
          console.log(
            "If you cannot scan the QR code,"
          );

          console.log(
            "use the pairing code below."
          );

          console.log("");

        }


        // ----------------------------------------------------
        // CONNECTED
        // ----------------------------------------------------

        if (connection === "open") {

          starting = false;

          console.log("");
          console.log("======================================");
          console.log("✅ WHATSAPP BOT CONNECTED");
          console.log("======================================");
          console.log("");

        }


        // ----------------------------------------------------
        // CLOSED
        // ----------------------------------------------------

        if (connection === "close") {

          starting = false;


          const statusCode =
            new Boom(
              lastDisconnect?.error
            )
              ?.output
              ?.statusCode;


          const shouldReconnect =
            statusCode !==
            DisconnectReason.loggedOut;


          console.log("");
          console.log(
            "❌ WhatsApp connection closed."
          );

          console.log(
            "Status code:",
            statusCode
          );

          console.log(
            "Reconnect:",
            shouldReconnect
          );


          if (shouldReconnect) {

            console.log(
              "🔄 Reconnecting in 5 seconds..."
            );

            setTimeout(
              startWhatsApp,
              5000
            );

          } else {

            console.log("");
            console.log(
              "⚠️ WhatsApp logged out."
            );

            console.log(
              "Delete auth_info_baileys and connect again."
            );

          }

        }

      }
    );


    // ========================================================
    // PAIRING CODE
    // ========================================================

    if (
      PAIRING_NUMBER &&
      !state.creds.registered
    ) {

      console.log("");
      console.log("======================================");
      console.log("📱 PAIRING MODE");
      console.log("======================================");
      console.log("");

      console.log(
        "Pairing number:"
      );

      console.log(
        PAIRING_NUMBER
      );

      console.log("");

      console.log(
        "⏳ Waiting 5 seconds before requesting code..."
      );

      console.log("");


      setTimeout(
        async () => {

          try {

            if (
              state.creds.registered
            ) {

              console.log(
                "✅ WhatsApp is already registered."
              );

              return;
            }


            console.log(
              "🔐 Requesting WhatsApp pairing code..."
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
              code
            );

            console.log("");

            console.log(
              "======================================"
            );

            console.log(
              "📱 ON YOUR PHONE"
            );

            console.log(
              "WhatsApp → Settings → Linked Devices"
            );

            console.log(
              "→ Link a Device → Link with phone number instead"
            );

            console.log(
              "Enter the code shown above."
            );

            console.log(
              "======================================"
            );

            console.log("");

          } catch (error) {

            console.log("");
            console.log(
              "❌ PAIRING CODE ERROR"
            );

            console.log(
              error?.message || error
            );

            console.log("");

          }

        },
        5000
      );

    }


    // ========================================================
    // MESSAGE HANDLER
    // ========================================================

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

        for (
          const message of messages
        ) {

          try {

            // ------------------------------------------------
            // Ignore invalid messages
            // ------------------------------------------------

            if (
              !message.message
            ) {
              continue;
            }


            // ------------------------------------------------
            // Ignore bot's own messages
            // ------------------------------------------------

            if (
              message.key.fromMe
            ) {
              continue;
            }


            const jid =
              message.key.remoteJid;


            if (!jid) {
              continue;
            }


            // ------------------------------------------------
            // GET MESSAGE TEXT
            // ------------------------------------------------

            const text =
              message.message.conversation ||

              message.message
                .extendedTextMessage
                ?.text ||

              message.message
                .imageMessage
                ?.caption ||

              "";


            const command =
              text
                .trim()
                .toLowerCase();


            if (!command) {
              continue;
            }


            console.log(
              `📩 Message from ${jid}: ${command}`
            );


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

🏦 Bank:
${PAYMENT.bank}

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

Available commands:

• *menu* — View services
• *1 - 13* — Select a service
• *payment* — Payment details
• *admin* — Contact admin
• *help* — Show help`
                }
              );

              continue;
            }


            // =================================================
            // DEFAULT RESPONSE
            // =================================================

            await sock.sendMessage(
              jid,
              {
                text:
`👋 *WELCOME TO BENSOCIAL!*

Send *menu* to view our available services.

Send *help* to see available commands.`
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


  } catch (error) {

    starting = false;

    console.log("");
    console.log(
      "❌ WhatsApp startup error:"
    );

    console.log(
      error?.message || error
    );

    console.log("");

    console.log(
      "🔄 Retrying in 10 seconds..."
    );


    setTimeout(
      startWhatsApp,
      10000
    );

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
`━━━━━━━━━━━━━━━━━━

💳 Send *payment* for payment details.

💬 Send *admin* to contact the admin.

ℹ️ Send *help* for help.`;


  await sock.sendMessage(
    jid,
    {
      text
    }
  );

}


// ============================================================
// SERVICE DETAILS
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

👤 ${ADMIN_NAME}

The admin number has not been configured.

Please configure ADMIN_NUMBER on Render.`
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
  // Notify admin
  // ----------------------------------------------------------

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
      "⚠️ Could not notify admin:"
    );

    console.log(
      error?.message || error
    );

  }

}


// ============================================================
// START
// ============================================================

console.log("");
console.log("======================================");
console.log("🚀 STARTING BENSOCIAL BOT");
console.log("======================================");
console.log("");

startWhatsApp();
