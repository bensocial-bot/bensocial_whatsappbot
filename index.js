import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";

import pino from "pino";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";

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
// GLOBAL WHATSAPP STATUS
// ============================================================

let whatsappStatus = "Starting...";
let currentQR = null;
let currentPairingCode = null;
let whatsappSocket = null;
let reconnecting = false;


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
// WEB PAGE
// ============================================================

app.get("/", (req, res) => {

  res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
>

<title>Bensocial WhatsApp Bot</title>

<style>

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 30px 20px;
  background: #111;
  color: white;
  font-family: Arial, sans-serif;
  text-align: center;
}

.container {
  max-width: 650px;
  margin: auto;
}

h1 {
  font-size: 42px;
  margin-top: 30px;
}

h2 {
  margin-top: 35px;
}

.status {
  font-size: 22px;
  margin: 25px 0;
}

.card {
  background: #1d1d1d;
  border-radius: 18px;
  padding: 25px;
  margin-top: 25px;
}

.qr-box {
  background: white;
  padding: 15px;
  border-radius: 15px;
  display: inline-block;
  margin-top: 20px;
}

.qr-box img {
  width: 280px;
  height: 280px;
  display: block;
}

.pairing {
  margin-top: 25px;
  font-size: 18px;
}

.code {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 5px;
  background: #000;
  padding: 15px;
  border-radius: 10px;
  margin-top: 15px;
}

.instructions {
  margin-top: 25px;
  line-height: 1.7;
  color: #ddd;
}

.connected {
  color: #00e676;
}

.waiting {
  color: #ffca28;
}

.error {
  color: #ff5252;
}

.small {
  color: #999;
  font-size: 14px;
  margin-top: 25px;
}

</style>

</head>


<body>

<div class="container">

<h1>🤖 Bensocial<br>WhatsApp Bot</h1>

<div
  id="status"
  class="status waiting"
>
⏳ Starting WhatsApp...
</div>


<div
  id="qrCard"
  class="card"
  style="display:none;"
>

<h2>📱 Scan WhatsApp QR Code</h2>

<div class="qr-box">

<img
  id="qrImage"
  src=""
  alt="WhatsApp QR Code"
>

</div>

<div class="instructions">

<p>
Open WhatsApp on your phone.
</p>

<p>
<strong>
Settings → Linked Devices → Link a Device
</strong>
</p>

<p>
Then scan this QR code.
</p>

</div>

</div>


<div
  id="pairingCard"
  class="card"
  style="display:none;"
>

<h2>🔐 WhatsApp Pairing Code</h2>

<p>
If a pairing code is available, enter it in WhatsApp.
</p>

<div
  id="pairingCode"
  class="code"
>
--------
</div>

<div class="instructions">

<p>
WhatsApp → Settings → Linked Devices
</p>

<p>
→ Link a Device
</p>

<p>
→ Link with phone number instead
</p>

</div>

</div>


<div
  id="connectedCard"
  class="card"
  style="display:none;"
>

<h2>🎉 WhatsApp Connected</h2>

<p>
✅ Bensocial WhatsApp Bot is online.
</p>

<p>
You can now use the bot normally.
</p>

</div>


<div class="small">

Bensocial WhatsApp Bot

</div>

</div>


<script>

async function updateStatus() {

  try {

    const response =
      await fetch("/api/status");

    const data =
      await response.json();


    const status =
      document.getElementById("status");

    const qrCard =
      document.getElementById("qrCard");

    const qrImage =
      document.getElementById("qrImage");

    const pairingCard =
      document.getElementById("pairingCard");

    const pairingCode =
      document.getElementById("pairingCode");

    const connectedCard =
      document.getElementById("connectedCard");


    status.className = "status";


    // ========================================================
    // CONNECTED
    // ========================================================

    if (data.connected) {

      status.innerHTML =
        "🟢 WhatsApp is connected";

      status.classList.add("connected");

      qrCard.style.display = "none";

      pairingCard.style.display = "none";

      connectedCard.style.display = "block";

      return;
    }


    // ========================================================
    // QR AVAILABLE
    // ========================================================

    if (data.qr) {

      status.innerHTML =
        "📱 Scan the QR code below";

      status.classList.add("waiting");

      qrCard.style.display = "block";

      qrImage.src =
        data.qr;

    } else {

      qrCard.style.display = "none";

    }


    // ========================================================
    // PAIRING CODE
    // ========================================================

    if (data.pairingCode) {

      pairingCard.style.display = "block";

      pairingCode.innerText =
        data.pairingCode;

    } else {

      pairingCard.style.display = "none";

    }


    connectedCard.style.display =
      "none";


  } catch (error) {

    console.log(error);

  }

}


// Check immediately
updateStatus();


// Check every 2 seconds
setInterval(
  updateStatus,
  2000
);

</script>


</body>

</html>
`);

});


// ============================================================
// API STATUS
// ============================================================

app.get("/api/status", (req, res) => {

  res.json({

    status: whatsappStatus,

    connected:
      whatsappStatus === "connected",

    qr:
      currentQR,

    pairingCode:
      currentPairingCode

  });

});


// ============================================================
// START WEB SERVER
// ============================================================

app.listen(PORT, () => {

  console.log("");

  console.log(
    "======================================"
  );

  console.log(
    "🌐 BENSOCIAL WEB SERVER"
  );

  console.log(
    "======================================"
  );

  console.log(
    `🌐 Port: ${PORT}`
  );

  console.log("");

});


// ============================================================
// WHATSAPP
// ============================================================

async function startWhatsApp() {

  try {

    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "🤖 STARTING BENSOCIAL WHATSAPP BOT"
    );

    console.log(
      "======================================"
    );

    console.log("");


    whatsappStatus =
      "connecting";

    currentQR = null;

    currentPairingCode = null;


    const {
      state,
      saveCreds
    } =
      await useMultiFileAuthState(
        "./auth_info_baileys"
      );


    const sock =
      makeWASocket({

        auth: state,

        logger,

        browser:
          Browsers.ubuntu(
            "Chrome"
          ),

        markOnlineOnConnect: false,

        syncFullHistory: false,

        generateHighQualityLinkPreview:
          false

      });


    whatsappSocket =
      sock;


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

          try {

            console.log("");

            console.log(
              "======================================"
            );

            console.log(
              "📱 WHATSAPP QR CODE GENERATED"
            );

            console.log(
              "======================================"
            );

            console.log("");

            // Convert WhatsApp QR string
            // into an actual image

            currentQR =
              await QRCode.toDataURL(
                qr,
                {
                  width: 400,
                  margin: 2
                }
              );


            whatsappStatus =
              "qr_ready";


            console.log(
              "✅ QR code is ready."
            );

            console.log(
              "🌐 Open your Render URL to scan it."
            );

            console.log("");

          } catch (error) {

            console.log(
              "❌ QR generation error:",
              error?.message
            );

          }

        }


        // ====================================================
        // CONNECTED
        // ====================================================

        if (
          connection === "open"
        ) {

          reconnecting =
            false;

          whatsappStatus =
            "connected";

          currentQR =
            null;

          currentPairingCode =
            null;


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

          const statusCode =
            new Boom(
              lastDisconnect?.error
            )?.output?.statusCode;


          whatsappStatus =
            "disconnected";


          currentQR =
            null;


          console.log("");

          console.log(
            "======================================"
          );

          console.log(
            "❌ WHATSAPP CONNECTION CLOSED"
          );

          console.log(
            "======================================"
          );


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

            reconnecting =
              true;


            console.log(
              "🔄 Restarting WhatsApp in 5 seconds..."
            );


            setTimeout(
              () => {

                reconnecting =
                  false;

                startWhatsApp();

              },
              5000
            );

          } else {

            whatsappStatus =
              "logged_out";


            console.log(
              "⚠️ WhatsApp session logged out."
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

    whatsappStatus =
      "error";


    console.log("");

    console.log(
      "======================================"
    );

    console.log(
      "❌ WHATSAPP START ERROR"
    );

    console.log(
      "======================================"
    );

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
  PAIRING_NUMBER || "NOT SET"
);

console.log("");

startWhatsApp();
