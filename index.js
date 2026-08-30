import express from "express";

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";

import pino from "pino";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";


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
// EXPRESS SERVER
// ============================================================

const app = express();


// ============================================================
// WHATSAPP STATUS
// ============================================================

let whatsappStatus = "Starting WhatsApp...";

let currentQR = null;

let currentQRCodeImage = null;

let currentPairingCode = null;

let pairingRequested = false;

let sockInstance = null;


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
// WEBSITE
// ============================================================

app.get("/", async (req, res) => {

  let qrHTML = "";

  if (currentQRCodeImage) {

    qrHTML = `
      <div style="
        margin:30px auto;
        padding:20px;
        background:white;
        width:max-content;
        border-radius:15px;
      ">

        <img
          src="${currentQRCodeImage}"
          alt="WhatsApp QR Code"
          style="
            width:280px;
            max-width:80vw;
            display:block;
          "
        >

      </div>

      <p style="font-size:18px;">
        📱 Open WhatsApp → Linked Devices → Link a Device
      </p>

      <p style="font-size:18px;">
        Scan the QR code above.
      </p>
    `;

  } else {

    qrHTML = `
      <div style="
        margin:30px auto;
        padding:25px;
        background:#1c1c1c;
        border-radius:15px;
        max-width:500px;
      ">

        <h3>📱 QR CODE</h3>

        <p>
          QR code is not available right now.
        </p>

      </div>
    `;

  }


  let pairingHTML = "";

  if (currentPairingCode) {

    pairingHTML = `
      <div style="
        margin:30px auto;
        padding:25px;
        background:#1c1c1c;
        border-radius:15px;
        max-width:500px;
      ">

        <h2>🔐 WhatsApp Pairing Code</h2>

        <div style="
          font-size:32px;
          font-weight:bold;
          letter-spacing:6px;
          background:#000;
          padding:20px;
          border-radius:10px;
          margin:20px 0;
        ">
          ${currentPairingCode}
        </div>

        <p>
          On your phone:
        </p>

        <p>
          WhatsApp → Settings → Linked Devices
        </p>

        <p>
          → Link a Device
        </p>

        <p>
          → Link with phone number instead
        </p>

        <p>
          Enter the code above.
        </p>

      </div>
    `;

  } else {

    pairingHTML = `
      <div style="
        margin:30px auto;
        padding:20px;
        background:#1c1c1c;
        border-radius:15px;
        max-width:500px;
      ">

        <h3>🔐 Pairing Code</h3>

        <p>
          ${PAIRING_NUMBER
            ? "Waiting for WhatsApp pairing code..."
            : "PAIRING_NUMBER is not configured."
          }
        </p>

      </div>
    `;

  }


  res.send(`
<!DOCTYPE html>

<html>

<head>

  <title>Bensocial WhatsApp Bot</title>

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <meta
    http-equiv="refresh"
    content="10"
  >

</head>


<body style="
  background:#111;
  color:white;
  font-family:Arial,sans-serif;
  text-align:center;
  padding:30px 15px;
">


<h1 style="font-size:38px;">
  🤖 Bensocial WhatsApp Bot
</h1>


<div style="
  margin:25px auto;
  padding:20px;
  max-width:500px;
  background:#191919;
  border-radius:15px;
">

  <h2>
    ${whatsappStatus}
  </h2>

</div>


${pairingHTML}


${qrHTML}


<div style="
  margin:30px auto;
  max-width:500px;
  padding:20px;
  background:#191919;
  border-radius:15px;
">

  <p>
    🌐 Bot server is running.
  </p>

  <p>
    This page automatically refreshes every 10 seconds.
  </p>

</div>


</body>

</html>
`);

});


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/health", (req, res) => {

  res.json({
    status: "ok",
    whatsapp: whatsappStatus
  });

});


// ============================================================
// START WEB SERVER
// ============================================================

app.listen(PORT, () => {

  console.log("");
  console.log("======================================");
  console.log("🌐 BENSOCIAL WEB SERVER");
  console.log("======================================");

  console.log(
    `🌐 Port: ${PORT}`
  );

  console.log(
    "======================================"
  );

});


// ============================================================
// WHATSAPP
// ============================================================

let reconnectTimer = null;

let starting = false;


