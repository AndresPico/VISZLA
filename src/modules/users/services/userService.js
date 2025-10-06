// src/modules/users/services/userService.js
const Usuario = require("../models/userModel");
const emailService = require("./emailServices");
const { createUser, setPassword, enableUser } = require("./ADuserService");

/**
 * Crea un usuario en Active Directory con contraseña
 */
async function createADUser({ email, apodo, password, nombres, apellidos }) {
  const dn = `CN=${apodo},CN=Users,DC=thenexusbattles,DC=local`;

  // 1️⃣ Crear usuario
  await createUser({ dn, nombres, apellidos, apodo, email });

  // 2️⃣ Asignar contraseña
  await setPassword(dn, password);

  // 3️⃣ Habilitar cuenta
  await enableUser(dn);

  console.log(`🎉 Usuario ${apodo} creado correctamente con contraseña y habilitado`);
}


/**
 * Registra un usuario completo (AD + MongoDB)
 */
async function registerUser({
  nombres,
  apellidos,
  apodo,
  avatar,
  email,
  password,
  acceptTerms,
}) {
  try {
    // 🔍 Verificar duplicados en MongoDB
    const existingEmail = await Usuario.findOne({ email });
    if (existingEmail) {
      throw new Error("El correo ya está registrado");
    }

    const existingApodo = await Usuario.findOne({ apodo });
    if (existingApodo) {
      throw new Error("El apodo ya está en uso");
    }

    // 🟢 Crear usuario en Active Directory
    console.log(`📝 Creando usuario ${apodo} en Active Directory...`);
    await createADUser({ email, apodo, password, nombres, apellidos });

    // 🔑 Generar token de confirmación
    const confirmacionToken = require("crypto").randomBytes(32).toString("hex");
    const confirmacionExpira = Date.now() + 3600000; // 1 hora

    // 📝 Guardar en MongoDB (sin contraseña, está en AD)
    const nuevoUsuario = new Usuario({
      nombres,
      apellidos,
      apodo,
      avatar: avatar || "/default-avatar.png",
      email,
      terminosAceptados: acceptTerms,
      fechaAceptacionTerminos: new Date(),
      confirmacionToken,
      confirmacionExpira,
      confirmado: false, // Requiere verificación por email
    });

    await nuevoUsuario.save();
    console.log(`✅ Usuario ${apodo} guardado en MongoDB`);

    // 📧 Enviar correo de verificación
    await emailService.sendVerificationEmail(email, confirmacionToken);

    return nuevoUsuario;
  } catch (error) {
    console.error("❌ Error en registerUser:", error.message);
    throw error;
  }
}

/**
 * Verifica la cuenta de usuario con el token
 */
async function verifyUser(token) {
  const user = await Usuario.findOne({
    confirmacionToken: token,
    confirmacionExpira: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error("Token inválido o expirado");
  }

  user.confirmado = true;
  user.confirmacionToken = undefined;
  user.confirmacionExpira = undefined;

  await user.save();
  console.log(`✅ Usuario ${user.apodo} verificado`);

  return user;
}

module.exports = { registerUser, verifyUser, createADUser };