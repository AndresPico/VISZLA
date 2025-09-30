// src/config/ldap.js
const ldap = require("ldapjs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function createLdapClient(useSSL = true) {
  const options = {
    url: process.env.LDAPS_URL,
    reconnect: false, // Cambiar a false para evitar problemas
    timeout: 15000,
    connectTimeout: 20000,
    strictDN: true, // Validar DNs estrictamente
  };

  // Aceptar certificados autofirmados en desarrollo
  if (useSSL) {
    options.tlsOptions = {
      rejectUnauthorized: false, // Para certificados autofirmados
      requestCert: true,
      agent: false,
    };
  }

  const client = ldap.createClient(options);

  // Manejo de errores
  client.on("error", (err) => {
    console.error("❌ Error de conexión LDAP:", err.message);
  });

  client.on("connectError", (err) => {
    console.error("❌ Error al conectar LDAP:", err.message);
  });

  return client;
}

module.exports = { createLdapClient };