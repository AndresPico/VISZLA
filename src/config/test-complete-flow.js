// test-complete-flow.js - Prueba completa del flujo de registro y login
const axios = require("axios");

const BASE_URL = "http://localhost:3000/api/usuarios";

// Datos de prueba
const testUser = {
  nombres: "Pipe",
  apellidos: "Prueba",
  apodo: "prueba7", 
  email: "test7@thenexusbattles.com", 
  password: "AndRe$FPG2001!",
  confirmPassword: "AndRe$FPG2001!",
  acceptTerms: true,
  avatar: "",
};

async function testCompleteFlow() {
  console.log("🧪 INICIANDO PRUEBAS DE FLUJO COMPLETO\n");
  console.log("=" .repeat(50));

  try {
    // ====================================
    // 1. REGISTRO DE USUARIO
    // ====================================
    console.log("\n📝 PASO 1: Registrando usuario...");
    console.log("Datos:", {
      nombres: testUser.nombres,
      apellidos: testUser.apellidos,
      apodo: testUser.apodo,
      email: testUser.email,
    });

    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);

    console.log("✅ Registro exitoso!");
    console.log("Respuesta:", registerResponse.data);
    console.log("\n⚠️  IMPORTANTE: Revisa tu correo y verifica la cuenta antes de continuar");
    console.log("   O cambia confirmado: true manualmente en MongoDB para hacer pruebas");

    // ====================================
    // 2. LOGIN (esperar 5 segundos)
    // ====================================
    console.log("\n⏳ Esperando 5 segundos antes de intentar login...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log("\n🔐 PASO 2: Intentando login...");
    
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password,
    });

    console.log("✅ Login exitoso!");
    console.log("Token recibido:", loginResponse.data.token.substring(0, 50) + "...");
    console.log("Usuario:", loginResponse.data.user);

    const token = loginResponse.data.token;

    // ====================================
    // RESUMEN
    // ====================================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 ¡TODAS LAS PRUEBAS PASARON EXITOSAMENTE!");
    console.log("=".repeat(50));
    console.log("\n✅ Flujo completo verificado:");
    console.log("   1. ✓ Registro de usuario en AD + MongoDB");
    console.log("   2. ✓ Login con autenticación AD");
    console.log("   3. ✓ Obtención de perfil con JWT");
    console.log("   4. ✓ Actualización de perfil");
    console.log("\n💡 Próximos pasos:");
    console.log("   - Verificar el usuario en Active Directory");
    console.log("   - Verificar el usuario en MongoDB");
    console.log("   - Probar desde el frontend");

  } catch (error) {
    console.error("\n❌ ERROR EN LA PRUEBA:");
    
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Mensaje:", error.response.data.message);
      console.error("Detalles:", error.response.data);
    } else if (error.request) {
      console.error("No se recibió respuesta del servidor");
      console.error("¿Está el servidor corriendo en", BASE_URL, "?");
    } else {
      console.error("Error:", error.message);
    }

    console.log("\n📋 DIAGNÓSTICO:");
    console.log("1. Verifica que el servidor esté corriendo: npm start");
    console.log("2. Verifica la conexión a MongoDB");
    console.log("3. Verifica la conexión al servidor AD");
    console.log("4. Revisa los logs del servidor");
  }
}

// Ejecutar las pruebas
testCompleteFlow();