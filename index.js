import express from "express";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";

import pino from "pino";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";


// ============================================================
// BASIC CONFIG
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 10000;

const ADMIN_NUMBER = (process.env.ADMIN_NUMBER || "")
  .replace(/\D/g, "");

const ADMIN_NAME =
  process.env.ADMIN_NAME || "Bensocial Admin";

const PAIRING_NUMBER =
  (process.env.PAIRING_NUMBER || "")
    .replace(/\D/g, "");


// ============================================================
// EXPRESS
// ============================================================

const app = express();

app.use(express.json());


// ============================================================
// BOT STATUS
// ============================================================

let botStatus = "Starting...";
let currentQR = null;
let pairingCode = null;
let whatsappConnected = false;


// ============================================================
// SERVICES FILE
// ============================================================

const SERVICES_FILE =
  path.join(__dirname, "services.json");


// ============================================================
// DEFAULT SERVICES
// ============================================================

const DEFAULT_SERVICES = [
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
// LOAD SERVICES
// ============================================================

let SERVICES = [];

function loadServices() {

  try {

    if (fs.existsSync(SERVICES_FILE)) {

      const data =
        fs.readFileSync(
          SERVICES_FILE,
          "utf8"
        );

      SERVICES = JSON.parse(data);

      console.log(
        `✅ Loaded ${SERVICES.length} services`
      );

    } else {

      SERVICES = DEFAULT_SERVICES;

      saveServices();

      console.log(
        "✅ Created services.json"
      );

    }

  } catch (error) {

    console.log(
      "⚠️ Could not load services:",
      error.message
    );

    SERVICES = DEFAULT_SERVICES;

  }

}


function saveServices() {

  try {

    fs.writeFileSync(
      SERVICES_FILE,
      JSON.stringify(
        SERVICES,
        null,
        2
      )
    );

  } catch (error) {

    console.log(
      "❌ Could not save services:",
      error.message
    );

  }

}


loadServices();


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

<title>
Bensocial WhatsApp Bot
</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  background:
  #111;

  color:
  white;

  font-family:
  Arial, sans-serif;

  text-align:
  center;

  padding:
  30px 15px;

}

.container {

  max-width:
  650px;

  margin:
  auto;

}

h1 {

  font-size:
  42px;

  margin-top:
  40px;

}

.status {

  margin:
  30px 0;

  padding:
  20px;

  border-radius:
  15px;

  background:
  #1d1d1d;

}

.connected {

  color:
  #00e676;

}

.waiting {

  color:
  #ffca28;

}

.error {

  color:
  #ff5252;

}

.qr-box {

  background:
  white;

  padding:
  20px;

  border-radius:
  20px;

  display:
  inline-block;

  margin-top:
  20px;

}

.qr-box img {

  width:
  280px;

  height:
  280px;

  display:
  block;

}

.instructions {

  margin-top:
  25px;

  padding:
  20px;

  background:
  #1d1d1d;

  border-radius:
  15px;

  line-height:
  1.7;

}

.code {

  font-size:
  30px;

  font-weight:
  bold;

  letter-spacing:
  5px;

  margin:
  20px;

  color:
  #00e676;

}

.small {

  color:
  #aaa;

  margin-top:
  30px;

}

</style>

</head>


<body>


<div class="container">


<h1>
🤖 Bensocial
<br>
WhatsApp Bot
</h1>


<div
class="status"
id="status"
>

⏳ Starting WhatsApp...

</div>


<div
id="qrArea"
>
</div>


<div
id="pairingArea"
>
</div>


<div class="instructions">

<h2>
📱 Connect WhatsApp
</h2>

<p>

Open WhatsApp on your phone.

</p>

<p>

<strong>
Settings → Linked Devices → Link a Device
</strong>

</p>

<p>

Scan the QR code shown above.

</p>

</div>


<p class="small">

Bensocial WhatsApp Bot

</p>


</div>


<script>

async function updateStatus() {

  try {

    const response =
      await fetch("/api/status");

    const data =
      await response.json();


    const status =
      document.getElementById(
        "status"
      );


    const qrArea =
      document.getElementById(
        "qrArea"
      );


    const pairingArea =
      document.getElementById(
        "pairingArea"
      );


    // STATUS

    if (data.connected) {

      status.className =
        "status connected";

      status.innerHTML =
        "✅ WhatsApp Bot is Connected";

      qrArea.innerHTML = "";

      pairingArea.innerHTML = "";

    }

    else if (data.qr) {

      status.className =
        "status waiting";

      status.innerHTML =
        "📱 Scan the QR code with WhatsApp";


      qrArea.innerHTML =

        '<div class="qr-box">' +

        '<img src="' +
        data.qr +
        '" alt="WhatsApp QR Code">' +

        '</div>';

    }

    else {

      status.className =
        "status waiting";

      status.innerHTML =
        "⏳ " +
        data.status;

      qrArea.innerHTML = "";

    }


    // PAIRING CODE

    if (
      data.pairingCode &&
      !data.connected
    ) {

      pairingArea.innerHTML =

        '<div class="instructions">' +

        '<h2>🔐 Pairing Code</h2>' +

        '<div class="code">' +

        data.pairingCode +

        '</div>' +

        '<p>' +

        'WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number instead.' +

        '</p>' +

        '</div>';

    }

  }

  catch (error) {

    console.log(error);

  }

}


