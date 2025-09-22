const sgMail = require("@sendgrid/mail");
require('dotenv').config();

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
  const verificationLink = `http://localhost:3000/api/usuarios/verify/${token}`;

  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject: "Confirma tu cuenta - The Nexus Battles",
    html: `
      <h2>¡Bienvenido a The Nexus Battles!</h2>
      <p>Por favor confirma tu cuenta haciendo clic en el siguiente enlace:</p>
      <a href="${verificationLink}">Confirmar mi cuenta</a>
      <p>Este enlace expirará en 24 horas.</p>
    `,
  };

  await sgMail.send(msg);
}

module.exports = { sendVerificationEmail,sendEmail };
