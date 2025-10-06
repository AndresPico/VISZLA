const { Change, Attribute } = require("ldapjs");
const path = require("path");
const dotenv = require("dotenv");
const { createLdapClient } = require("../../../config/ldap");

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

/**
 * 📌 Crear un usuario en AD (sin contraseña)
 */
async function createUser({ dn, nombres, apellidos, apodo, email }) {
  return new Promise((resolve, reject) => {
    const client = createLdapClient(true);

    console.debug("🛠 Creando usuario en AD...");
    console.debug("DN recibido:", dn);
    console.debug("Datos recibidos:", { nombres, apellidos, apodo, email });

    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        client.unbind();
        console.error("❌ Error autenticando administrador:", err);
        return reject(new Error(`Error autenticando en AD: ${err.message}`));
      }

      const entry = {
        cn: apodo,
        sn: apellidos,
        givenName: nombres,
        displayName: `${nombres} ${apellidos}`,
        mail: email,
        sAMAccountName: apodo,
        userPrincipalName: `${apodo}@thenexusbattles.local`,
        objectClass: ["top", "person", "organizationalPerson", "user"],
        userAccountControl: "544", // 🔒 Cuenta creada pero deshabilitada
      };

      console.debug("📝 Entrada a crear en AD:", entry);

      client.add(dn, entry, (err) => {
        client.unbind();
        if (err) {
          console.error("❌ Error creando usuario:", err);
          return reject(new Error(`Error creando usuario: ${err.message}`));
        }
        console.log(`✅ Usuario ${apodo} creado en AD`);
        resolve(true);
      });
    });
  });
}

/**
 * 📌 Asignar contraseña al usuario
 */
const util = require('util');

async function setPassword(dn, password) {
  return new Promise((resolve, reject) => {
    const client = createLdapClient(true);  // asegúrate que es LDAPS

    console.debug("🛠 Asignando contraseña...");
    console.debug("DN recibido:", dn);
    console.debug("Password recibido (texto):", password);

    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (bindErr) => {
      if (bindErr) {
        client.unbind();
        console.error("❌ Error autenticando administrador:", bindErr);
        return reject(new Error(`Error autenticando en AD: ${bindErr.message}`));
      }

      const passwordQuoted = `"${password}"`;
      const passwordBuffer = Buffer.from(passwordQuoted, "utf16le");
      console.debug("Contraseña con comillas:", passwordQuoted);
      console.debug("Contraseña en buffer UTF-16LE:", passwordBuffer);

      // Cargar los constructores si están disponibles
      let AttributeCtor = null, ChangeCtor = null;
      try {
        AttributeCtor = require('@ldapjs/attribute');
        ChangeCtor = require('@ldapjs/change');
      } catch (_) {
        // intentar con ldapjs clásico
        try {
          const ldapjs = require('ldapjs');
          AttributeCtor = ldapjs.Attribute || ldapjs.LdapAttribute;
          ChangeCtor = ldapjs.Change || ldapjs.LdapChange;
        } catch (_) {
          AttributeCtor = null;
          ChangeCtor = null;
        }
      }

      function modifyWith(op, cb) {
        if (AttributeCtor && ChangeCtor) {
          const attribute = new AttributeCtor({
            type: 'unicodePwd',
            values: [passwordBuffer]
          });
          console.debug("Attribute (inspect):", util.inspect(attribute, { showHidden: true, depth: 2 }));
          const change = new ChangeCtor({
            operation: op,
            modification: attribute
          });
          console.debug("Change (inspect):", util.inspect(change, { showHidden: true, depth: 2 }));
          client.modify(dn, change, cb);
        } else {
          // fallback plano
          const mods = [{
            operation: op,
            modification: { unicodePwd: passwordBuffer }
          }];
          console.debug("Fallback mods:", mods.map(m => ({
            op: m.operation,
            hasBuf: !!m.modification.unicodePwd
          })));
          client.modify(dn, mods, cb);
        }
      }

      // Primero intento administrativo (replace)
      modifyWith('replace', (errReplace) => {
        if (!errReplace) {
          console.log("✅ Contraseña asignada con replace (reset administrativo).");
          client.unbind();
          return resolve(true);
        }
        console.warn("⚠️ Replace falló:", errReplace && errReplace.message);

        // Solo en caso de UnwillingToPerform lo intentamos con add
        if (errReplace && errReplace.lde_message === 'Unwilling To Perform') {
          console.log("✨ Intentando add porque replace fue rechazado...");

          modifyWith('add', (errAdd) => {
            client.unbind();
            if (errAdd) {
              console.error("❌ Add también falló:", errAdd);
              return reject(new Error("Error asignando contraseña (add): " + (errAdd.message || errAdd)));
            }
            console.log("✅ Contraseña asignada con add (usuario nuevo).");
            return resolve(true);
          });
        } else {
          // Si no es UnwillingToPerform, devolvemos error directamente
          client.unbind();
          return reject(new Error("Error asignando contraseña (replace): " + (errReplace.message || errReplace)));
        }
      });
    });
  });
}


/**
 * 📌 Habilitar la cuenta
 */
async function enableUser(dn) {
  return new Promise((resolve, reject) => {
    const client = createLdapClient(true);

    console.debug("🛠 Habilitando usuario...");
    console.debug("DN recibido:", dn);

    client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
      if (err) {
        client.unbind();
        console.error("❌ Error autenticando administrador:", err);
        return reject(new Error(`Error autenticando en AD: ${err.message}`));
      }

      const change = new Change({
        operation: "replace",
        modification: new Attribute({
          type: "userAccountControl",
          values: ["512"], // ✅ Cuenta habilitada
        }),
      });

      console.debug("Cambio preparado para habilitar cuenta:", change);

      client.modify(dn, change, (err) => {
        client.unbind();
        if (err) {
          console.error("❌ Error habilitando usuario:", err);
          return reject(new Error(`Error habilitando usuario: ${err.message}`));
        }
        console.log(`✅ Usuario habilitado: ${dn}`);
        resolve(true);
      });
    });
  });
}

module.exports = { createUser, setPassword, enableUser };
