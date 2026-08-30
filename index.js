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


// ============================================================
// EXPRESS SERVER
// ============================================================

const app = express();

app.use(express.json());

let whatsappStatus = "Starting...";
let lastMessage = "None";
let lastMessageTime = "None";

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bensocial WhatsApp Bot</title>

<style>
body {
  background:#111;
  color:white;
  font-family:Arial,sans-serif;
  text-align:center;
  padding:40px 20px;
}

.box {
  max-width:600px;
  margin:auto;
  background:#1c1c1c;
  padding:30px;
  border-radius:20px;
}

h1 {
  font-size:35px;
}

.status {
  font-size:24px;
  margin:25px 0;
}

.info {
  background:#292929;
  padding:15px;
  border-radius:12px;
  margin-top:15px;
  text-align:left;
}

.green {
  color:#00ff88;
}

.yellow {
  color:#ffd000;
}

.red {
  color:#ff4444;
}
</style>

</head>

<body>

<div class="box">

<h1>🤖 Bensocial WhatsApp Bot</h1>

<div class="status">
${whatsappStatus}
</div>

<div class="info">
<b>Last message:</b><br>
${escapeHtml(lastMessage)}
</div>

<div class="info">
<b>Time:</b><br>
${lastMessageTime}
</div>

<br>

<p>
Send <b>hi</b> or <b>menu</b> to the WhatsApp bot.
</p>

</div>

