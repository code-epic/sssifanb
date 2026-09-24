const fs = require('fs');
const buildDateTime = new Date().toString();

// Actualiza environment.prod.ts
const environmentProdFilePath = 'src/environments/environment.prod.ts';
let environmentProdFileContent = fs.readFileSync(environmentProdFilePath, 'utf8');
// Actualizamos el regex para buscar comillas dobles y las inyectamos igual
environmentProdFileContent = environmentProdFileContent.replace(/buildDateTime:\s*".*"/, `buildDateTime: "${buildDateTime}"`);
fs.writeFileSync(environmentProdFilePath, environmentProdFileContent, 'utf8');

// Actualiza environment.ts
const environmentFilePath = 'src/environments/environment.ts';
let environmentFileContent = fs.readFileSync(environmentFilePath, 'utf8');
environmentFileContent = environmentFileContent.replace(/buildDateTime:\s*".*"/, `buildDateTime: "${buildDateTime}"`);
fs.writeFileSync(environmentFilePath, environmentFileContent, 'utf8');

console.log(`✅ Archivos de entorno actualizados con éxito.`);
console.log(`🕒 Nueva fecha de compilación: ${buildDateTime}`);
