const express = require("express");
const Usuario = require("../models/userModel");
const { verificarToken } = require("../../../middlewares/auth");
const { register, verifyAccount, login } = require ("../controllers/userController.js");

const router = express.Router();

// Registro de usuario 
router.post("/register", register);

//Verificar cuenta mediante correo
router.get("/verify/:token", verifyAccount);

//Login con autenticacion en el Directorio Activo
router.post("/login", login);

// Obtener perfil del usuario autenticado
router.get("/profile", verificarToken, async (req, res) => {
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