// Update immediately

updateStatus();


// Update every 2 seconds

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
// STATUS API
// ============================================================

app.get(
  "/api/status",
  (req, res) => {

    res.json({

      connected:
        whatsappConnected,

      status:
        botStatus,

      qr:
        currentQR,

      pairingCode:
        pairingCode

    });

  }
);


// ============================================================
// WEB SERVER
// ============================================================

app.listen(
  PORT,
  () => {

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

  }
);


// ============================================================
// RECONNECT CONTROL
// ============================================================

let reconnecting = false;


// ============================================================
// START WHATSAPP
// ============================================================

async function startWhatsApp() {

  try {

    botStatus =
      "Starting WhatsApp...";

    whatsappConnected =
      false;

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


    // --------------------------------------------------------
    // AUTH
    // --------------------------------------------------------

    const {
      state,
      saveCreds
    } =
      await useMultiFileAuthState(
        "./auth_info_baileys"
      );


    // --------------------------------------------------------
    // SOCKET
    // --------------------------------------------------------

    const sock =
      makeWASocket({

        auth:
          state,

        logger,

        browser:
          Browsers.ubuntu(
            "Chrome"
          ),

        markOnlineOnConnect:
          false,

        syncFullHistory:
          false,

        generateHighQualityLinkPreview:
          false

      });


    // --------------------------------------------------------
    // SAVE CREDENTIALS
    // --------------------------------------------------------

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    // --------------------------------------------------------
    // CONNECTION UPDATE
    // --------------------------------------------------------

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect,
          qr
        } = update;


        // ====================================================
        // QR GENERATED
        // ====================================================

        if (qr) {

          try {

            currentQR =
              await QRCode.toDataURL(
                qr,
                {
                  width: 400,
                  margin: 2
                }
              );

            botStatus =
              "QR code ready — scan it with WhatsApp";

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

            console.log(
              "✅ QR code ready"
            );

            console.log(
              "🌐 Open the Render URL to scan it."
            );

            console.log("");

          } catch (error) {

            console.log(
              "❌ QR conversion error:",
              error.message
            );

          }

        }


        // ====================================================
        // CONNECTED
        // ====================================================

        if (
          connection === "open"
        ) {

          whatsappConnected =
            true;

          botStatus =
            "WhatsApp connected";

          currentQR =
            null;

          pairingCode =
            null;

          reconnecting =
            false;


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

          console.log(
            "🤖 Bensocial is now online."
          );

          console.log("");

        }


        // ====================================================
        // CLOSED
        // ====================================================

        if (
          connection === "close"
        ) {

          whatsappConnected =
            false;

          currentQR =
            null;

          const statusCode =
            new Boom(
              lastDisconnect?.error
            )?.output?.statusCode;


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

            botStatus =
              "Reconnecting WhatsApp...";


            console.log("");

            console.log(
              "🔄 Restarting WhatsApp connection..."
            );


            setTimeout(
              () => {

                reconnecting =
                  false;

                startWhatsApp();

              },
              5000
            );

          }

          else {

            botStatus =
              "WhatsApp logged out. New QR may be required.";

            console.log("");

            console.log(
              "⚠️ WhatsApp session logged out."
            );

          }

        }

      }
    );


    // ========================================================
    // OPTIONAL PAIRING CODE
    // ========================================================

    if (
      !state.creds.registered &&
      PAIRING_NUMBER
    ) {

      console.log("");

      console.log(
        "📱 Pairing number detected:"
      );

      console.log(
        PAIRING_NUMBER
      );


      try {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              5000
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


        pairingCode =
          code;


        botStatus =
          "Pairing code ready";


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

        console.log("");

        console.log(
          `👉 ${code}`
        );

        console.log("");

      }

      catch (error) {

        console.log("");

        console.log(
          "❌ PAIRING CODE ERROR"
        );

        console.log(
          error?.message
        );

        console.log("");

      }

    }


    // ========================================================
    // MESSAGES
    // ========================================================

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
              jid.endsWith(
                "@g.us"
              )
            ) {

              continue;

            }


            const text =
              message.message.conversation ||

              message.message
                .extendedTextMessage
                ?.text ||

              message.message
                .imageMessage
                ?.caption ||

              "";


            const cleanText =
              text.trim();


            const command =
              cleanText.toLowerCase();


            if (
              !command
            ) {

              continue;

            }


            console.log(
              `📩 Message from ${jid}: ${cleanText}`
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
            // SERVICES LIST
            // =================================================

            if (
              command === "services" ||
              command === "listservices"
            ) {

              await sendMenu(
                sock,
                jid
              );

              continue;

            }


            // =================================================
            // SERVICE NUMBER
            // =================================================

            const service =
              SERVICES.find(
                item =>
                  item.id === command
              );


            if (
              service
            ) {

              await sendService(
                sock,
                jid,
                service
              );

              continue;

            }


            // =================================================
            // ADMIN HELP
            // =================================================

            if (
              command === "adminhelp" ||
              command === "admin menu"
            ) {

              if (
                !isAdmin(jid)
              ) {

                await sock.sendMessage(
                  jid,
                  {
                    text:
`❌ *ACCESS DENIED*

You are not the bot administrator.`
                  }
                );

                continue;

              }


              await sendAdminHelp(
                sock,
                jid
              );

              continue;

            }


            // =================================================
            // ADD SERVICE
            // =================================================

            if (
              command.startsWith(
                "addservice "
              ) ||
              command.startsWith(
                "add "
              )
            ) {

              if (
                !isAdmin(jid)
              ) {

                await sendAccessDenied(
                  sock,
                  jid
                );

                continue;

              }


              await addServiceCommand(
                sock,
                jid,
                cleanText
              );

              continue;

            }


            // =================================================
            // EDIT SERVICE
            // =================================================

            if (
              command.startsWith(
                "editservice "
              ) ||
              command.startsWith(
                "edit "
              )
            ) {

              if (
                !isAdmin(jid)
              ) {

                await sendAccessDenied(
                  sock,
                  jid
                );

                continue;

              }


              await editServiceCommand(
                sock,
                jid,
                cleanText
              );

              continue;

            }


            // =================================================
            // REMOVE SERVICE
            // =================================================

            if (
              command.startsWith(
                "removeservice "
              ) ||
              command.startsWith(
                "remove "
              ) ||
              command.startsWith(
                "delete "
              )
            ) {

              if (
                !isAdmin(jid)
              ) {

                await sendAccessDenied(
                  sock,
                  jid
                );

                continue;

              }


              await removeServiceCommand(
                sock,
                jid,
                cleanText
              );

              continue;

            }


            // =================================================
            // ADMIN CONTACT
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

Customer commands:

• menu
• services
• 1 - ${SERVICES.length}
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
              "❌ Message handling error:",
              error?.message
            );

          }

        }

      }
    );


  }

  catch (error) {

    whatsappConnected =
      false;

    botStatus =
      "WhatsApp startup error";

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

    if (
      !reconnecting
    ) {

      reconnecting =
        true;

      setTimeout(
        () => {

          reconnecting =
            false;

          startWhatsApp();

        },
        10000
      );

    }

  }

}


