// src/modules/users/controllers/authController.js
const ldapService = require('../services/ldapService');
const jwt = require('jsonwebtoken');
const path = require("path");
const dotenv = require("dotenv");
const emailService = require("../../users/services/emailServices");

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// 📩 Recuperar contraseña (solicitud)
async function solicitarRecuperacion (req, res)  {
  const { email } = req.body;

  try {
    const user = await ldapService.findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Aquí generas un token temporal para reset
    const resetToken = jwt.sign(
      { dn: user.dn, email: user.mail },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Enviar correo con el link de reseteo
    await emailService.sendPasswordResetEmail(email, resetToken);

    console.log(`Token de recuperación para ${email}: ${resetToken}`);

    res.json({ message: 'Se ha enviado un enlace de recuperación a tu correo' });
  } catch (error) {
    console.error('❌ Error en solicitarRecuperacion:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// 🔑 Restablecer contraseña
async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("🟡 Decoded token:", decoded);

    await ldapService.updatePassword(decoded.dn, newPassword);

    res.json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Token inválido" });
    }

    console.error("❌ Error en resetPassword:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

module.exports = { solicitarRecuperacion, resetPassword };
