// src/modules/users/controllers/user.controller.js
const { validateRegisterInput } = require("../validates/userValidate");
const { registerUser, verifyUser } = require("../services/userService");
const Usuario = require("../models/userModel")
const bcrypt = require ("bcryptjs");

async function register(req, res) {
  try {
    const { nombres, apellidos, apodo, avatar, email, password, confirmPassword, acceptTerms } = req.body;

    // Normalizar términos aceptados
    const acceptTermsBool = acceptTerms === true || acceptTerms === "true" || acceptTerms === "on";

    // Validaciones
    const errors = validateRegisterInput({
      nombres,
      apellidos,
      apodo,
      email,
      password,
      confirmPassword,
      acceptTerms: acceptTermsBool
    });

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Errores de validación", errors });
    }

    // Llamar al servicio para crear usuario
    const user = await registerUser({ nombres, apellidos, apodo, avatar, email, password, acceptTerms: acceptTermsBool });

    res.status(201).json({
      success: true,
      message: "Usuario registrado. Verifica tu correo para confirmar tu cuenta.",
      user: {
        _id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        apodo: user.apodo,
        avatar: user.avatar,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error("❌ Error en register:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

async function verifyAccount(req, res) {
  try {
    const { token } = req.params;

    const user = await verifyUser(token);

    res.status(200).json({
      success: true,
      message: "Cuenta verificada correctamente",
      user: {
        _id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        apodo: user.apodo,
        email: user.email,
        confirmado: user.confirmado
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

async function login(req, res) {
  try {
    const { email, contrasena } = req.body;

    // 1. Buscar usuario en Mongo
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 2. Validar contraseña
    const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!isMatch) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // 3. Construir objeto user (sin exponer contraseña)
    const user = {
      id: usuario._id,
      nombres: usuario.nombres,
      email: usuario.email,
      rol: usuario.rol
    };

    // 4. Responder con user
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      user
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Obtener perfil del usuario autenticado
async function getProfile (req, res) {
  try {
    const userId = req.user.id; // viene del token JWT
    const user = await Usuario.findById(userId).select("nombres apellidos apodo avatar email");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener perfil", error: error.message });
  }
};

// Actualizar perfil
async function actualizarPerfil (req, res) {
  try {
    const userId = req.user.id; // 👈 viene del verificarToken
    const { nombres, apellidos, apodo, passwordActual, nuevaPassword, confirmarPassword } = req.body;

    // Buscar usuario en Mongo
    const usuario = await Usuario.findById(userId);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar campos básicos
    if (nombres) usuario.nombres = nombres;
    if (apellidos) usuario.apellidos = apellidos;
    if (apodo) usuario.apodo = apodo;

    // Validar cambio de contraseña (solo si se mandó nuevaPassword)
    if (nuevaPassword) {
      if (!passwordActual) {
        return res.status(400).json({ message: "Debes ingresar tu contraseña actual para cambiarla" });
      }

      // Validar contraseña actual
      const passwordValida = await bcrypt.compare(passwordActual, usuario.password);
      if (!passwordValida) {
        return res.status(400).json({ message: "La contraseña actual no es correcta" });
      }

      if (nuevaPassword !== confirmarPassword) {
        return res.status(400).json({ message: "La nueva contraseña y la confirmación no coinciden" });
      }

      // Encriptar nueva contraseña
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(nuevaPassword, salt);
    }

    // Guardar cambios
    await usuario.save();

    res.json({ message: "Perfil actualizado correctamente", usuario });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
};

module.exports = { register,verifyAccount, getProfile, actualizarPerfil, login};
