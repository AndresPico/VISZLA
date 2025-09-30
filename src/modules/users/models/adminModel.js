const User = require("./userModel");

exports.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search 
      ? { $or: [{ nombres: new RegExp(search, "i") }, { email: new RegExp(search, "i") }] }
      : {};
    const users = await User.find(filter).select("nombres apellidos apodo email rol estado");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { estado } = req.body; // activo, suspendido, baneado
    const updated = await User.findByIdAndUpdate(req.params.id, { estado }, { new: true });
    await Audit.create({ accion: `Cambio estado a ${estado}`, userId: req.params.id, adminId: req.user.id });
    res.json({ message: "Estado actualizado", updated });
  } catch (err) {
    res.status(500).json({ error: "Error al cambiar estado" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Audit.create({ accion: "Eliminar usuario", userId: req.params.id, adminId: req.user.id });
    res.json({ message: "Usuario eliminado permanentemente" });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
