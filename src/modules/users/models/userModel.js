// src/modules/users/models/user.model.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nombres: { type: String, required: true, trim: true },
  apellidos: { type: String, trim: true },
  apodo: { type: String, trim: true, unique: true},
  avatar: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ["jugador", "admin"], default: "jugador" },
  estado: { type: String, enum: ["activo", "baneado", "suspendido"], default: "activo" },
  fechaCreacion: { type: Date, default: Date.now },
  confirmacionToken: { type: String },
  confirmacionExpira: { type: Date },
  confirmado: { type: Boolean, default: false }
});

module.exports = mongoose.model("Usuarios", UserSchema);