const express = require("express");
const path = require("path");
const cors = require("cors");
const usuariosRoutes = require("./modules/users/routes/userRoute");
const adminRoutes = require("./modules/users/routes/adminRoute")
const connectDB = require("../src/config/database");

// 🔗 Conectar a MongoDB
connectDB();

const app = express();

// ✅ Configuración de CORS
app.use(cors({
  origin: "*", 
  credentials: true
}));

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (html, css, js)
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/admin", adminRoutes);

// Ruta raíz -> muestra el formulario de registro
app.get("/pages", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/register.html"));
});

module.exports = app;
