import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import QRCode from "qrcode";
import pino from "pino";
import { Boom } from "@hapi/boom";

const PORT = process.env.PORT || 10000;

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "")
  .replace(/\D/g, "");

const ADMIN_NAME = process.env.ADMIN_NAME || "Bensocial Admin";

const app = express();

// ============================================================
// QR CODE STORAGE
// ============================================================

let latestQR = null;

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
        font-family: Arial;
        text-align: center;
        padding: 50px;
        background: #111;
        color: white;
      ">

        <h1>🤖 Bensocial WhatsApp Bot</h1>

        <p>Bot is running successfully.</p>

        <a href="/qr" style="
          display:inline-block;
          padding:15px 25px;
          background:#25D366;
          color:white;
          text-decoration:none;
          border-radius:8px;
          font-weight:bold;
        ">
          📱 Open WhatsApp QR Code
        </a>

      </body>
    </html>
  `);
});


// ============================================================
// QR CODE PAGE
// ============================================================

app.get("/qr", async (req, res) => {

  if (!latestQR) {

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>WhatsApp QR</title>
        </head>

        <body style="
          font-family:Arial;
          text-align:center;
          padding:50px;
        ">

          <h2>📱 WhatsApp QR Code</h2>

          <p>
            QR code is not available yet.
          </p>

          <p>
            Wait a few seconds and refresh this page.
          </p>

          <button onclick="location.reload()" style="
            padding:12px 20px;
            font-size:16px;
          ">
            🔄 Refresh
          </button>

        </body>
      </html>
    `);

  }

  try {

    const qrImage =
      await QRCode.toDataURL(latestQR);

    res.send(`
      <!DOCTYPE html>
      <html>

        <head>
          <meta name="viewport"
                content="width=device-width, initial-scale=1">

          <title>WhatsApp QR Code</title>
        </head>

        <body style="
          font-family:Arial;
          text-align:center;
          padding:30px;
          background:#111;
          color:white;
        ">

          <h2>📱 Connect WhatsApp</h2>

          <p>
            Open WhatsApp on your phone.
          </p>

          <p>
            Go to:
          </p>

          <strong>
            Settings → Linked Devices → Link a Device
          </strong>

          <br><br>

          <img
            src="${qrImage}"
            style="
              width:300px;
              height:300px;
              background:white;
              padding:10px;
              border-radius:10px;
            "
          >

          <p>
            Scan the QR code above.
          </p>

          <button onclick="location.reload()" style="
            padding:12px 20px;
            font-size:16px;
            margin-top:15px;
          ">
            🔄 Refresh QR
          </button>

        </body>

      </html>
    `);

  } catch (error) {

    console.error(
      "QR generation error:",
      error
    );

    res.status(500).send(
      "Could not generate QR code."
    );
  }

});


// ============================================================
// START WEB SERVER
// ============================================================

app.listen(PORT, () => {

  console.log(
    `🌐 Web server running on port ${PORT}`
  );

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

  accountName:
    "TOLUWANI BENJAMIN/Bensocial",

  accountNumber:
    "6550518571"

};


// ============================================================
// WHATSAPP CONNECTION
// ============================================================

async function startWhatsApp() {

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

    markOnlineOnConnect: false,

    syncFullHistory: false

  });


  // Save WhatsApp credentials
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
      // NEW QR CODE
      // ====================================================

      if (qr) {

        latestQR = qr;

        console.log("");

        console.log(
          "======================================"
        );

        console.log(
          "📱 WHATSAPP QR CODE READY"
        );

        console.log(
          "======================================"
        );

        console.log(
          `Open https://bensocial-whatsappbot.onrender.com/qr`
        );

        console.log("");

      }


      // ====================================================
      // CONNECTED
      // ====================================================

      if (connection === "open") {

        latestQR = null;

        console.log("");

        console.log(
          "======================================"
        );

        console.log(
          "✅ WHATSAPP BOT CONNECTED"
        );

        console.log(
          "======================================"
        );

        console.log("");

      }


      // ====================================================
      // DISCONNECTED
      // ====================================================

      if (connection === "close") {

        const statusCode =
          new Boom(
            lastDisconnect?.error
          )
            ?.output
            ?.statusCode;


        const shouldReconnect =
          statusCode !==
          DisconnectReason.loggedOut;


        console.log(
          "❌ WhatsApp connection closed."
        );


        console.log(
          "Reconnect:",
          shouldReconnect
        );


        if (shouldReconnect) {

          console.log(
            "🔄 Reconnecting..."
          );


          setTimeout(
            startWhatsApp,
            3000
          );


        } else {

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
  // MESSAGES
  // ========================================================

  sock.ev.on(
    "messages.upsert",
    async ({ messages }) => {

      for (const message of messages) {

        if (!message.message) {
          continue;
        }


        if (message.key.fromMe) {
          continue;
        }


        const jid =
          message.key.remoteJid;


        const text =
          message.message.conversation ||

          message.message.extendedTextMessage
            ?.text ||

          message.message.imageMessage
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
        // START / MENU
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
`💳 PAYMENT DETAILS

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
`🤖 BENSOCIAL BOT

Send "menu" to view our services.

You can also send:

• 1 - 13 to select a service
• payment - Payment details
• admin - Contact the admin`
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
`👋 Welcome to Bensocial!

Send *menu* to view our available services.`
          }
        );

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

🛍️ Choose a service:

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
// SERVICE DETAILS
// ============================================================

async function sendService(
  sock,
  jid,
  service
) {

  const text =
`${service.name}

💰 Price: ${service.price}
📦 Stock: ${service.stock}

💳 PAYMENT DETAILS

🏦 Bank: ${PAYMENT.bank}

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
// CONTACT ADMIN
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
`💬 Contact Admin

Please contact Bensocial Admin.

ADMIN_NUMBER has not been configured yet.`
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

You can contact the admin here:

https://wa.me/${ADMIN_NUMBER}`
    }
  );


  // ========================================================
  // NOTIFY ADMIN
  // ========================================================

  try {

    await sock.sendMessage(
      adminJid,
      {
        text:
`🔔 NEW CUSTOMER

A customer has requested to contact the admin.

Customer:
${jid.replace(
  "@s.whatsapp.net",
  ""
)}`
      }
    );

  } catch (error) {

    console.log(
      "Could not notify admin:",
      error.message
    );

  }

}


// ============================================================
// START BOT
// ============================================================

console.log("");

console.log(
  "======================================"
);

console.log(
  "🤖 BENSOCIAL WHATSAPP BOT"
);

console.log(
  "======================================"
);

console.log("");

startWhatsApp();
