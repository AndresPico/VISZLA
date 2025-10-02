// src/modules/users/routes/userRoutes.js
const express = require("express");
const {register,verifyAccount,login} = require("../controllers/userController.js");

const {solicitarRecuperacion,resetPassword} = require("../controllers/authController.js");

const router = express.Router();

// 📌 Registro de usuario 
router.post("/register", register);

// 📌 Verificación de cuenta mediante correo
router.get("/verify/:token", verifyAccount);

// 📌 Login contra Directorio Activo
router.post("/login", login);

// 📌 Recuperar contraseña (solicitud → manda correo con link)
router.post("/recuperar", solicitarRecuperacion);

// 📌 Resetear contraseña con token válido
router.post("/reset-password", resetPassword);

module.exports = router;
