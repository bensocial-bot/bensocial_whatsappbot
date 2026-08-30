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


// ============================================================
// CONFIG
// ============================================================

const PORT = process.env.PORT || 10000;

const ADMIN_NUMBER =
  (process.env.ADMIN_NUMBER || "")
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


// ============================================================
// BOT STATUS
// ============================================================

let whatsappStatus =
  "⏳ Starting WhatsApp...";

let currentQRCodeImage = null;

let currentPairingCode = null;

let pairingRequested = false;

let reconnectTimer = null;

let starting = false;


// ============================================================
// SERVICES FILE
// ============================================================

const SERVICES_FILE =
  path.join(
    process.cwd(),
    "services.json"
  );


// ============================================================
// DEFAULT SERVICES
// ============================================================

const DEFAULT_SERVICES = [
  {
    id: 1,
    name: "📱 WhatsApp Number",
    price: "₦4,500",
    stock: "Available"
  },
  {
    id: 2,
    name: "📲 TextNow",
    price: "₦2,200",
    stock: "Available"
  },
  {
    id: 3,
    name: "🌐 eSIM",
    price: "₦25,000",
    stock: "Available"
  },
  {
    id: 4,
    name: "📘 Facebook",
    price: "₦2,300",
    stock: "Available"
  },
  {
    id: 5,
    name: "🐦 Twitter",
    price: "₦2,860",
    stock: "Available"
  },
  {
    id: 6,
    name: "🇺🇸 USA Facebook",
    price: "₦2,200",
    stock: "35"
  },
  {
    id: 7,
    name: "📹 2026 Video Call Tools",
    price: "₦56,000",
    stock: "7"
  },
  {
    id: 8,
    name: "✅ Telegram Verification",
    price: "₦10,000",
    stock: "9"
  },
  {
    id: 9,
    name: "🍎 Apple iCloud",
    price: "₦7,000",
    stock: "24"
  },
  {
    id: 10,
    name: "🇫🇷 France TikTok",
    price: "₦1,800",
    stock: "6"
  },
  {
    id: 11,
    name: "🔐 HMA VPN — 1 Month",
    price: "₦3,780",
    stock: "62"
  },
  {
    id: 12,
    name: "🔐 ExpressVPN — 1 Month",
    price: "₦3,800",
    stock: "25"
  },
  {
    id: 13,
    name: "📸 USA Instagram",
    price: "₦2,300",
    stock: "23"
  }
];


// ============================================================
// LOAD SERVICES
// ============================================================

function loadServices() {

  try {

    if (
      fs.existsSync(
        SERVICES_FILE
      )
    ) {

      const data =
        fs.readFileSync(
          SERVICES_FILE,
          "utf8"
        );

      const services =
        JSON.parse(data);

      if (
        Array.isArray(services)
      ) {

        return services;

      }

    }

  } catch (error) {

    console.log(
      "⚠️ Could not load services:",
      error.message
    );

  }


  saveServices(
    DEFAULT_SERVICES
  );

  return [
    ...DEFAULT_SERVICES
  ];
}


// ============================================================
// SAVE SERVICES
// ============================================================

function saveServices(
  services
) {

  try {

    fs.writeFileSync(
      SERVICES_FILE,
      JSON.stringify(
        services,
        null,
        2
      ),
      "utf8"
    );

    return true;

  } catch (error) {

    console.log(
      "❌ Could not save services:",
      error.message
    );

    return false;

  }

}


let SERVICES =
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

const logger =
  pino({
    level: "silent"
  });


// ============================================================
// WEBSITE
// ============================================================

app.get(
  "/",
  async (req, res) => {

    let qrHTML = "";


    if (
      currentQRCodeImage
    ) {

      qrHTML = `

      <div style="
        margin:30px auto;
        padding:20px;
        background:white;
        width:max-content;
        max-width:90%;
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

      <p>
        📱 Open WhatsApp →
        Linked Devices →
        Link a Device
      </p>

      <p>
        Scan the QR code above.
      </p>

      `;

    } else {

      qrHTML = `

      <div style="
        margin:30px auto;
        padding:20px;
        max-width:500px;
        background:#1c1c1c;
        border-radius:15px;
      ">

        <h3>
          📱 QR CODE
        </h3>

        <p>
          Waiting for QR code...
        </p>

      </div>

      `;

    }


    let pairingHTML = "";


    if (
      currentPairingCode
    ) {

      pairingHTML = `

      <div style="
        margin:30px auto;
        padding:25px;
        max-width:500px;
        background:#1c1c1c;
        border-radius:15px;
      ">

        <h2>
          🔐 WhatsApp Pairing Code
        </h2>

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
          WhatsApp → Settings →
          Linked Devices →
          Link a Device
        </p>

        <p>
          Choose
          <strong>
            Link with phone number instead
          </strong>
        </p>

      </div>

      `;

    }


    res.send(`

<!DOCTYPE html>

<html>

<head>

<title>
Bensocial WhatsApp Bot
</title>

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
font-family:Arial;
text-align:center;
padding:30px 15px;
">


<h1>
🤖 Bensocial WhatsApp Bot
</h1>


<div style="
background:#191919;
padding:20px;
border-radius:15px;
max-width:500px;
margin:25px auto;
">

<h2>
${whatsappStatus}
</h2>

</div>


${pairingHTML}


${qrHTML}


<p style="
color:#888;
margin-top:40px;
">

Bensocial WhatsApp Bot

</p>


</body>

</html>

`);

  }
);


