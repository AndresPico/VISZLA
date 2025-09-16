const express = require("express");
const path = require("path");
const usuariosRoutes = require("./modules/users/routes/userRoute");
const adminRoutes = require("./modules/users/routes/adminRoute")
const connectDB = require("../src/config/database");
const emailRoutes = require("../src/modules/email/routes/emailRoutes");

// 🔗 Conectar a MongoDB
connectDB();

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (html, css, js)
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/api", usuariosRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/email", emailRoutes);


// Ruta raíz -> muestra el formulario de registro
app.get("/pages", (req, res) => {
  res.sendFile(path.join(__dirname, "public/pages/register.html"));
});

module.exports = app;
