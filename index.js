import express from "express";

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";
import pino from "pino";
import { Boom } from "@hapi/boom";


// ============================================================
// SERVER
// ============================================================

const PORT = process.env.PORT || 10000;

const app = express();

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

        <p>✅ Bot server is running.</p>

        <p>
          WhatsApp connection is handled from the Render logs.
        </p>

      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});


// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "")
  .replace(/\D/g, "");

const ADMIN_NAME =
  process.env.ADMIN_NAME || "Bensocial Admin";

const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || "")
  .replace(/\D/g, "");


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
// WHATSAPP CONNECTION
// ============================================================

let reconnecting = false;


async function startWhatsApp() {

  try {

    console.log("");
    console.log("======================================");
    console.log("🤖 STARTING BENSOCIAL WHATSAPP BOT");
    console.log("======================================");
    console.log("");


    // --------------------------------------------------------
    // AUTH STATE
    // --------------------------------------------------------

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      "./auth_info_baileys"
    );


    console.log(
      "🔐 Existing WhatsApp session:",
      state.creds.registered
        ? "YES"
        : "NO"
    );


    // --------------------------------------------------------
    // SOCKET
    // --------------------------------------------------------

    const sock = makeWASocket({

      auth: state,

      logger: pino({
        level: "silent"
      }),

      browser:
        Browsers.ubuntu(
          "Chrome"
        ),

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview: false

    });


    // --------------------------------------------------------
    // SAVE CREDENTIALS
    // --------------------------------------------------------

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    // Prevent requesting pairing code repeatedly
    let pairingRequested = false;


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
        // QR / PAIRING STAGE
        // ----------------------------------------------------

        if (qr) {

          console.log("");
          console.log(
            "======================================"
          );

          console.log(
            "📱 WHATSAPP AUTHENTICATION"
          );

          console.log(
            "======================================"
          );


          // --------------------------------------------------
          // PAIRING CODE
          // --------------------------------------------------

          if (
            !state.creds.registered &&
            PAIRING_NUMBER &&
            !pairingRequested
          ) {

            pairingRequested = true;

            console.log("");
            console.log(
              `🔐 Requesting pairing code for: ${PAIRING_NUMBER}`
            );

            console.log("");


            try {

              /*
               * Wait briefly so the socket has time
               * to establish the WebSocket connection.
               */

              await new Promise(
                resolve =>
                  setTimeout(
                    resolve,
                    3000
                  )
              );


              const code =
                await sock.requestPairingCode(
                  PAIRING_NUMBER
                );


              console.log("");
              console.log(
                "======================================"
              );

              console.log(
                "🔑 WHATSAPP PAIRING CODE"
              );

              console.log(
                "======================================"
              );

              console.log("");

              console.log(
                `   ${code}`
              );

              console.log("");

              console.log(
                "======================================"
              );

              console.log("");

              console.log(
                "📱 On your phone:"
              );

              console.log(
                "WhatsApp → Settings → Linked Devices"
              );

              console.log(
                "→ Link a Device"
              );

              console.log(
                "→ Link with phone number instead"
              );

              console.log("");

              console.log(
                `Enter this code: ${code}`
              );

              console.log("");

            } catch (error) {

              pairingRequested = false;

              console.log("");

              console.log(
                "❌ Pairing code request failed"
              );

              console.log(
                "Error:",
                error?.message || error
              );

              console.log("");

              console.log(
                "📱 QR code fallback:"
              );

              console.log("");

              qrcode.generate(
                qr,
                {
                  small: true
                }
              );

              console.log("");

              console.log(
                "Scan the QR code with WhatsApp."
              );

              console.log("");

            }

          }

          // --------------------------------------------------
          // QR FALLBACK
          // --------------------------------------------------

          if (
            state.creds.registered ||
            !PAIRING_NUMBER
          ) {

            console.log("");
            console.log(
              "📱 Scan this QR code with WhatsApp:"
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

        }


        // ----------------------------------------------------
        // CONNECTING
        // ----------------------------------------------------

        if (
          connection === "connecting"
        ) {

          console.log(
            "🔄 Connecting to WhatsApp..."
          );

        }


        // ----------------------------------------------------
        // CONNECTED
        // ----------------------------------------------------

        if (
          connection === "open"
        ) {

          reconnecting = false;

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


        // ----------------------------------------------------
        // DISCONNECTED
        // ----------------------------------------------------

        if (
          connection === "close"
        ) {

          const statusCode =
            new Boom(
              lastDisconnect?.error
            )?.output?.statusCode;


          console.log("");
          console.log(
            "❌ WHATSAPP CONNECTION CLOSED"
          );

          console.log(
            "Status code:",
            statusCode
          );

          console.log("");


          // --------------------------------------------------
          // LOGGED OUT
          // --------------------------------------------------

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            console.log(
              "⚠️ WhatsApp logged out."
            );

            console.log(
              "Delete auth_info_baileys and pair again."
            );

            return;

          }


          // --------------------------------------------------
          // RESTART REQUIRED
          // --------------------------------------------------

          if (
            statusCode ===
            DisconnectReason.restartRequired
          ) {

            console.log(
              "🔄 WhatsApp requested a restart."
            );

          }


          // --------------------------------------------------
          // RECONNECT
          // --------------------------------------------------

          if (!reconnecting) {

            reconnecting = true;

            console.log(
              "🔄 Reconnecting in 5 seconds..."
            );


            setTimeout(
              () => {

                reconnecting = false;

                startWhatsApp();

              },
              5000
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
      async ({
        messages
      }) => {

        for (
          const message
          of messages
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


            // ------------------------------------------------
            // GET MESSAGE TEXT
            // ------------------------------------------------

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

              command === "start" ||

              command === "1"

            ) {

              await sendMenu(
                sock,
                jid
              );

              continue;

            }


            // =================================================
            // SERVICE
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

Send *menu* to view our services.

Commands:

• *menu* - View services
• *1 - 13* - Select a service
• *payment* - Payment details
• *admin* - Contact admin
• *help* - Help`
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

    console.log("");
    console.log(
      "❌ FAILED TO START WHATSAPP"
    );

    console.log(
      "Error:",
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
    const service
    of SERVICES
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

ℹ️ Send *help* for more commands.`;


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

The admin number has not been configured yet.`
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
https://wa.me/${ADMIN_NUMBER}

You can contact the admin using the link above.`
    }
  );


  // ----------------------------------------------------------
  // NOTIFY ADMIN
  // ----------------------------------------------------------

  try {

    await sock.sendMessage(
      adminJid,
      {
        text:
`🔔 *NEW CUSTOMER REQUEST*

A customer requested to contact the admin.

👤 Customer:
${jid.replace(
  "@s.whatsapp.net",
  ""
)}

Please contact the customer.`
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

console.log(
  "PAIRING_NUMBER:",
  PAIRING_NUMBER
    ? "Configured"
    : "Not configured"
);

console.log(
  "ADMIN_NUMBER:",
  ADMIN_NUMBER
    ? "Configured"
    : "Not configured"
);

console.log("");

startWhatsApp();