</body>
</html>
`);
});

app.get("/status", (req, res) => {
  res.json({
    status: whatsappStatus,
    lastMessage,
    lastMessageTime
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("======================================");
  console.log("🌐 BENSOCIAL WEB SERVER");
  console.log("======================================");
  console.log("🌐 Port:", PORT);
  console.log("");
});


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(text) {

  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ============================================================
// SERVICES
// ============================================================

let SERVICES = [

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
// LOGGER
// ============================================================

const logger = pino({
  level: "silent"
});


// ============================================================
// BOT VARIABLES
// ============================================================

let sock = null;

let reconnecting = false;


// ============================================================
// GET MESSAGE TEXT
// ============================================================

function getMessageText(message) {

  if (!message) {
    return "";
  }


  // Normal text
  if (message.conversation) {
    return message.conversation;
  }


  // Extended text
  if (
    message.extendedTextMessage?.text
  ) {

    return message.extendedTextMessage.text;

  }


  // Image caption
  if (
    message.imageMessage?.caption
  ) {

    return message.imageMessage.caption;

  }


  // Video caption
  if (
    message.videoMessage?.caption
  ) {

    return message.videoMessage.caption;

  }


  // Document caption
  if (
    message.documentWithCaptionMessage?.message?.documentMessage?.caption
  ) {

    return message
      .documentWithCaptionMessage
      .message
      .documentMessage
      .caption;

  }


  // Ephemeral messages
  if (
    message.ephemeralMessage?.message
  ) {

    return getMessageText(
      message.ephemeralMessage.message
    );

  }


  // View once messages
  if (
    message.viewOnceMessage?.message
  ) {

    return getMessageText(
      message.viewOnceMessage.message
    );

  }


  // View once V2
  if (
    message.viewOnceMessageV2?.message
  ) {

    return getMessageText(
      message.viewOnceMessageV2.message
    );

  }


  return "";

}


// ============================================================
// START WHATSAPP
// ============================================================

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


    sock = makeWASocket({

      auth: state,

      logger,

      browser:
        Browsers.ubuntu("Chrome"),

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview:
        false,

      connectTimeoutMs:
        60_000,

      defaultQueryTimeoutMs:
        60_000,

      keepAliveIntervalMs:
        25_000

    });


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


        // ----------------------------------------------------
        // QR
        // ----------------------------------------------------

        if (qr) {

          whatsappStatus =
            "📱 QR CODE AVAILABLE";

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

          console.log(
            "Use WhatsApp → Linked Devices → Link a Device."
          );

          console.log("");

        }


        // ----------------------------------------------------
        // CONNECTING
        // ----------------------------------------------------

        if (
          connection === "connecting"
        ) {

          whatsappStatus =
            "🟡 WhatsApp connecting...";

          console.log(
            "🟡 WhatsApp connecting..."
          );

        }


        // ----------------------------------------------------
        // OPEN
        // ----------------------------------------------------

        if (
          connection === "open"
        ) {

          reconnecting = false;

          whatsappStatus =
            "🟢 WhatsApp CONNECTED";

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
            "🤖 Bensocial is ONLINE"
          );

          console.log("");

        }


        // ----------------------------------------------------
        // CLOSED
        // ----------------------------------------------------

        if (
          connection === "close"
        ) {

          whatsappStatus =
            "🔴 WhatsApp disconnected";

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

            console.log(
              "🔄 Reconnecting in 5 seconds..."
            );


            setTimeout(
              async () => {

                reconnecting = false;

                await startWhatsApp();

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
      console.log(
        "======================================"
      );

      console.log(
        "📱 WHATSAPP PAIRING"
      );

      console.log(
        "======================================"
      );

      console.log(
        "Number:",
        PAIRING_NUMBER
      );

      console.log("");


      try {

        /*
         * Give the socket time to establish
         * its connection before requesting
         * the pairing code.
         */

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              5000
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
          "🔐 WHATSAPP PAIRING CODE"
        );

        console.log(
          "======================================"
        );

        console.log("");

        console.log(
          "👉",
          code
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

        console.log("");
        console.log(
          "❌ PAIRING CODE ERROR"
        );

        console.log(
          error?.message ||
          error
        );

        console.log("");

      }

    }


    // ========================================================
    // INCOMING MESSAGES
    // ========================================================

    sock.ev.on(
      "messages.upsert",
      async (event) => {

        console.log("");
        console.log(
          "📩 MESSAGES UPSERT EVENT"
        );

        console.log(
          "Type:",
          event?.type
        );

        console.log(
          "Messages:",
          event?.messages?.length || 0
        );


        // Only process new notifications
        if (
          event?.type !== "notify"
        ) {

          console.log(
            "⏭️ Ignoring non-notify event."
          );

          return;

        }


        for (
          const message of
          event.messages || []
        ) {

          try {

            // ------------------------------------------------
            // NO MESSAGE
            // ------------------------------------------------

            if (
              !message?.message
            ) {

              console.log(
                "⏭️ Message has no content."
              );

              continue;

            }


            // ------------------------------------------------
            // OWN MESSAGE
            // ------------------------------------------------

            if (
              message.key?.fromMe
            ) {

              console.log(
                "⏭️ Ignoring bot's own message."
              );

              continue;

            }


            // ------------------------------------------------
            // JID
            // ------------------------------------------------

            const jid =
              message.key?.remoteJid;


            if (!jid) {

              console.log(
                "❌ No remote JID."
              );

              continue;

            }


            // ------------------------------------------------
            // TEXT
            // ------------------------------------------------

            const text =
              getMessageText(
                message.message
              );


            console.log("");
            console.log(
              "======================================"
            );

            console.log(
              "📩 MESSAGE RECEIVED"
            );

            console.log(
              "From:",
              jid
            );

            console.log(
              "Text:",
              text || "[NO TEXT]"
            );

            console.log(
              "======================================"
            );


            if (!text) {

              continue;

            }


            lastMessage =
              text;

            lastMessageTime =
              new Date().toLocaleString(
                "en-NG"
              );


            // ------------------------------------------------
            // NORMALIZE COMMAND
            // ------------------------------------------------

            const command =
              text
                .trim()
                .toLowerCase();


            // =================================================
            // ADMIN CHECK
            // =================================================

            const senderNumber =
              String(jid)
                .split("@")[0]
                .replace(/\D/g, "");


            const isAdmin =
              ADMIN_NUMBER &&
              senderNumber ===
              ADMIN_NUMBER;


            // =================================================
            // PING
            // =================================================

            if (
              command === "ping"
            ) {

              await sendText(
                jid,
                "🏓 *PONG!*\n\n✅ Bensocial bot is responding."
              );

              continue;

            }


            // =================================================
            // HI / HELLO / MENU
            // =================================================

            if (
              [
                "hi",
                "hello",
                "hey",
                "menu",
                "start"
              ].includes(command)
            ) {

              await sendMenu(
                sock,
                jid
              );

              continue;

            }


            // =================================================
            // SERVICES 1-13
            // =================================================

            const service =
              SERVICES.find(
                item =>
                  item.id ===
                  command
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
            // PAYMENT
            // =================================================

            if (
              [
                "payment",
                "pay",
                "account"
              ].includes(command)
            ) {

              await sendPayment(
                sock,
                jid
              );

              continue;

            }


            // =================================================
            // ADMIN CONTACT
            // =================================================

            if (
              [
                "admin",
                "contact admin",
                "adminhelp"
              ].includes(command)
            ) {

              await sendAdmin(
                sock,
                jid
              );

              continue;

            }


            // =================================================
            // HELP
            // =================================================

            if (
              command === "help"
            ) {

              await sendText(
                jid,
`🤖 *BENSOCIAL BOT*

