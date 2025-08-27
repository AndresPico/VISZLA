// src/modules/users/controllers/user.controller.js
const { validateRegisterInput } = require("../validates/userValidate");
const { registerUser } = require("../services/userService");
const Usuario = require("../models/userModel")

async function register(req, res) {
  try {
    const { nombres, apellidos, apodo, avatar, email, password, confirmPassword } = req.body;

    const errors = validateRegisterInput({ nombres, email, password, confirmPassword });
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    const user = await registerUser({ nombres, apellidos, apodo, avatar, email, password });

    res.status(201).json({
      success: true,
      message: "Usuario registrado. Verifica tu correo para confirmar tu cuenta.",
      userId: user._id
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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

module.exports = { register, getProfile, actualizarPerfil};
