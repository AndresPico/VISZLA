// test-ldaps.js - Prueba de conexión LDAPS
const { createLdapClient } = require('../config/ldap');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log('🔍 Probando conexión LDAPS...\n');
console.log('📋 Configuración:');
console.log(`   Host: ${process.env.LDAPS_URL}`);
console.log(`   Admin DN: ${process.env.LDAP_ADMIN_DN}`);
console.log(`   URL: ${process.env.LDAPS_URL}\n`);

const client = createLdapClient(true);

client.on('error', (err) => {
  console.error('❌ Error en el cliente:', err.message);
});

console.log('🔐 Intentando autenticar...');

client.bind(process.env.LDAP_ADMIN_DN, process.env.ADMIN_PASS, (err) => {
  if (err) {
    console.error('❌ Error de autenticación:', err.message);
    console.error('📝 Detalles:', err);
    process.exit(1);
  }

  console.log('✅ ¡Autenticación exitosa!\n');
  
  // Buscar información del dominio
  const baseDN = 'DC=thenexusbattles,DC=local';
  const opts = {
    filter: '(objectClass=domain)',
    scope: 'base',
    attributes: ['dc', 'distinguishedName']
  };

  console.log('🔍 Buscando información del dominio...');
  
  client.search(baseDN, opts, (err, res) => {
    if (err) {
      console.error('❌ Error en búsqueda:', err.message);
      client.unbind();
      process.exit(1);
    }

    res.on('searchEntry', (entry) => {
      console.log('✅ Dominio encontrado:');
      console.log('   DN:', entry.objectName);
      console.log('   Atributos:', entry.pojo.attributes);
    });

    res.on('error', (err) => {
      console.error('❌ Error en resultados:', err.message);
    });

    res.on('end', () => {
      console.log('\n✅ Conexión LDAPS funcionando correctamente!');
      console.log('🎉 Tu servidor está listo para registrar usuarios.\n');
      client.unbind();
      process.exit(0);
    });
  });
});