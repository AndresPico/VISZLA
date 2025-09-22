// const express = require("express");
// const router = express.Router();
// const { sendEmail } = require("../services/emailServices");

// // Enviar correo de prueba
// router.post("/send-test", async (req, res) => {
//   const { to } = req.body;

//   const result = await sendEmail(
//     to,
//     "Correo de prueba 🚀",
//     "<h1>Hola!</h1><p>Este es un correo de prueba desde Azure + SendGrid</p>"
//   );

//   if (result.success) {
//     res.json({ message: "Correo enviado correctamente" });
//   } else {
//     res.status(500).json({ error: result.error });
//   }
// });

// module.exports = router;