// ============================================================
// CHECK ADMIN
// ============================================================

function isAdmin(jid) {

  if (
    !ADMIN_NUMBER
  ) {

    return false;

  }


  const number =
    jid
      .replace(
        "@s.whatsapp.net",
        ""
      )
      .replace(
        /\D/g,
        ""
      );


  return (
    number === ADMIN_NUMBER
  );

}


// ============================================================
// ACCESS DENIED
// ============================================================

async function sendAccessDenied(
  sock,
  jid
) {

  await sock.sendMessage(
    jid,
    {
      text:
`❌ *ACCESS DENIED*

Only the bot administrator can manage services.`
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


  if (
    SERVICES.length === 0
  ) {

    text +=
      "No services are currently available.";

  }


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
// ADMIN HELP
// ============================================================

async function sendAdminHelp(
  sock,
  jid
) {

  const text =
`🔐 *BENSOCIAL ADMIN PANEL*

📋 *VIEW SERVICES*

services

➕ *ADD SERVICE*

addservice Name | Price | Stock

Example:

addservice 🇬🇧 UK WhatsApp | ₦5,000 | 10

✏️ *EDIT SERVICE*

editservice ID | Name | Price | Stock

Example:

editservice 14 | 🇬🇧 UK WhatsApp | ₦6,000 | 20

🗑️ *REMOVE SERVICE*

removeservice ID

Example:

removeservice 14

━━━━━━━━━━━━━━━━━━

Only the configured ADMIN_NUMBER can use these commands.`;


  await sock.sendMessage(
    jid,
    {
      text
    }
  );

}


// ============================================================
// ADD SERVICE
// ============================================================

async function addServiceCommand(
  sock,
  jid,
  originalText
) {

  const parts =
    originalText
      .replace(
        /^addservice\s+/i,
        ""
      )
      .replace(
        /^add\s+/i,
        ""
      )
      .split("|")
      .map(
        item =>
          item.trim()
      );


  if (
    parts.length !== 3
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ *INVALID FORMAT*

Use:

addservice Name | Price | Stock

Example:

addservice 🇬🇧 UK WhatsApp | ₦5,000 | 10`
      }
    );

    return;

  }


  const [
    name,
    price,
    stock
  ] = parts;


  const nextId =
    getNextServiceId();


  const newService = {

    id:
      nextId,

    name:
      name,

    price:
      price,

    stock:
      stock

  };


  SERVICES.push(
    newService
  );


  saveServices();


  await sock.sendMessage(
    jid,
    {
      text:
`✅ *SERVICE ADDED*

🆔 ID: ${nextId}

📱 ${name}

💰 ${price}

📦 Stock: ${stock}`
    }
  );

}


// ============================================================
// EDIT SERVICE
// ============================================================

async function editServiceCommand(
  sock,
  jid,
  originalText
) {

  const parts =
    originalText
      .replace(
        /^editservice\s+/i,
        ""
      )
      .replace(
        /^edit\s+/i,
        ""
      )
      .split("|")
      .map(
        item =>
          item.trim()
      );


  if (
    parts.length !== 4
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ *INVALID FORMAT*

Use:

editservice ID | Name | Price | Stock

Example:

editservice 14 | 🇬🇧 UK WhatsApp | ₦6,000 | 20`
      }
    );

    return;

  }


  const [
    id,
    name,
    price,
    stock
  ] = parts;


  const service =
    SERVICES.find(
      item =>
        item.id === id
    );


  if (
    !service
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Service ID *${id}* was not found.

Send *services* to see the service IDs.`
      }
    );

    return;

  }


  service.name =
    name;

  service.price =
    price;

  service.stock =
    stock;


  saveServices();


  await sock.sendMessage(
    jid,
    {
      text:
`✅ *SERVICE UPDATED*

🆔 ID: ${id}

📱 ${name}

💰 ${price}

📦 Stock: ${stock}`
    }
  );

}


// ============================================================
// REMOVE SERVICE
// ============================================================

async function removeServiceCommand(
  sock,
  jid,
  originalText
) {

  const id =
    originalText
      .replace(
        /^removeservice\s+/i,
        ""
      )
      .replace(
        /^remove\s+/i,
        ""
      )
      .replace(
        /^delete\s+/i,
        ""
      )
      .trim();


  if (
    !id
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ *INVALID FORMAT*

Use:

removeservice ID

Example:

removeservice 14`
      }
    );

    return;

  }


  const index =
    SERVICES.findIndex(
      item =>
        item.id === id
    );


  if (
    index === -1
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Service ID *${id}* was not found.`
      }
    );

    return;

  }


  const removed =
    SERVICES[index];


  SERVICES.splice(
    index,
    1
  );


  saveServices();


  await sock.sendMessage(
    jid,
    {
      text:
`✅ *SERVICE REMOVED*

🆔 ID: ${removed.id}

📱 ${removed.name}`
    }
  );

}


// ============================================================
// GET NEXT SERVICE ID
// ============================================================

function getNextServiceId() {

  if (
    SERVICES.length === 0
  ) {

    return "1";

  }


  const numbers =
    SERVICES
      .map(
        service =>
          parseInt(
            service.id,
            10
          )
      )
      .filter(
        number =>
          !isNaN(number)
      );


  if (
    numbers.length === 0
  ) {

    return "1";

  }


  return String(
    Math.max(
      ...numbers
    ) + 1
  );

}


// ============================================================
// CONTACT ADMIN
// ============================================================

async function sendAdmin(
  sock,
  jid
) {

  if (
    !ADMIN_NUMBER
  ) {

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


  const adminJid =
    `${ADMIN_NUMBER}@s.whatsapp.net`;


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

  }

  catch (error) {

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
  "ADMIN_NUMBER:",
  ADMIN_NUMBER || "NOT SET"
);

console.log(
  "ADMIN_NAME:",
  ADMIN_NAME
);

console.log(
  "PAIRING_NUMBER:",
  PAIRING_NUMBER || "NOT SET"
);

console.log("");

startWhatsApp();