Commands:

• hi
• menu
• 1 - ${SERVICES.length}
• payment
• admin
• ping
• help`
              );

              continue;

            }


            // =================================================
            // ADMIN SERVICE SYSTEM
            // =================================================

            if (
              command === "admin services" ||
              command === "serviceadmin"
            ) {

              if (!isAdmin) {

                await sendText(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await sendAdminServiceHelp(
                sock,
                jid
              );

              continue;

            }


            // -------------------------------------------------
            // ADD SERVICE
            // -------------------------------------------------

            if (
              command.startsWith(
                "addservice "
              )
            ) {

              if (!isAdmin) {

                await sendText(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await addService(
                sock,
                jid,
                text
              );

              continue;

            }


            // -------------------------------------------------
            // REMOVE SERVICE
            // -------------------------------------------------

            if (
              command.startsWith(
                "removeservice "
              )
            ) {

              if (!isAdmin) {

                await sendText(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await removeService(
                sock,
                jid,
                text
              );

              continue;

            }


            // -------------------------------------------------
            // EDIT SERVICE
            // -------------------------------------------------

            if (
              command.startsWith(
                "editservice "
              )
            ) {

              if (!isAdmin) {

                await sendText(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await editService(
                sock,
                jid,
                text
              );

              continue;

            }


            // -------------------------------------------------
            // DEFAULT
            // -------------------------------------------------

            await sendText(
              jid,
`👋 *WELCOME TO BENSOCIAL!*

I didn't understand that command.

Send *menu* to see our services.`
            );


          } catch (error) {

            console.log("");
            console.log(
              "❌ MESSAGE HANDLING ERROR"
            );

            console.log(
              error?.message ||
              error
            );

          }

        }

      }
    );


  } catch (error) {

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
      error?.message ||
      error
    );

    console.log(
      error?.stack ||
      ""
    );

  }

}


// ============================================================
// SEND TEXT
// ============================================================

async function sendText(
  jid,
  text
) {

  try {

    await sock.sendMessage(
      jid,
      {
        text
      }
    );

    console.log(
      "📤 REPLY SENT TO:",
      jid
    );

  } catch (error) {

    console.log(
      "❌ SEND ERROR:",
      error?.message ||
      error
    );

  }

}


// ============================================================
// MENU
// ============================================================

async function sendMenu(
  socket,
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
💰 ${service.price}
📦 Stock: ${service.stock}

`;

  }


  text +=
`━━━━━━━━━━━━━━━━━━

💳 Send *payment* for payment details.

💬 Send *admin* to contact admin.

ℹ️ Send *help* for commands.`;


  await socket.sendMessage(
    jid,
    {
      text
    }
  );


  console.log(
    "📤 MENU SENT TO:",
    jid
  );

}


// ============================================================
// SERVICE
// ============================================================