async function startWhatsApp() {

  if (starting) {
    return;
  }

  starting = true;

  try {

    console.log("");
    console.log("======================================");
    console.log("🤖 STARTING BENSOCIAL WHATSAPP BOT");
    console.log("======================================");

    whatsappStatus = "⏳ Starting WhatsApp...";

    currentQR = null;

    currentQRCodeImage = null;

    currentPairingCode = null;

    pairingRequested = false;


    // ========================================================
    // AUTH STATE
    // ========================================================

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      "./auth_info_baileys"
    );


    // ========================================================
    // CREATE SOCKET
    // ========================================================

    const sock = makeWASocket({

      auth: state,

      logger,

      browser: Browsers.ubuntu(
        "Bensocial Bot"
      ),

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview: false

    });


    sockInstance = sock;


    // ========================================================
    // SAVE CREDENTIALS
    // ========================================================

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


        // ====================================================
        // QR CODE
        // ====================================================

        if (qr) {

          console.log("");
          console.log("======================================");
          console.log("📱 WHATSAPP QR CODE GENERATED");
          console.log("======================================");

          whatsappStatus =
            "📱 WhatsApp QR code is ready";

          currentQR = qr;

          currentPairingCode = null;


          try {

            currentQRCodeImage =
              await QRCode.toDataURL(
                qr,
                {
                  width: 400,
                  margin: 2
                }
              );

            console.log(
              "✅ QR code converted to web image."
            );

          } catch (error) {

            console.log(
              "❌ QR image error:",
              error?.message
            );

          }


          console.log(
            "Open the Render URL to see the QR."
          );

          console.log("");

        }


        // ====================================================
        // CONNECTING
        // ====================================================

        if (
          connection === "connecting"
        ) {

          whatsappStatus =
            "🔄 Connecting to WhatsApp...";

          console.log(
            "🔄 Connecting to WhatsApp..."
          );

        }


        // ====================================================
        // CONNECTED
        // ====================================================

        if (
          connection === "open"
        ) {

          starting = false;

          whatsappStatus =
            "✅ WhatsApp Bot Connected";

          currentQR = null;

          currentQRCodeImage = null;

          currentPairingCode = null;

          pairingRequested = true;

          console.log("");
          console.log("======================================");
          console.log("✅ WHATSAPP BOT CONNECTED");
          console.log("======================================");

          console.log(
            "🤖 Bensocial is now online."
          );

          console.log("");

        }


        // ====================================================
        // CONNECTION CLOSED
        // ====================================================

        if (
          connection === "close"
        ) {

          starting = false;

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
            "Unknown error"
          );


          // ==================================================
          // LOGGED OUT
          // ==================================================

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            whatsappStatus =
              "⚠️ WhatsApp logged out — new pairing required";

            currentQR = null;

            currentQRCodeImage = null;

            currentPairingCode = null;

            console.log("");
            console.log(
              "⚠️ WhatsApp session was logged out."
            );

            console.log(
              "Delete auth_info_baileys and create a new session."
            );

            console.log("");

            return;

          }


          // ==================================================
          // OTHER DISCONNECT
          // ==================================================

          whatsappStatus =
            "🔄 WhatsApp disconnected — reconnecting...";


          if (!reconnectTimer) {

            reconnectTimer =
              setTimeout(
                () => {

                  reconnectTimer = null;

                  startWhatsApp();

                },
                5000
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
      console.log("🔐 WHATSAPP PAIRING");
      console.log("======================================");

      console.log(
        "📞 Number:",
        PAIRING_NUMBER
      );


      /*
       * Wait for the WhatsApp socket to become usable.
       * The request is made only once.
       */

      setTimeout(
        async () => {

          if (pairingRequested) {
            return;
          }


          if (
            state.creds.registered
          ) {
            return;
          }


          try {

            pairingRequested = true;

            whatsappStatus =
              "🔐 Generating WhatsApp pairing code...";


            console.log("");
            console.log(
              "🔐 Requesting WhatsApp pairing code..."
            );


            const code =
              await sock.requestPairingCode(
                PAIRING_NUMBER
              );


            currentPairingCode = code;

            currentQR = null;

            currentQRCodeImage = null;

            whatsappStatus =
              "🔐 WhatsApp pairing code is ready";


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
              "Open the Render website to see the code."
            );

            console.log("");

            console.log(
              "WhatsApp → Settings → Linked Devices"
            );

            console.log(
              "→ Link a Device → Link with phone number instead"
            );

            console.log("");

          } catch (error) {

            pairingRequested = false;

            whatsappStatus =
              "❌ Pairing code error — check Render logs";


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
              "======================================");

          }

        },
        5000
      );

    } else {

      console.log(
        "ℹ️ No pairing number configured."
      );

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


            if (!jid) {
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

🏦 Bank:
${PAYMENT.bank}

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

    starting = false;

    whatsappStatus =
      "❌ WhatsApp startup error";


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
// START BOT
// ============================================================

console.log("");
console.log("======================================");
console.log("🤖 BENSOCIAL WHATSAPP BOT");
console.log("======================================");

console.log(
  "PAIRING_NUMBER:",
  PAIRING_NUMBER || "NOT SET"
);

console.log(
  "ADMIN_NUMBER:",
  ADMIN_NUMBER || "NOT SET"
);

console.log("");

startWhatsApp();
