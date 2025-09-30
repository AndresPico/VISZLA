const { exec } = require('child_process');

async function testCreateUserWithPassword() {
  // Datos del usuario de prueba
  const nombre = 'Prueba5';
  const apellido = 'Pepito';
  const usuario = 'prueba5';
  const password = 'Andres$2000';
  const domain = 'thenexusbattles.local';

  // Comando PowerShell para crear o actualizar el usuario en AD
  const comando = `
    $user = Get-ADUser -Identity "${usuario}" -ErrorAction SilentlyContinue;
    if ($user) {
        Set-ADAccountPassword -Identity "${usuario}" -NewPassword (ConvertTo-SecureString "${password}" -AsPlainText -Force) -Reset;
        Enable-ADAccount -Identity "${usuario}";
        Write-Output "Usuario existente actualizado correctamente";
    } else {
        New-ADUser -Name "${nombre} ${apellido}" -GivenName "${nombre}" -Surname "${apellido}" -SamAccountName "${usuario}" -UserPrincipalName "${usuario}@${domain}" -AccountPassword (ConvertTo-SecureString "${password}" -AsPlainText -Force) -Enabled $true;
        Write-Output "Usuario creado correctamente";
    }
  `;

  exec(`powershell -Command "${comando}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Error ejecutando PowerShell:', error.message);
      return;
    }
    if (stderr) {
      console.error('❌ STDERR:', stderr);
      return;
    }
    console.log('✅ PowerShell ejecutado con éxito:', stdout.trim());
  });
}

testCreateUserWithPassword();

