const validateRegisterInput = (data) => {
  const errors = [];
  
  console.log("Datos recibidos en validación:", data); // Para debug
  
  // Validar nombres
  if (!data.nombres || data.nombres.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres');
  }
  
  // Validar apodo
  if (!data.apodo || data.apodo.trim().length < 3) {
    errors.push('El apodo debe tener al menos 3 caracteres');
  }
  
  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email)) {
    errors.push('Ingresa un correo electrónico válido');
  }
  
  // Validar contraseña
  if (!data.password || data.password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // Validar confirmación de contraseña
  if (data.password !== data.confirmPassword) {
    errors.push('Las contraseñas no coinciden');
  }
  
  // Validar aceptación de términos - más flexible
  const acceptTermsValue = data.acceptTerms;
  console.log("Valor de acceptTerms:", acceptTermsValue, typeof acceptTermsValue); // Para debug
  
  if (!acceptTermsValue || acceptTermsValue === 'false' || acceptTermsValue === false) {
    errors.push('Debes aceptar el tratamiento de datos personales');
  }
  
  return errors;
};

module.exports = { validateRegisterInput };