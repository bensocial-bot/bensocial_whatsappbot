import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState
} from "@whiskeysockets/baileys";

import qrcode from "qrcode-terminal";
import pino from "pino";
import { Boom } from "@hapi/boom";

const PORT = process.env.PORT || 10000;

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "")
  .replace(/\D/g, "");

const ADMIN_NAME =
  process.env.ADMIN_NAME || "Bensocial Admin";

const PAIRING_NUMBER = (process.env.PAIRING_NUMBER || "")
  .replace(/\D/g, "");

const app = express();

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Bensocial WhatsApp Bot</title>
      </head>
      <body style="font-family:Arial;text-align:center;padding:50px">
        <h1>🤖 Bensocial WhatsApp Bot</h1>
        <p>Bot is running.</p>
        <p>Check the Render logs for the WhatsApp connection status.</p>
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
// PAYMENT
// ============================================================

const PAYMENT = {
  bank: "OPay",
  accountName: "TOLUWANI BENJAMIN/Bensocial",
  accountNumber: "6550518571"
};


// ============================================================
// WHATSAPP
// ============================================================

let reconnecting = false;

async function startWhatsApp() {

  try {

    const { state, saveCreds } =
      await useMultiFileAuthState("./auth_info_baileys");

    const sock = makeWASocket({
      auth: state,

      logger: pino({
        level: "silent"
      }),

      markOnlineOnConnect: false,

      syncFullHistory: false,

      browser: [
        "Bensocial",
        "Chrome",
        "1.0.0"
      ]
    });


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
          console.log(
            "======================================"
          );
          console.log(
            "📱 WHATSAPP QR CODE"
          );
          console.log(
            "======================================"
          );

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


        // ----------------------------------------------------
        // CONNECTION OPEN
        // ----------------------------------------------------

        if (connection === "open") {

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
        // CONNECTION CLOSED
        // ----------------------------------------------------

        if (connection === "close") {

          const statusCode =
            new Boom(
              lastDisconnect?.error
            )?.output?.statusCode;


          console.log("");
          console.log(
            "❌ WhatsApp connection closed."
          );

          console.log(
            "Status code:",
            statusCode
          );


          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            console.log(
              "⚠️ WhatsApp logged out."
            );

            console.log(
              "Delete auth_info_baileys and redeploy."
            );

            return;
          }


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
    // PAIRING CODE
    // ========================================================

    if (
      PAIRING_NUMBER &&
      !sock.authState?.creds?.registered
    ) {

      console.log("");
      console.log(
        "======================================"
      );
      console.log(
        "📱 REQUESTING WHATSAPP PAIRING CODE"
      );
      console.log(
        "======================================"
      );

      console.log(
        `Phone: ${PAIRING_NUMBER}`
      );


      try {

        const code =
          await sock.requestPairingCode(
            PAIRING_NUMBER
          );


        console.log("");
        console.log(
          "======================================"
        );
        console.log(
          "🔐 WHATSAPP PAIRING CODE"
        );
        console.log(
          "======================================"
        );

        console.log(
          code
        );

        console.log(
          "======================================"
        );

        console.log("");
        console.log(
          "On your WhatsApp:"
        );

        console.log(
          "Settings → Linked Devices → Link a Device → Link with phone number instead"
        );

        console.log("");
      }

      catch (error) {

        console.log(
          "❌ Pairing code error:"
        );

        console.log(
          error?.message || error
        );
      }
    }


    // ========================================================
    // MESSAGES
    // ========================================================

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

        for (const message of messages) {

          try {

            if (!message.message) {
              continue;
            }

            if (message.key.fromMe) {
              continue;
            }


            const jid =
              message.key.remoteJid;


            if (!jid) {
              continue;
            }


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

          }

          catch (error) {

            console.log(
              "❌ Message error:",
              error?.message || error
            );
          }
        }
      }
    );

  }

  catch (error) {

    console.log("");
    console.log(
      "❌ WhatsApp startup error:"
    );

    console.log(
      error?.message || error
    );

    console.log(
      "🔄 Restarting in 10 seconds..."
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
`💳 Send *payment* for payment details.

💬 Send *admin* to contact the admin.

❓ Send *help* for help.`;


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

After payment, send your payment receipt/order details to the admin.

💬 Send *admin* to contact the admin.`;


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

${ADMIN_NAME}

The admin number has not been configured yet.`
      }
    );

    return;
  }


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


  // Notify admin

  try {

    const adminJid =
      `${ADMIN_NUMBER}@s.whatsapp.net`;


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

  }

  catch (error) {

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

startWhatsApp();
