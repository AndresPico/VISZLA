const express = require("express");
const bcrypt = require("bcryptjs");
const Usuario = require("../models/userModel");
const jwt = require("jsonwebtoken");
const { verificarToken } = require("../../../middlewares/auth");
const { validateRegisterInput } = require("../validates/userValidate");

const router = express.Router();

// 📌 Registro de usuario
router.post("/usuarios/register", async (req, res) => {
  try {
    console.log("Datos recibidos en el body:", req.body);
    const { nombres, apellidos, apodo, avatar, email, password, confirmPassword, acceptTerms } = req.body;

    // Convertir acceptTerms a booleano si viene como string
    const acceptTermsBool = acceptTerms === true || acceptTerms === 'true' || acceptTerms === 'on';
    
    console.log("AcceptTerms procesado:", acceptTermsBool); // Para debug

    // 🔹 Validar todos los datos incluyendo términos
    const errors = validateRegisterInput({ 
      nombres, 
      apellidos, 
      apodo, 
      email, 
      password, 
      confirmPassword, 
      acceptTerms: acceptTermsBool,
      avatar 
    });
    
    if (errors.length > 0) {
      console.log("Errores de validación:", errors); // Para debug
      return res.status(400).json({ 
        success: false, 
        message: "Errores de validación", 
        errors 
      });
    }

    // 🔹 Verificar si ya existe el email
    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({ 
        success: false, 
        message: "El correo ya está registrado" 
      });
    }

    // 🔹 Verificar si ya existe el apodo
    const existeApodo = await Usuario.findOne({ apodo });
    if (existeApodo) {
      return res.status(400).json({ 
        success: false, 
        message: "El apodo ya está en uso" 
      });
    }

    // 🔹 Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Crear nuevo usuario
    const nuevoUsuario = new Usuario({
      nombres,
      apellidos,
      apodo,
      avatar,
      email,
      password: hashedPassword,
      terminosAceptados: true,
      fechaAceptacionTerminos: new Date()
    });

    await nuevoUsuario.save();

    res.status(201).json({
      success: true,
      message: "Usuario registrado con éxito. ¡Bienvenido a The Nexus Battle IV!",
      usuario: {
        _id: nuevoUsuario._id,
        nombres: nuevoUsuario.nombres,
        apellidos: nuevoUsuario.apellidos,
        apodo: nuevoUsuario.apodo,
        avatar: nuevoUsuario.avatar,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error en el servidor", 
      error: error.message 
    });
  }
});

router.post("/usuarios/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Validar contraseña
    const validaPassword = await bcrypt.compare(password, usuario.password);
    if (!validaPassword) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    // Crear token JWT
    const token = jwt.sign(
      { id: usuario._id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || "clave_temporal", // Fallback temporal
      { expiresIn: "2h" }
    );

    res.status(200).json({
      message: "Login exitoso",
      token,
      rol: usuario.rol,
      nombres: usuario.nombres
    });

  } catch (error) {
    res.status(500).json({ message: "Error en el servidor", error });
  }
});

// Obtener perfil del usuario autenticado
router.get("/usuarios/profile", verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id).select("-password"); 
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ msg: "Error al obtener usuario" });
  }
});

// Actualizar perfil
router.put("/usuarios/perfil", verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // viene del token
    const {nombres, apellidos, email, apodo  } = req.body; // datos que actualiza el usuario

    // Buscar y actualizar
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      id,
      { nombres, apellidos, email, apodo },
      { new: true } // devuelve el usuario ya actualizado
    );

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    res.json({
      mensaje: "Perfil actualizado correctamente",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al actualizar el perfil" });
  }
});

// 🗑️ Eliminar cuenta del usuario
router.delete("/usuarios/eliminar-cuenta", verificarToken, async (req, res) => {
  try {
    const { id } = req.usuario; // viene del token
    const { password } = req.body; // contraseña para confirmar

    // Buscar usuario
    const usuario = await Usuario.findById(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    // Eliminar usuario permanentemente
    await Usuario.findByIdAndDelete(id);

    // Log de la eliminación (opcional)
    console.log(`Usuario eliminado: ${usuario.email} (${usuario.apodo}) - ${new Date().toISOString()}`);

    res.json({
      mensaje: "Cuenta eliminada exitosamente",
      success: true
    });

  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
});

module.exports = router;