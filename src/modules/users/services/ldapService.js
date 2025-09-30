// src/modules/users/services/ldapService.js
const { createLdapClient } = require("../../../config/ldap");
const Usuario = require("../models/userModel");

/**
 * Autentica un usuario contra Active Directory y obtiene sus datos de MongoDB
 */
async function getUserFromAD(email, password) {
  return new Promise(async (resolve, reject) => {
    try {
      // 1️⃣ Buscar usuario en MongoDB por email
      const usuarioMongo = await Usuario.findOne({ email });

      if (!usuarioMongo) {
        return reject(new Error("Usuario no encontrado en la base de datos"));
      }

      if (!usuarioMongo.confirmado) {
        return reject(new Error("Cuenta no verificada. Revisa tu correo electrónico."));
      }

      if (usuarioMongo.estado !== "activo") {
        return reject(new Error(`Tu cuenta está ${usuarioMongo.estado}`));
      }

      // 2️⃣ Construir el DN del usuario para autenticación
      const userDN = `CN=${usuarioMongo.apodo},CN=Users,DC=thenexusbattles,DC=local`;

      // 3️⃣ Intentar autenticar contra Active Directory
      const client = createLdapClient(true); // Login con SSL

      client.bind(userDN, password, async (err) => {
        if (err) {
          client.unbind();
          return reject(new Error("Credenciales inválidas"));
        }

        console.log(`✅ Usuario ${usuarioMongo.apodo} autenticado en AD`);

        // 4️⃣ Buscar información adicional del usuario en AD
        const searchOptions = {
          filter: `(sAMAccountName=${usuarioMongo.apodo})`,
          scope: "sub",
          attributes: ["cn", "mail", "displayName", "memberOf"],
        };

        client.search(
          "DC=thenexusbattles,DC=local",
          searchOptions,
          (err, res) => {
            if (err) {
              client.unbind();
              return reject(new Error("Error buscando usuario en AD"));
            }

            let userAD = null;

            res.on("searchEntry", (entry) => {
              userAD = {
                dn: entry.objectName,
                mail: entry.pojo.attributes.find((a) => a.type === "mail")?.values[0],
                displayName: entry.pojo.attributes.find((a) => a.type === "displayName")?.values[0],
                cn: entry.pojo.attributes.find((a) => a.type === "cn")?.values[0],
                groups: entry.pojo.attributes.find((a) => a.type === "memberOf")?.values || [],
              };
            });

            res.on("error", (err) => {
              client.unbind();
              reject(new Error("Error en búsqueda de AD: " + err.message));
            });

            res.on("end", () => {
              client.unbind();

              if (!userAD) {
                return reject(new Error("Usuario no encontrado en AD"));
              }

              // 5️⃣ Combinar datos de MongoDB y AD
              resolve({
                // Datos de MongoDB
                _id: usuarioMongo._id,
                nombres: usuarioMongo.nombres,
                apellidos: usuarioMongo.apellidos,
                apodo: usuarioMongo.apodo,
                avatar: usuarioMongo.avatar,
                email: usuarioMongo.email,
                rol: usuarioMongo.rol,
                estado: usuarioMongo.estado,
                // Datos de AD
                displayName: userAD.displayName,
                groups: userAD.groups,
              });
            });
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Verifica si un usuario existe en Active Directory
 */
async function userExistsInAD(apodo) {
  return new Promise((resolve, reject) => {
    const client = createLdapClient(true);

    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        client.unbind();
        return reject(new Error("Error al autenticar con AD"));
      }

      const searchOptions = {
        filter: `(sAMAccountName=${apodo})`,
        scope: "sub",
        attributes: ["cn"],
      };

      client.search(
        "DC=thenexusbattles,DC=local",
        searchOptions,
        (err, res) => {
          if (err) {
            client.unbind();
            return reject(err);
          }

          let found = false;

          res.on("searchEntry", () => {
            found = true;
          });

          res.on("error", (err) => {
            client.unbind();
            reject(err);
          });

          res.on("end", () => {
            client.unbind();
            resolve(found);
          });
        }
      );
    });
  });
}

module.exports = { getUserFromAD, userExistsInAD };