async function sendService(
  socket,
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

After payment, send your receipt/order details to the admin.

Send *admin* to contact admin.`;


  await socket.sendMessage(
    jid,
    {
      text
    }
  );


  console.log(
    "📤 SERVICE SENT:",
    service.name
  );

}


// ============================================================
// PAYMENT
// ============================================================

async function sendPayment(
  socket,
  jid
) {

  await socket.sendMessage(
    jid,
    {
      text:
`💳 *BENSOCIAL PAYMENT DETAILS*

🏦 Bank:
${PAYMENT.bank}

👤 Account Name:
${PAYMENT.accountName}

💳 Account Number:
${PAYMENT.accountNumber}

━━━━━━━━━━━━━━━━━━

After payment, send your receipt and order details to the admin.

Send *admin* to contact admin.`
    }
  );

}


// ============================================================
// ADMIN
// ============================================================

async function sendAdmin(
  socket,
  jid
) {

  if (!ADMIN_NUMBER) {

    await sendText(
      jid,
`💬 *CONTACT ADMIN*

Admin number is not configured.

Please add ADMIN_NUMBER to Render Environment Variables.`
    );

    return;

  }


  await socket.sendMessage(
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

    await socket.sendMessage(
      `${ADMIN_NUMBER}@s.whatsapp.net`,
      {
        text:
`🔔 *NEW CUSTOMER*

A customer wants to contact the admin.

Customer:
${jid.replace(
  "@s.whatsapp.net",
  ""
)}`
      }
    );

  } catch (error) {

    console.log(
      "⚠️ Admin notification failed:",
      error?.message
    );

  }

}


// ============================================================
// ADMIN SERVICE HELP
// ============================================================

async function sendAdminServiceHelp(
  socket,
  jid
) {

  await socket.sendMessage(
    jid,
    {
      text:
`🛠️ *SERVICE MANAGEMENT*

*ADD SERVICE*

addservice Name | Price | Stock

Example:
addservice Netflix | ₦5,000 | 20


*REMOVE SERVICE*

removeservice ID

Example:
removeservice 4


*EDIT SERVICE*

editservice ID | Name | Price | Stock

Example:
editservice 4 | Netflix Premium | ₦5,500 | 15


*VIEW SERVICES*

menu

Only the configured admin number can use these commands.`
    }
  );

}


// ============================================================
// ADD SERVICE
// ============================================================

async function addService(
  socket,
  jid,
  originalText
) {

  const data =
    originalText
      .substring(
        "addservice".length
      )
      .trim();


  const parts =
    data
      .split("|")
      .map(
        item =>
          item.trim()
      );


  if (
    parts.length < 3
  ) {

    await sendText(
      jid,
`❌ Wrong format.

Use:

addservice Name | Price | Stock

Example:

addservice Netflix | ₦5,000 | 20`
    );

    return;

  }


  const nextId =
    String(
      SERVICES.length
        ? Math.max(
            ...SERVICES.map(
              item =>
                Number(item.id) || 0
            )
          ) + 1
        : 1
    );


  const newService = {

    id: nextId,

    name: parts[0],

    price: parts[1],

    stock: parts[2]

  };


  SERVICES.push(
    newService
  );


  await sendText(
    jid,
`✅ *SERVICE ADDED*

ID: ${newService.id}

${newService.name}

💰 ${newService.price}

📦 Stock: ${newService.stock}`
  );

}


// ============================================================
// REMOVE SERVICE
// ============================================================

async function removeService(
  socket,
  jid,
  originalText
) {

  const id =
    originalText
      .substring(
        "removeservice".length
      )
      .trim();


  const index =
    SERVICES.findIndex(
      item =>
        item.id === id
    );


  if (
    index === -1
  ) {

    await sendText(
      jid,
      `❌ Service ID *${id}* was not found.`
    );

    return;

  }


  const removed =
    SERVICES[index];


  SERVICES.splice(
    index,
    1
  );


  await sendText(
    jid,
`✅ *SERVICE REMOVED*

${removed.name}

ID: ${removed.id}`
  );

}


// ============================================================
// EDIT SERVICE
// ============================================================

async function editService(
  socket,
  jid,
  originalText
) {

  const data =
    originalText
      .substring(
        "editservice".length
      )
      .trim();


  const parts =
    data
      .split("|")
      .map(
        item =>
          item.trim()
      );


  if (
    parts.length < 4
  ) {

    await sendText(
      jid,
`❌ Wrong format.

Use:

editservice ID | Name | Price | Stock

Example:

editservice 4 | Netflix Premium | ₦5,500 | 15`
    );

    return;

  }


  const id =
    parts[0];


  const service =
    SERVICES.find(
      item =>
        item.id === id
    );


  if (!service) {

    await sendText(
      jid,
      `❌ Service ID *${id}* was not found.`
    );

    return;

  }


  service.name =
    parts[1];

  service.price =
    parts[2];

  service.stock =
    parts[3];


  await sendText(
    jid,
`✅ *SERVICE UPDATED*

ID: ${service.id}

${service.name}

💰 ${service.price}

📦 Stock: ${service.stock}`
  );

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
  "ADMIN_NUMBER:",
  ADMIN_NUMBER || "NOT SET"
);

console.log(
  "PAIRING_NUMBER:",
  PAIRING_NUMBER || "NOT SET"
);

console.log("");

startWhatsApp();
