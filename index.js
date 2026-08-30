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
// WEB SERVER
// ============================================================

const app = express();

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Bensocial WhatsApp Bot</title>
</head>

<body style="
  background:#111;
  color:white;
  font-family:Arial,sans-serif;
  text-align:center;
  padding:50px 20px;
">

  <h1>🤖 Bensocial WhatsApp Bot</h1>

  <h2>🟢 Server is running</h2>

  <p>
    WhatsApp bot is running in the background.
  </p>

  <p>
    Send <b>ping</b> to the bot to test it.
  </p>

</body>
</html>
`);
});

app.listen(PORT, () => {
  console.log("======================================");
  console.log("🌐 BENSOCIAL WEB SERVER");
  console.log("======================================");
  console.log("Port:", PORT);
  console.log("");
});


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
// SOCKET
// ============================================================

let sock = null;
let reconnectTimer = null;


// ============================================================
// MESSAGE TEXT EXTRACTOR
// ============================================================

function getText(message) {

  if (!message) {
    return "";
  }

  if (message.conversation) {
    return message.conversation;
  }

  if (message.extendedTextMessage?.text) {
    return message.extendedTextMessage.text;
  }

  if (message.imageMessage?.caption) {
    return message.imageMessage.caption;
  }

  if (message.videoMessage?.caption) {
    return message.videoMessage.caption;
  }

  if (message.documentMessage?.caption) {
    return message.documentMessage.caption;
  }

  if (message.ephemeralMessage?.message) {
    return getText(
      message.ephemeralMessage.message
    );
  }

  if (message.viewOnceMessage?.message) {
    return getText(
      message.viewOnceMessage.message
    );
  }

  if (message.viewOnceMessageV2?.message) {
    return getText(
      message.viewOnceMessageV2.message
    );
  }

  return "";
}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage(jid, text) {

  try {

    if (!sock) {
      console.log("❌ Socket is not available.");
      return;
    }

    await sock.sendMessage(jid, {
      text
    });

    console.log("📤 REPLY SENT");
    console.log("To:", jid);

  } catch (error) {

    console.log("❌ SEND MESSAGE ERROR:");
    console.log(error?.message || error);

  }
}


// ============================================================
// START WHATSAPP
// ============================================================

async function startWhatsApp() {

  try {

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

    sock = makeWASocket({

      auth: state,

      logger,

      browser:
        Browsers.ubuntu("Chrome"),

      markOnlineOnConnect: false,

      syncFullHistory: false,

      generateHighQualityLinkPreview:
        false,

      connectTimeoutMs: 60000,

      defaultQueryTimeoutMs: 60000,

      keepAliveIntervalMs: 25000

    });


    // ========================================================
    // SAVE LOGIN
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
          console.log("📱 QR CODE GENERATED");
          console.log("======================================");
          console.log("");

          console.log(
            "A WhatsApp QR code is available."
          );

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

          console.log(
            "🟡 WhatsApp connecting..."
          );

        }


        // ----------------------------------------------------
        // CONNECTED
        // ----------------------------------------------------

        if (
          connection === "open"
        ) {

          console.log("");
          console.log("======================================");
          console.log("✅ WHATSAPP BOT CONNECTED");
          console.log("======================================");
          console.log("");

          console.log(
            "🤖 Bensocial is ONLINE"
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
          console.log("======================================");
          console.log("❌ WHATSAPP DISCONNECTED");
          console.log("======================================");

          console.log(
            "Status:",
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


          if (shouldReconnect) {

            console.log(
              "🔄 Reconnecting in 5 seconds..."
            );


            if (!reconnectTimer) {

              reconnectTimer =
                setTimeout(
                  async () => {

                    reconnectTimer =
                      null;

                    await startWhatsApp();

                  },
                  5000
                );

            }

          } else {

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
      console.log("📱 REQUESTING PAIRING CODE");
      console.log("======================================");
      console.log("");

      console.log(
        "Number:",
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
          "WhatsApp → Settings → Linked Devices"
        );

        console.log(
          "→ Link a Device → Link with phone number instead"
        );

        console.log("");

      } catch (error) {

        console.log("");
        console.log("❌ PAIRING ERROR");
        console.log(
          error?.message || error
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
        console.log("======================================");
        console.log("📩 MESSAGE EVENT RECEIVED");
        console.log("======================================");

        console.log(
          "Type:",
          event?.type
        );

        console.log(
          "Number of messages:",
          event?.messages?.length || 0
        );


        // Only new messages
        if (
          event?.type !== "notify"
        ) {

          console.log(
            "⏭️ Not a new-message event."
          );

          return;

        }


        for (
          const message of
          event.messages || []
        ) {

          try {

            // ------------------------------------------------
            // IGNORE EMPTY MESSAGE
            // ------------------------------------------------

            if (
              !message?.message
            ) {

              console.log(
                "⏭️ Empty message."
              );

              continue;

            }


            // ------------------------------------------------
            // IGNORE OWN MESSAGE
            // ------------------------------------------------

            if (
              message.key?.fromMe
            ) {

              console.log(
                "⏭️ Message sent by bot itself."
              );

              continue;

            }


            // ------------------------------------------------
            // GET JID
            // ------------------------------------------------

            const jid =
              message.key?.remoteJid;


            if (!jid) {

              console.log(
                "❌ No sender JID."
              );

              continue;

            }


            // ------------------------------------------------
            // GET TEXT
            // ------------------------------------------------

            const text =
              getText(
                message.message
              );


            console.log("");
            console.log("📩 INCOMING MESSAGE");
            console.log("From:", jid);
            console.log(
              "Text:",
              text || "[NO TEXT]"
            );
            console.log("");


            if (!text) {

              continue;

            }


            const command =
              text
                .trim()
                .toLowerCase();


            // =================================================
            // ADMIN CHECK
            // =================================================

            const senderNumber =
              jid
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

              await sendMessage(
                jid,
                `🏓 *PONG!*

