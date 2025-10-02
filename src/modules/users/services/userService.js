// src/modules/users/services/userService.js
const Usuario = require("../models/userModel");
const emailService = require("./emailServices");
const path = require("path");
const dotenv = require("dotenv");
const { createLdapClient } = require("../../../config/ldap");

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

/**
 * Crea un usuario en Active Directory con contraseña
 */
async function createADUser({ email, apodo, password, nombres, apellidos }) {
  return new Promise((resolve, reject) => {
    // ✅ Usar LDAPS (SSL) para operaciones de contraseña
    const client = createLdapClient(true);

    // 🔑 Autenticar con administrador
    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error(`Error al autenticar con AD: ${err.message}`));
      }

      const dn = `CN=${apodo},CN=Users,DC=thenexusbattles,DC=local`;

      // Preparar la contraseña en formato UTF-16LE
      const passwordBuffer = Buffer.from(`"${password}"`, "utf16le");

      const entry = {
        cn: apodo,
        sn: apellidos,
        givenName: nombres,
        displayName: `${nombres} ${apellidos}`,
        mail: email,
        sAMAccountName: apodo,
        userPrincipalName: `${apodo}@thenexusbattles.local`,
        objectClass: ["top", "person", "organizationalPerson", "user"],
        unicodePwd: passwordBuffer, // Establecer contraseña al crear
        userAccountControl: "512", // Cuenta habilitada directamente
      };

      // Crear el usuario en AD con contraseña incluida
      client.add(dn, entry, (err) => {
        client.unbind();
        
        if (err) {
          return reject(new Error(`Error creando usuario en AD: ${err.message}`));
        }

        console.log(`✅ Usuario ${apodo} creado en AD con contraseña`);
        resolve(true);
      });
    });
  });
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