// ============================================================
// HEALTH
// ============================================================

app.get(
  "/health",
  (req, res) => {

    res.json({

      status: "ok",

      whatsapp:
        whatsappStatus,

      services:
        SERVICES.length

    });

  }
);


// ============================================================
// SERVER
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
// ADMIN CHECK
// ============================================================

function isAdmin(
  jid
) {

  if (
    !ADMIN_NUMBER
  ) {

    return false;

  }


  const sender =
    jid
      .split("@")[0]
      .replace(/\D/g, "");


  return (
    sender ===
    ADMIN_NUMBER
  );

}


// ============================================================
// WHATSAPP
// ============================================================

async function startWhatsApp() {

  if (
    starting
  ) {

    return;

  }


  starting = true;


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


    whatsappStatus =
      "🔄 Connecting to WhatsApp...";


    currentQRCodeImage =
      null;

    currentPairingCode =
      null;

    pairingRequested =
      false;


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
            "Bensocial Bot"
          ),

        markOnlineOnConnect:
          false,

        syncFullHistory:
          false,

        generateHighQualityLinkPreview:
          false

      });


    // ========================================================
    // SAVE CREDENTIALS
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


        // ====================================================
        // QR
        // ====================================================

        if (
          qr
        ) {

          console.log("");

          console.log(
            "📱 WHATSAPP QR CODE GENERATED"
          );


          whatsappStatus =
            "📱 Scan the WhatsApp QR code";


          currentPairingCode =
            null;


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
              "✅ QR code ready."
            );

            console.log(
              "🌐 Open the Render URL to scan it."
            );


          } catch (
            error
          ) {

            console.log(
              "❌ QR conversion error:",
              error.message
            );

          }

        }


        // ====================================================
        // CONNECTING
        // ====================================================

        if (
          connection ===
          "connecting"
        ) {

          whatsappStatus =
            "🔄 Connecting to WhatsApp...";

        }


        // ====================================================
        // OPEN
        // ====================================================

        if (
          connection ===
          "open"
        ) {

          starting =
            false;


          whatsappStatus =
            "✅ WhatsApp Bot Connected";


          currentQRCodeImage =
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

        }


        // ====================================================
        // CLOSE
        // ====================================================

        if (
          connection ===
          "close"
        ) {

          starting =
            false;


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


          // ==================================================
          // LOGGED OUT
          // ==================================================

          if (
            statusCode ===
            DisconnectReason.loggedOut
          ) {

            whatsappStatus =
              "⚠️ WhatsApp logged out";


            currentQRCodeImage =
              null;

            currentPairingCode =
              null;


            console.log(
              "⚠️ Session logged out."
            );

            console.log(
              "A new pairing is required."
            );


            return;

          }


          // ==================================================
          // RECONNECT
          // ==================================================

          whatsappStatus =
            "🔄 Disconnected — reconnecting...";


          if (
            !reconnectTimer
          ) {

            reconnectTimer =
              setTimeout(
                () => {

                  reconnectTimer =
                    null;

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

      setTimeout(
        async () => {

          if (
            pairingRequested
          ) {

            return;

          }


          if (
            state.creds.registered
          ) {

            return;

          }


          try {

            pairingRequested =
              true;


            whatsappStatus =
              "🔐 Generating pairing code...";


            console.log("");

            console.log(
              "🔐 Requesting pairing code..."
            );


            const code =
              await sock.requestPairingCode(
                PAIRING_NUMBER
              );


            currentPairingCode =
              code;


            currentQRCodeImage =
              null;


            whatsappStatus =
              "🔐 Pairing code is ready";


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

          } catch (
            error
          ) {

            pairingRequested =
              false;


            whatsappStatus =
              "❌ Pairing code error";


            console.log("");

            console.log(
              "❌ PAIRING CODE ERROR"
            );

            console.log(
              error?.message
            );

          }

        },
        5000
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
                .trim();


            const lowerCommand =
              command.toLowerCase();


            if (
              !command
            ) {

              continue;

            }


            // =================================================
            // ADMIN COMMANDS
            // =================================================

            if (
              isAdmin(jid)
            ) {

              // ------------------------------------------------
              // ADMIN HELP
              // ------------------------------------------------

              if (
                lowerCommand ===
                "adminhelp"
              ) {

                await sendAdminHelp(
                  sock,
                  jid
                );

                continue;

              }


              // ------------------------------------------------
              // LIST SERVICES
              // ------------------------------------------------

              if (
                lowerCommand ===
                "services"
              ) {

                await sendServicesList(
                  sock,
                  jid
                );

                continue;

              }


              // ------------------------------------------------
              // ADD SERVICE
              // ------------------------------------------------

              if (
                lowerCommand ===
                "addservice"
              ) {

                await sendAddServiceHelp(
                  sock,
                  jid
                );

                continue;

              }


              // ------------------------------------------------
              // REMOVE SERVICE
              // ------------------------------------------------

              if (
                lowerCommand.startsWith(
                  "removeservice "
                )
              ) {

                const parts =
                  command.split(/\s+/);

                const id =
                  Number(parts[1]);


                await removeService(
                  sock,
                  jid,
                  id
                );

                continue;

              }


              // ------------------------------------------------
              // EDIT SERVICE
              // ------------------------------------------------

              if (
                lowerCommand.startsWith(
                  "editservice "
                )
              ) {

                const parts =
                  command.split(/\s+/);

                const id =
                  Number(parts[1]);


                await editService(
                  sock,
                  jid,
                  id,
                  parts
                );

                continue;

              }


              // ------------------------------------------------
              // ADD SERVICE DIRECTLY
              // ------------------------------------------------

              if (
                lowerCommand.startsWith(
                  "add "
                )
              ) {

                await addServiceFromCommand(
                  sock,
                  jid,
                  command
                );

                continue;

              }

            }


            // =================================================
            // NORMAL MENU
            // =================================================

            if (
              lowerCommand === "hi" ||
              lowerCommand === "hello" ||
              lowerCommand === "hey" ||
              lowerCommand === "menu" ||
              lowerCommand === "start"
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
                  String(item.id) ===
                  lowerCommand
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
            // ADMIN
            // =================================================

            if (
              lowerCommand === "admin" ||
              lowerCommand === "contact admin"
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
              lowerCommand === "payment" ||
              lowerCommand === "pay"
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
              lowerCommand === "help"
            ) {

              await sock.sendMessage(
                jid,
                {
                  text:
`🤖 *BENSOCIAL BOT*

Send *menu* to view our services.

Commands:

• menu
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


          } catch (
            error
          ) {

            console.log(
              "❌ Message error:",
              error?.message
            );

          }

        }

      }
    );


  } catch (
    error
  ) {

    starting =
      false;


    whatsappStatus =
      "❌ WhatsApp startup error";


    console.log("");

    console.log(
      "❌ WHATSAPP START ERROR"
    );

    console.log(
      error?.message
    );

    console.log(
      error?.stack
    );

  }

}


// ============================================================
// SEND MENU
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
// SEND SERVICE
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
// ADMIN CONTACT
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

Admin number has not been configured.`
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

  } catch (
    error
  ) {

    console.log(
      "⚠️ Admin notification failed:",
      error?.message
    );

  }

}


// ============================================================
// ADMIN HELP
// ============================================================

async function sendAdminHelp(
  sock,
  jid
) {

  await sock.sendMessage(
    jid,
    {
      text:
`👑 *BENSOCIAL ADMIN PANEL*

*SERVICE MANAGEMENT*

📋 services
View all services.

➕ addservice
Show instructions for adding.

➕ add Name | Price | Stock
Add a service directly.

✏️ editservice ID Name | Price | Stock
Edit a service.

🗑️ removeservice ID
Remove a service.

Example:

add 📱 UK WhatsApp | ₦5,000 | 10

editservice 1 📱 UK WhatsApp | ₦5,500 | 15

removeservice 1

Only the configured ADMIN_NUMBER can use these commands.`
    }
  );

}


// ============================================================
// SERVICES LIST
// ============================================================

async function sendServicesList(
  sock,
  jid
) {

  if (
    SERVICES.length === 0
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`📦 *SERVICES*

No services are currently available.`
      }
    );

    return;

  }


  let text =
`📦 *BENSOCIAL SERVICES*

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


  await sock.sendMessage(
    jid,
    {
      text
    }
  );

}


// ============================================================
// ADD SERVICE HELP
// ============================================================

async function sendAddServiceHelp(
  sock,
  jid
) {

  await sock.sendMessage(
    jid,
    {
      text:
`➕ *ADD SERVICE*

Use this format:

add Name | Price | Stock

Example:

add 🇬🇧 UK WhatsApp Number | ₦5,000 | 10

The service will automatically receive the next available ID.

Send *services* to see the updated list.`
    }
  );

}


// ============================================================
// ADD SERVICE
// ============================================================

async function addServiceFromCommand(
  sock,
  jid,
  command
) {

  const raw =
    command.substring(4).trim();


  const parts =
    raw.split("|")
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
`❌ Wrong format.

Use:

add Name | Price | Stock

Example:

add 🇬🇧 UK WhatsApp Number | ₦5,000 | 10`
      }
    );

    return;

  }


  const [
    name,
    price,
    stock
  ] = parts;


  if (
    !name ||
    !price ||
    !stock
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ All three fields are required.

Name | Price | Stock`
      }
    );

    return;

  }


  const nextId =
    SERVICES.length > 0
      ? Math.max(
          ...SERVICES.map(
            service =>
              Number(service.id)
          )
        ) + 1
      : 1;


  const newService = {

    id: nextId,

    name,

    price,

    stock

  };


  SERVICES.push(
    newService
  );


  const saved =
    saveServices(
      SERVICES
    );


  if (!saved) {

    SERVICES.pop();

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Service could not be saved.`
      }
    );

    return;

  }


  await sock.sendMessage(
    jid,
    {
      text:
`✅ *SERVICE ADDED*

ID: ${newService.id}

${newService.name}

💰 Price:
${newService.price}

📦 Stock:
${newService.stock}

The customer menu has been updated.`
    }
  );

}


// ============================================================
// REMOVE SERVICE
// ============================================================

async function removeService(
  sock,
  jid,
  id
) {

  if (
    !Number.isInteger(id)
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Enter a valid service ID.

Example:

removeservice 5`
      }
    );

    return;

  }


  const index =
    SERVICES.findIndex(
      service =>
        Number(service.id) === id
    );


  if (
    index === -1
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Service ${id} was not found.

Send *services* to see the current list.`
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


  const saved =
    saveServices(
      SERVICES
    );


  if (!saved) {

    SERVICES.splice(
      index,
      0,
      removed
    );

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Could not save the change.`
      }
    );

    return;

  }


  await sock.sendMessage(
    jid,
    {
      text:
`✅ *SERVICE REMOVED*

ID: ${removed.id}

${removed.name}

💰 ${removed.price}

📦 ${removed.stock}`
    }
  );

}


