// src/modules/email/services/emailService.js
const sgMail = require("@sendgrid/mail");
require("dotenv").config();
const fs = require("fs");  
const path = require("path"); 

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, htmlContent) {
  const msg = {
    to,
    from: process.env.FROM_EMAIL, // remitente verificado
    subject,
    html: htmlContent,
  };

  try {
    await sgMail.send(msg);
    console.log("Correo enviado a:", to);
    return { success: true };
  } catch (error) {
    console.error("Error enviando correo:", error.response?.body || error);
    return { success: false, error };
  }
}

async function sendVerificationEmail(to, token) {
  const verificationLink = `${process.env.VERIFY_URL}/api/usuarios/verify/${token}`;

   // 📌 Ruta a la plantilla
  const templatePath = path.join(__dirname, "../templates/confirmation.html");

  // 📌 Leer archivo y reemplazar variable
  let htmlTemplate = fs.readFileSync(templatePath, "utf8");
  htmlTemplate = htmlTemplate.replace("{{verificationLink}}", verificationLink);

  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject: "Confirma tu cuenta - The Nexus Battles",
    html: htmlTemplate,
  };

  await sgMail.send(msg);
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
