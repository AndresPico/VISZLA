// src/modules/users/services/ldapService.js
const { createLdapClient } = require("../../../config/ldap");
const Usuario = require("../models/userModel");
const ldap = require("ldapjs");

/**
 * Autentica un usuario contra AD y devuelve sus datos combinados con MongoDB
 */
async function getUserFromAD(email, password) {
  const client = createLdapClient(true);

  return new Promise(async (resolve, reject) => {
    try {
      // 1️⃣ Buscar usuario en MongoDB
      const usuarioMongo = await Usuario.findOne({ email });
      if (!usuarioMongo) return reject(new Error("Usuario no encontrado en la base de datos"));
      if (!usuarioMongo.confirmado) return reject(new Error("Cuenta no verificada. Revisa tu correo electrónico."));
      if (usuarioMongo.estado !== "activo") return reject(new Error(`Tu cuenta está ${usuarioMongo.estado}`));

      // 2️⃣ Buscar usuario en AD por apodo
      const searchOptions = {
        filter: `(sAMAccountName=${usuarioMongo.apodo})`,
        scope: "sub",
        attributes: ["dn", "cn", "mail", "displayName", "memberOf"],
      };

      client.search("DC=thenexusbattles,DC=local", searchOptions, (err, res) => {
        if (err) {
          client.unbind();
          return reject(new Error("Error buscando usuario en AD"));
        }

        let userAD = null;

        res.on("searchEntry", (entry) => {
          userAD = entry.object;
        });

        res.on("end", () => {
          if (!userAD) {
            client.unbind();
            return reject(new Error("Usuario no encontrado en AD"));
          }

          // 3️⃣ Intentar autenticar con el DN real
          const userDN = userAD.dn;

          const authClient = createLdapClient(true);
          authClient.bind(userDN, password, (err) => {
            if (err) {
              authClient.unbind();
              return reject(new Error("Credenciales inválidas"));
            }

            console.log(`✅ Usuario ${usuarioMongo.apodo} autenticado en AD`);
            authClient.unbind();

            // 4️⃣ Combinar datos MongoDB + AD
            resolve({
              // Datos Mongo
              _id: usuarioMongo._id,
              nombres: usuarioMongo.nombres,
              apellidos: usuarioMongo.apellidos,
              apodo: usuarioMongo.apodo,
              avatar: usuarioMongo.avatar,
              email: usuarioMongo.email,
              rol: usuarioMongo.rol,
              estado: usuarioMongo.estado,
              // Datos AD
              displayName: userAD.displayName,
              mail: userAD.mail,
              groups: userAD.memberOf || [],
            });
          });
        });
      });
    } catch (error) {
      client.unbind();
      reject(error);
    }
  });
}

/**
 * Verifica si un usuario existe en Active Directory
 */
async function userExistsInAD(apodo) {
  const client = createLdapClient(true);

  return new Promise((resolve, reject) => {
    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error("Error al autenticar con AD"));
      }

      const searchOptions = {
        filter: `(sAMAccountName=${apodo})`,
        scope: "sub",
        attributes: ["dn"],
      };

      client.search(process.env.LDAP_BASE_DN, searchOptions, (err, res) => {
        if (err) {
          client.unbind();
          return reject(err);
        }

        let found = false;
        res.on("searchEntry", () => (found = true));
        res.on("end", () => {
          client.unbind();
          resolve(found);
        });
        res.on("error", (err) => {
          client.unbind();
          reject(err);
        });
      });
    });
  });
}

/**
 * Buscar usuario por email en AD
 */
async function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    console.log("🔍 Buscando usuario por email en LDAP:", email);

    const client = createLdapClient(true);

    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        console.error("❌ Error en bind:", err);
        return reject(err);
      }

      // Probamos con varios atributos
      const opts = {
        filter: `(|(mail=${email})(userPrincipalName=${email})(proxyAddresses=smtp:${email}))`,
        scope: "sub",
        attributes: ["dn", "cn", "mail", "userPrincipalName", "proxyAddresses", "sAMAccountName"]
      };

      console.log("📌 BaseDN:", process.env.LDAP_BASE_DN);
      console.log("📌 Filtro:", opts.filter);

      client.search(process.env.LDAP_BASE_DN, opts, (err, res) => {
        if (err) {
          console.error("❌ Error al ejecutar search:", err);
          client.unbind();
          return reject(err);
        }

        let user = null;

        res.on("searchEntry", (entry) => {
          console.log("✅ Entrada encontrada en AD");
          console.log("📌 entry.pojo:", entry.pojo);
          console.log("📌 entry.attributes:", entry.attributes.map(a => ({
            type: a.type,
            values: a.vals
          })));

          user = {
            dn: entry.dn.toString(),
            mail: entry.pojo?.attributes.find(a => a.type === "mail")?.values[0],
            upn: entry.pojo?.attributes.find(a => a.type === "userPrincipalName")?.values[0],
            samAccountName: entry.pojo?.attributes.find(a => a.type === "sAMAccountName")?.values[0],
            proxy: entry.pojo?.attributes.find(a => a.type === "proxyAddresses")?.values || []
          };

          console.log("📌 DN crudo:", entry.dn);
          console.log("📌 DN string:", entry.dn.toString());
        });

        

        res.on("error", (err) => {
          console.error("❌ Error en el stream de búsqueda:", err);
          client.unbind();
          reject(err);
        });

        res.on("end", (result) => {
          console.log("📨 Búsqueda finalizada con status:", result?.status);
          client.unbind();

          if (!user) {
            console.warn("⚠️ No se encontró usuario con email:", email);
          }

          resolve(user);
        });
      });
    });
  });
}

/**
 * Cambiar contraseña en AD (requiere cuenta admin)
 */

const Attribute = require ("@ldapjs/attribute");
const Change = require ("@ldapjs/change");

async function updatePassword(dn, newPassword) {
  const client = createLdapClient(true);

  return new Promise((resolve, reject) => {
    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error("Error autenticando como admin"));
      }

      // Active Directory espera la contraseña en UTF-16LE con comillas
      const unicodePwd = Buffer.from(`"${newPassword}"`, "utf16le");

      // 🔍 Debug: imprime el buffer para asegurarnos que se ve bien
      console.log("🟡 Buffer unicodePwd:", unicodePwd);

      // ✅ Crear atributo válido
      const pwdAttribute = new Attribute({
        type: "unicodePwd",
        values: [unicodePwd]
      });

      // 🔍 Debug: ver cómo queda el atributo
      console.log("🟡 Atributo generado:", pwdAttribute);

      const change = new Change({
        operation: "replace",
        modification: pwdAttribute
      });

      // 🔍 Debug: ver cómo queda el cambio final
      console.log("🟡 Change final:", change);

      client.modify(dn, change, (err) => {
        client.unbind();
        if (err) {
          console.error("❌ Error al modificar password:", err);
          return reject(err);
        }
        console.log("✅ Contraseña modificada con éxito en AD");
        resolve(true);
      });
    });
  });
}


module.exports = { getUserFromAD, userExistsInAD, findUserByEmail, updatePassword };
