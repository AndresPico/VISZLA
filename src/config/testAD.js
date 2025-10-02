// test-ldap.js
const ldap = require("ldapjs");
const dotenv = require("dotenv")
const path = require("path");
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function createLdapClient() {
  const options = {
    url: process.env.LDAPS_URL,
    reconnect: false,
    timeout: 15000,
    connectTimeout: 20000,
    tlsOptions: {
      rejectUnauthorized: false
    }
  };

  const client = ldap.createClient(options);

  client.on("error", (err) => {
    console.error("❌ Error de conexión LDAP:", err.message);
  });

  client.on("connectError", (err) => {
    console.error("❌ Error al conectar LDAP:", err.message);
  });

  return client;
}

async function testLdap() {
  const client = createLdapClient();

  return new Promise((resolve, reject) => {
    console.log("🔌 Conectando a:", process.env.LDAPS_URL);

    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        console.error("❌ Error en bind:", err);
        return reject(err);
      }
      console.log("✅ Bind exitoso con el usuario administrador");

      const opts = {
        filter: "(objectClass=user)", // 🔎 Buscar todos los usuarios
        scope: "sub",
        attributes: ["*"] // 🔥 Pedir todos los atributos para inspección
      };

      console.log("📌 BaseDN:", process.env.LDAP_BASE_DN);
      client.search(process.env.LDAP_BASE_DN, opts, (err, res) => {
        if (err) {
          console.error("❌ Error en search:", err);
          return reject(err);
        }

        res.on("searchEntry", (entry) => {
          console.log("👤 Usuario encontrado DN:", entry.dn);

          if (entry.object) {
            console.log("📌 entry.object:", JSON.stringify(entry.object, null, 2));
          }

          if (entry.pojo) {
            console.log("📌 entry.pojo:", JSON.stringify(entry.pojo, null, 2));
          }

          if (entry.attributes) {
            console.log("📌 entry.attributes:", entry.attributes.map(a => ({
              type: a.type,
              values: a.vals
            })));
          }
        });

        res.on("searchReference", (referral) => {
          console.log("🔗 Referencia LDAP:", referral.uris.join());
        });

        res.on("error", (err) => {
          console.error("❌ Error en el stream de búsqueda:", err);
          reject(err);
        });

        res.on("end", (result) => {
          console.log("📨 Búsqueda finalizada con status:", result?.status);
          client.unbind();
          resolve();
        });
      });
    });
  });
}

testLdap()
  .then(() => console.log("🚀 Test LDAP completado"))
  .catch((err) => console.error("💥 Test LDAP falló:", err));
