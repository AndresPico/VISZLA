// src/modules/users/services/user.service.js
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Usuario = require("../models/userModel");
const emailService = require("../../email/services/emailServices");

async function registerUser({ nombres, apellidos, apodo, avatar, email, password, acceptTerms }) {
  // Verificar duplicados
  const existeEmail = await Usuario.findOne({ email });
  if (existeEmail) throw new Error("El correo ya está registrado");

  const existeApodo = await Usuario.findOne({ apodo });
  if (existeApodo) throw new Error("El apodo ya está en uso");

  // Hash de contraseña
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generar token de confirmación
  const confirmacionToken = crypto.randomBytes(32).toString("hex");
  const confirmacionExpira = Date.now() + 3600000; // 1h

  // Crear usuario
  const nuevoUsuario = new Usuario({
    nombres,
    apellidos,
    apodo,
    avatar,
    email,
    password: hashedPassword,
    terminosAceptados: acceptTerms,
    fechaAceptacionTerminos: new Date(),
    confirmacionToken,
    confirmacionExpira
  });

  await nuevoUsuario.save();

  // Enviar correo de verificación
  await emailService.sendVerificationEmail(email, confirmacionToken);

  return nuevoUsuario;
}

async function verifyUser(token) {
  // Buscar usuario por token y que no haya expirado
  const user = await Usuario.findOne({
    confirmacionToken: token,
    confirmacionExpira: { $gt: Date.now() } // token aún válido
  });

  if (!user) {
    throw new Error("Token inválido o expirado");
  }

  // Actualizar estado de usuario
  user.confirmado = true;
  user.confirmacionToken = undefined;
  user.confirmacionExpira = undefined;

  await user.save();

  return user;
}

module.exports = { registerUser,verifyUser};
