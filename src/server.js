// src/server.js
const app = require("./app");

app.use((req, res, next) => {
  console.log("➡️ Petición:", req.method, req.url);
  next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto: ${PORT}`);
});