// ============================================================
// EDIT SERVICE
// ============================================================

async function editService(
  sock,
  jid,
  id,
  parts
) {

  if (
    !Number.isInteger(id)
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Invalid service ID.

Example:

editservice 3 🌐 eSIM | ₦20,000 | 15`
      }
    );

    return;

  }


  const index =
    SERVICES.findIndex(
      service =>
        Number(service.id) === id
    );


  if (
    index === -1
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Service ${id} was not found.

Send *services* to see the list.`
      }
    );

    return;

  }


  const firstSpace =
    parts[1]
      ? parts[1]
      : "";


  /*
   * Reconstruct everything after
   * the service ID.
   */

  const raw =
    parts
      .slice(2)
      .join(" ")
      .trim();


  const fields =
    raw
      .split("|")
      .map(
        item =>
          item.trim()
      );


  if (
    fields.length !== 3
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Wrong format.

Use:

editservice ID Name | Price | Stock

Example:

editservice 3 🌐 eSIM | ₦20,000 | 15`
      }
    );

    return;

  }


  const [
    name,
    price,
    stock
  ] = fields;


  if (
    !name ||
    !price ||
    !stock
  ) {

    await sock.sendMessage(
      jid,
      {
        text:
`❌ Name, price and stock are required.`
      }
    );

    return;

  }


  const oldService =
    {
      ...SERVICES[index]
    };


  SERVICES[index] = {

    id,

    name,

    price,

    stock

  };


  const saved =
    saveServices(
      SERVICES
    );


  if (!saved) {

    SERVICES[index] =
      oldService;


    await sock.sendMessage(
      jid,
      {
        text:
`❌ Could not save the service changes.`
      }
    );

    return;

  }


  await sock.sendMessage(
    jid,
    {
      text:
`✅ *SERVICE UPDATED*

ID: ${id}

${name}

💰 Price:
${price}

📦 Stock:
${stock}

The customer menu has been updated.`
    }
  );

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
  "PAIRING_NUMBER:",
  PAIRING_NUMBER || "NOT SET"
);

console.log(
  "ADMIN_NUMBER:",
  ADMIN_NUMBER || "NOT SET"
);

console.log(
  "SERVICES:",
  SERVICES.length
);

console.log("");

startWhatsApp();
