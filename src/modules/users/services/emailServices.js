// src/modules/email/services/emailService.js
const sgMail = require("@sendgrid/mail");
require("dotenv").config();
const fs = require("fs");  
const path = require("path"); 

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 🔹 Helper para cargar plantillas HTML y reemplazar variables
function loadTemplate(templateName, replacements = {}) {
  const templatePath = path.join(__dirname, "../templates", templateName);
  let html = fs.readFileSync(templatePath, "utf8");

  for (const key in replacements) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), replacements[key]);
  }

  return html;
}

async function sendEmail(to, subject, templateName, replacements = {}) {
  try {
    const htmlContent = loadTemplate(templateName, replacements);

    const msg = {
      to,
      from: process.env.FROM_EMAIL, 
      subject,
      html: htmlContent,
    };

    await sgMail.send(msg);
    console.log("✅ Correo enviado a:", to);
    return { success: true };
  } catch (error) {
    console.error("❌ Error enviando correo:", error.response?.body || error);
    return { success: false, error };
  }
}

// 🔹 Especialización: correo de verificación
async function sendVerificationEmail(to, token) {
  const verificationLink = `${process.env.VERIFY_URL}/api/usuarios/verify/${token}`;
  return sendEmail(to, "Confirma tu cuenta - The Nexus Battles", "confirmation.html", {
    verificationLink,
  });
}

// 🔹 Correo de recuperación de contraseña
async function sendPasswordResetEmail(to, token) {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  return sendEmail(
    to,
    "Recupera tu contraseña - The Nexus Battles",
    "password-reset.html",
    { resetLink }
  );
}

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
