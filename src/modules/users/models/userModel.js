// src/modules/users/models/user.model.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nombres: { type: String, trim: true },  
  apellidos: { type: String, trim: true },
  apodo: { type: String, trim: true, unique: true }, // dato único en la app
  avatar: { type: String }, // foto de perfil (subida o por integración externa)

  // Email: viene del AD y debe ser único
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  // 🔐 No guardamos password, porque lo valida AD

  rol: { type: String, enum: ["jugador", "admin"], default: "jugador" },
  estado: { type: String, enum: ["activo", "baneado", "suspendido"], default: "activo" },

  fechaCreacion: { type: Date, default: Date.now },
  confirmacionToken: { type: String },
  confirmacionExpira: { type: Date },
  confirmado: { type: Boolean, default: false },

  // ✅ Campos de términos y condiciones
  terminosAceptados: { type: Boolean, required: true, default: false },
  fechaAceptacionTerminos: { type: Date },
  versionTerminos: { type: String, default: "1.0" }
});

module.exports = mongoose.model("Usuarios", UserSchema);
