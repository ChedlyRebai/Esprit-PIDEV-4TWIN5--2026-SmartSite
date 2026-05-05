const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'apps/backend/materials-service/src/materials/materials.service.ts',
  'apps/backend/materials-service/src/materials/materials.controller.ts',
  'apps/backend/materials-service/src/sites/sites.controller.ts'
];

files.forEach(filePath => {
  console.log(`\n🔧 Fixing ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all occurrences
  const replacements = [
    // Replace coordonnees with coordinates
    [/site\.coordonnees/g, 'site.coordinates'],
    [/s\.coordonnees/g, 's.coordinates'],
    
    // Replace latitude/longitude with lat/lng
    [/\.latitude/g, '.lat'],
    [/\.longitude/g, '.lng'],
    
    // Replace ville and codePostal references
    [/site\.adresse \|\| `\$\{site\.ville \|\| ''\} \$\{site\.codePostal \|\| ''\}`\.trim\(\)/g, 'site.adresse || site.localisation || \'\''],
    [/s\.ville/g, 's.localisation'],
    [/site\.ville/g, 'site.localisation'],
    [/site\.codePostal/g, 'site.localisation']
  ];
  
  replacements.forEach(([pattern, replacement]) => {
    const before = content.length;
    content = content.replace(pattern, replacement);
    const after = content.length;
    if (before !== after) {
      console.log(`  ✅ Applied replacement: ${pattern} -> ${replacement}`);
    }
  });
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed ${filePath}`);
});

console.log('\n✅ All files fixed!');
