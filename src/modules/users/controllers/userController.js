// src/modules/users/controllers/userController.js
const { validateRegisterInput } = require("../validates/userValidate");
const { registerUser, verifyUser } = require("../services/userService");
const { getUserFromAD } = require("../services/ldapService");
const jwt = require("jsonwebtoken");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

/**
 * Registro de nuevo usuario (AD + MongoDB)
 */
async function register(req, res) {
  try {
    const {
      nombres,
      apellidos,
      apodo,
      avatar,
      email,
      password,
      confirmPassword,
      acceptTerms,
    } = req.body;

    // Convertir acceptTerms a booleano
    const acceptTermsBool =
      acceptTerms === true || acceptTerms === "true" || acceptTerms === "on";

    console.log("📋 Datos recibidos en register:", {
      nombres,
      apellidos,
      apodo,
      email,
      acceptTerms: acceptTermsBool,
    });

    // Validaciones
    const errors = validateRegisterInput({
      nombres,
      apellidos,
      apodo,
      email,
      password,
      confirmPassword,
      acceptTerms: acceptTermsBool,
    });

    if (errors.length > 0) {
      console.log("❌ Errores de validación:", errors);
      return res.status(400).json({
        success: false,
        message: "Errores de validación",
        errors,
      });
    }

    // ⚡ Registrar usuario (crea en AD con password y guarda en MongoDB)
    const user = await registerUser({
      nombres,
      apellidos,
      apodo,
      avatar,
      email,
      password, // Se pasa al AD, NO a MongoDB
      acceptTerms: acceptTermsBool,
    });

    console.log("✅ Usuario registrado exitosamente:", user.apodo);

    res.status(201).json({
      success: true,
      message:
        "Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.",
      user: {
        _id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        apodo: user.apodo,
        avatar: user.avatar,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    console.error("❌ Error en register:", error.message);
    res.status(500).json({
      success: false,
      message: error.message || "Error al registrar usuario",
    });
  }
}

/**
 * Verificar cuenta con token de email
 */
async function verifyAccount(req, res) {
  try {
    const { token } = req.params;

    console.log("🔍 Verificando token:", token);

    const user = await verifyUser(token);

    console.log("✅ Cuenta verificada:", user.email);

    const successPath = path.join(
      __dirname,
      "../../users/templates/verified.html"
    );
    return res.sendFile(successPath);
  } catch (error) {
    console.error("❌ Error en verifyAccount:", error.message);
    const errorPath = path.join(
      __dirname,
      "../../users/templates/verify-failed.html"
    );
    return res.sendFile(errorPath);
  }
}

/**
 * Login con autenticación en Active Directory
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son requeridos",
      });
    }

    console.log("🔐 Intento de login:", email);

    // 🔐 Autenticación en AD + datos de MongoDB
    const user = await getUserFromAD(email, password);

    console.log("✅ Login exitoso:", user.apodo);

    // 🎫 Crear token JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        apodo: user.apodo,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" } // Token válido por 24 horas
    );

    res.status(200).json({
      success: true,
      message: "Login exitoso",
      token,
      user: {
        _id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        apodo: user.apodo,
        avatar: user.avatar,
        email: user.email,
        rol: user.rol,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    res.status(401).json({
      success: false,
      message: error.message || "Credenciales inválidas",
    });
  }
}

module.exports = { register, verifyAccount, login};