✅ Bensocial bot is working.`
              );

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
                  item.id ===
                  command
              );


            if (service) {

              await sendService(
                jid,
                service
              );

              continue;

            }


            // =================================================
            // PAYMENT
            // =================================================

            if (
              command === "payment" ||
              command === "pay" ||
              command === "account"
            ) {

              await sendPayment(
                jid
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

              await sendMessage(
                jid,
`🤖 *BENSOCIAL BOT*

Commands:

• hi
• menu
• 1 - ${SERVICES.length}
• payment
• admin
• ping
• help

Admin commands:

• admin services
• addservice
• removeservice
• editservice`
              );

              continue;

            }


            // =================================================
            // ADMIN SERVICE MENU
            // =================================================

            if (
              command === "admin services"
            ) {

              if (!isAdmin) {

                await sendMessage(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await sendAdminServices(
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
              )
            ) {

              if (!isAdmin) {

                await sendMessage(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await addService(
                jid,
                text
              );

              continue;

            }


            // =================================================
            // REMOVE SERVICE
            // =================================================

            if (
              command.startsWith(
                "removeservice "
              )
            ) {

              if (!isAdmin) {

                await sendMessage(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await removeService(
                jid,
                text
              );

              continue;

            }


            // =================================================
            // EDIT SERVICE
            // =================================================

            if (
              command.startsWith(
                "editservice "
              )
            ) {

              if (!isAdmin) {

                await sendMessage(
                  jid,
                  "❌ Admin access only."
                );

                continue;

              }


              await editService(
                jid,
                text
              );

              continue;

            }


            // =================================================
            // DEFAULT
            // =================================================

            await sendMessage(
              jid,
`👋 *WELCOME TO BENSOCIAL!*

I didn't understand that command.

Send *menu* to see our services.

Send *help* to see available commands.`
            );


          } catch (error) {

            console.log("");
            console.log(
              "❌ MESSAGE PROCESSING ERROR"
            );

            console.log(
              error?.message || error
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
      error?.message || error
    );

    console.log(
      error?.stack || ""
    );

    console.log("");

    setTimeout(
      startWhatsApp,
      10000
    );

  }

}


// ============================================================
// MENU
// ============================================================

async function sendMenu(jid) {

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

💬 Send *admin* to contact admin.

ℹ️ Send *help* for commands.`;


  await sendMessage(
    jid,
    text
  );

}


