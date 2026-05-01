const fs = require('fs');
const path = require('path');

const csvFiles = [
  { name: 'temperature_dataset.csv', key: 'temperature' },
  { name: 'humidity_dataset.csv', key: 'humidity' },
  { name: 'water_quantity_dataset.csv', key: 'water_quantity' },
];

csvFiles.forEach(({ name, key }) => {
  const csvPath = path.join(__dirname, '..', 'data1', name);
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  const data = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const [date, value] = lines[i].split(',');
    if (date && value) {
      data.push({
        date: date.trim(),
        [key]: parseFloat(value.trim())
      });
    }
  }
  
  const jsContent = `// Auto-generated from ${name}
export const data = ${JSON.stringify(data, null, 2)};
`;
  
  const outputPath = path.join(__dirname, '..', 'src', 'data', `${key}_data.js`);
  const outputDir = path.dirname(outputPath);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, jsContent, 'utf8');
  console.log(`Converted ${name} to ${outputPath}`);
});





