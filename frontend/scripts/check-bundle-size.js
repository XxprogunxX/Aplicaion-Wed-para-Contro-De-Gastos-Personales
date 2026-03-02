const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, 'bundle-budget.json');
const nextStaticPath = path.join(projectRoot, '.next', 'static', 'chunks');

if (!fs.existsSync(configPath)) {
  console.error('No se encontró bundle-budget.json.');
  process.exit(1);
}

if (!fs.existsSync(nextStaticPath)) {
  console.error('No se encontró .next/static/chunks. Ejecuta `npm run build` primero.');
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const maxTotalBytes = Number(config.maxTotalBytes || 0);
const maxLargestChunkBytes = Number(config.maxLargestChunkBytes || 0);

function getAllJsFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return getAllJsFiles(fullPath);
    }
    return fullPath.endsWith('.js') ? [fullPath] : [];
  });
}

const jsFiles = getAllJsFiles(nextStaticPath);
const fileSizes = jsFiles.map((file) => ({
  file,
  size: fs.statSync(file).size,
}));

const totalBytes = fileSizes.reduce((accumulator, current) => accumulator + current.size, 0);
const largestChunk = fileSizes.sort((first, second) => second.size - first.size)[0];

console.log(`Total JS chunks: ${jsFiles.length}`);
console.log(`Total bundle size: ${totalBytes} bytes`);
console.log(`Largest chunk size: ${largestChunk ? largestChunk.size : 0} bytes`);

let hasError = false;

if (maxTotalBytes > 0 && totalBytes > maxTotalBytes) {
  console.error(`❌ El bundle total excede el máximo permitido (${totalBytes} > ${maxTotalBytes}).`);
  hasError = true;
}

if (maxLargestChunkBytes > 0 && largestChunk && largestChunk.size > maxLargestChunkBytes) {
  console.error(
    `❌ El chunk más grande excede el máximo permitido (${largestChunk.size} > ${maxLargestChunkBytes}).`
  );
  hasError = true;
}

if (hasError) {
  process.exit(1);
}

console.log('✅ Bundle dentro de los límites definidos.');
