const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verificarToken, verificarAdmin } = require("../../../middlewares/auth");

// 🔒 Todas las rutas de admin requieren estar autenticado y ser admin
router.use(verificarToken, verificarAdmin);

// Listar usuarios (con filtro opcional por nombre/correo)
router.get("/users-listar", adminController.getUsers);

// Suspender/Reactivar usuario
router.put("/users/:id/suspender", async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { estado: "suspendido", motivoSuspension: motivo },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    res.json({ ok: true, usuario });
  } catch (err) {
    res.status(500).json({ msg: "Error en servidor" });
  }
});

// Eliminar usuario
router.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  const { motivo } = req.body;

  try {
    const usuario = await Usuario.findByIdAndDelete(id);
    if (!usuario) return res.status(404).json({ msg: "Usuario no encontrado" });

    // opcional: guardar en logs
    await Log.create({
      usuarioId: id,
      accion: "eliminado",
      motivo,
      fecha: new Date()
    });

    res.json({ ok: true, msg: "Usuario eliminado permanentemente" });
  } catch (err) {
    res.status(500).json({ msg: "Error en servidor" });
  }
});

//Creacion de usuarios que sean admin
router.post("/register", async (req, res) => {
  try {
    const nuevoUsuario = new Usuario({
      ...req.body,
      rol: "admin" // 👈 siempre admin
    });

    await nuevoUsuario.save();
    res.json({ ok: true, usuario: nuevoUsuario });
  } catch (err) {
    res.status(500).json({ msg: "Error en servidor" });
  }
});

module.exports = router;
