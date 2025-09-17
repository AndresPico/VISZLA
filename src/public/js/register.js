const API = {
  register: (data) =>
    fetch('/api/usuarios/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
};

// Elementos del DOM
const form = document.getElementById('registerForm');
const alertContainer = document.getElementById('alertContainer');
const submitBtn = document.getElementById('submitBtn');
const spinner = document.getElementById('spinner');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordStrength = document.getElementById('passwordStrength');

// Elementos de requisitos
const requirements = {
  length: document.getElementById('req-length'),
  uppercase: document.getElementById('req-uppercase'),
  number: document.getElementById('req-number'),
  special: document.getElementById('req-special')
};

// Evento para abrir el PDF de tratamiento de datos
  termsLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Abrir el PDF en una nueva pestaña
    window.open('../assets/documents/tratamiento-datos.pdf', '_blank');
  });

// Funciones de utilidad
function showAlert(message, type = 'danger', errors = []) {
  let alertHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <strong>${message}</strong>
  `;
  
  if (errors && errors.length > 0) {
    alertHTML += '<ul class="mb-0 mt-2">';
    errors.forEach(error => {
      alertHTML += `<li>${error}</li>`;
    });
    alertHTML += '</ul>';
  }
  
  alertHTML += `
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;
  
  alertContainer.innerHTML = alertHTML;
}

function clearFieldErrors() {
  const fields = ['nombres', 'apellidos', 'apodo', 'email', 'password', 'confirmPassword','acceptTerms'];
  fields.forEach(field => {
    const input = document.getElementById(field);
    input.classList.remove('is-invalid');
    const feedback = input.nextElementSibling?.nextElementSibling;
    if (feedback && feedback.classList.contains('invalid-feedback')) {
      feedback.textContent = '';
    }
  });
}

function setFieldError(fieldId, message) {
  const input = document.getElementById(fieldId);
  input.classList.add('is-invalid');
  const feedback = input.nextElementSibling?.nextElementSibling;
  if (feedback && feedback.classList.contains('invalid-feedback')) {
    feedback.textContent = message;
  }
}

function updatePasswordRequirements(password) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  Object.keys(checks).forEach(key => {
    const element = requirements[key];
    const icon = element.querySelector('i');
    
    if (checks[key]) {
      element.classList.add('met');
      element.classList.remove('not-met');
      icon.className = 'bi bi-check-circle';
    } else {
      element.classList.add('not-met');
      element.classList.remove('met');
      icon.className = 'bi bi-x-circle';
    }
  });

  // Actualizar barra de fuerza
  const metCount = Object.values(checks).filter(Boolean).length;
  passwordStrength.className = 'password-strength mb-2';
  
  if (password.length === 0) {
    passwordStrength.style.width = '0%';
  } else if (metCount <= 1) {
    passwordStrength.classList.add('strength-weak');
    passwordStrength.style.width = '25%';
  } else if (metCount <= 2) {
    passwordStrength.classList.add('strength-weak');
    passwordStrength.style.width = '50%';
  } else if (metCount === 3) {
    passwordStrength.classList.add('strength-medium');
    passwordStrength.style.width = '75%';
  } else {
    passwordStrength.classList.add('strength-strong');
    passwordStrength.style.width = '100%';
  }
}

function validatePasswords() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  if (confirmPassword && password !== confirmPassword) {
    setFieldError('confirmPassword', 'Las contraseñas no coinciden');
    return false;
  } else if (confirmPassword) {
    document.getElementById('confirmPassword').classList.remove('is-invalid');
  }
  
  return true;
}

function setLoading(loading) {
  if (loading) {
    submitBtn.disabled = true;
    spinner.classList.remove('d-none');
    submitBtn.textContent = 'Registrando...';
  } else {
    submitBtn.disabled = false;
    spinner.classList.add('d-none');
    submitBtn.textContent = 'Registrarse';
  }
}

// Event listeners
passwordInput.addEventListener('input', (e) => {
  updatePasswordRequirements(e.target.value);
  validatePasswords();
});

confirmPasswordInput.addEventListener('input', validatePasswords);

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  alertContainer.innerHTML = '';
  clearFieldErrors();
  
  const formData = new FormData(form);
  const data = Object.fromEntries(formData);
  
  // Validación del lado del cliente
  if (!validatePasswords()) {
    return;
  }
  
  setLoading(true);
  
  try {
    const response = await API.register(data);
    const result = await response.json();
    
    if (response.ok) {
      showAlert('¡Registro exitoso! Bienvenido a The Nexus Battle IV.', 'success');
      form.reset();
      updatePasswordRequirements('');
      
      // Redirigir después de 2 segundos
      setTimeout(() => {
        window.location.href = '/pages/login.html';
      }, 2000);
      
    } else {
      showAlert(result.message || 'Error en el registro', 'danger', result.errors);
      
      // Mostrar errores específicos de campo si están disponibles
      if (result.errors) {
        result.errors.forEach(error => {
          if (error.includes('nombre')) {
            setFieldError('nombres', error);
          } else if (error.includes('apodo')) {
            setFieldError('apodo', error); 
          } else if (error.includes('correo') || error.includes('email')) {
            setFieldError('email', error);
          } else if (error.includes('contraseña') && !error.includes('coinciden')) {
            setFieldError('password', error);
          } else if (error.includes('coinciden')) {
            setFieldError('confirmPassword', error);
          }
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showAlert('Error de conexión. Inténtalo de nuevo.', 'danger');
  } finally {
    setLoading(false);
  }
});

// Inicializar
updatePasswordRequirements('');