const sgMail = require("@sendgrid/mail");

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

module.exports = { sendEmail };