// ============================================================
// SERVICE DETAILS
// ============================================================

async function sendService(
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


  await sendMessage(
    jid,
    text
  );

}


// ============================================================
// PAYMENT
// ============================================================

async function sendPayment(jid) {

  await sendMessage(
    jid,
`💳 *BENSOCIAL PAYMENT DETAILS*

🏦 Bank:
${PAYMENT.bank}

👤 Account Name:
${PAYMENT.accountName}

💳 Account Number:
${PAYMENT.accountNumber}

━━━━━━━━━━━━━━━━━━

After payment, send your payment receipt and order details to the admin.

Send *admin* to contact admin.`
  );

}


// ============================================================
// ADMIN CONTACT
// ============================================================

async function sendAdmin(jid) {

  if (!ADMIN_NUMBER) {

    await sendMessage(
      jid,
`💬 *CONTACT ADMIN*

The admin number has not been configured.

Please add ADMIN_NUMBER in Render Environment Variables.`
    );

    return;

  }


  await sendMessage(
    jid,
`💬 *CONTACT ADMIN*

👤 ${ADMIN_NAME}

📞 WhatsApp:
https://wa.me/${ADMIN_NUMBER}`
  );


  try {

    await sock.sendMessage(
      `${ADMIN_NUMBER}@s.whatsapp.net`,
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
      "⚠️ Admin notification failed:",
      error?.message || error
    );

  }

}


// ============================================================
// ADMIN SERVICE HELP
// ============================================================

async function sendAdminServices(jid) {

  await sendMessage(
    jid,
`🛠️ *SERVICE MANAGEMENT*

*ADD SERVICE*

addservice Name | Price | Stock

Example:
addservice Netflix Premium | ₦5,000 | 20


*REMOVE SERVICE*

removeservice ID

Example:
removeservice 4


*EDIT SERVICE*

editservice ID | Name | Price | Stock

Example:
editservice 4 | Netflix Premium | ₦5,500 | 15


*VIEW SERVICES*

Send:
menu`
  );

}


// ============================================================
// ADD SERVICE
// ============================================================

async function addService(
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
    parts.length < 3 ||
    !parts[0] ||
    !parts[1] ||
    !parts[2]
  ) {

    await sendMessage(
      jid,
`❌ *WRONG FORMAT*

Use:

addservice Name | Price | Stock

Example:

addservice Netflix Premium | ₦5,000 | 20`
    );

    return;

  }


  const highestId =
    SERVICES.length
      ? Math.max(
          ...SERVICES.map(
            item =>
              Number(item.id) || 0
          )
        )
      : 0;


  const service = {

    id:
      String(
        highestId + 1
      ),

    name:
      parts[0],

    price:
      parts[1],

    stock:
      parts[2]

  };


  SERVICES.push(
    service
  );


  await sendMessage(
    jid,
`✅ *SERVICE ADDED*

ID: ${service.id}

${service.name}

💰 ${service.price}

📦 Stock: ${service.stock}`
  );

}


// ============================================================
// REMOVE SERVICE
// ============================================================

async function removeService(
  jid,
  originalText
) {

  const id =
    originalText
      .substring(
        "removeservice".length
      )
      .trim();


  if (!id) {

    await sendMessage(
      jid,
      "❌ Enter the service ID."
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

    await sendMessage(
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


  await sendMessage(
    jid,
`✅ *SERVICE REMOVED*

ID: ${removed.id}

${removed.name}`
  );

}


// ============================================================
// EDIT SERVICE
// ============================================================

async function editService(
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

    await sendMessage(
      jid,
`❌ *WRONG FORMAT*

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

    await sendMessage(
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


  await sendMessage(
    jid,
`✅ *SERVICE UPDATED*

ID: ${service.id}

${service.name}

💰 ${service.price}

📦 Stock: ${service.stock}`
  );

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
  "ADMIN_NUMBER:",
  ADMIN_NUMBER || "NOT SET"
);

console.log(
  "PAIRING_NUMBER:",
  PAIRING_NUMBER || "NOT SET"
);

console.log("");

startWhatsApp();
