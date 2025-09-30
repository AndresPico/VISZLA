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