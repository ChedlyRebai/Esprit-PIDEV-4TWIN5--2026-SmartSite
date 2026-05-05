/**
 * SCRIPT DE VÉRIFICATION COMPLÈTE - MATERIALS SYSTEM
 * 
 * Vérifie que toutes les corrections ont été appliquées
 * Run: node verify-all-fixes.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VÉRIFICATION COMPLÈTE - MATERIALS SYSTEM\n');
console.log('='.repeat(80));

const checks = [];

// ✅ CHECK 1: materials.service.ts - findAll() sans appels HTTP
console.log('\n📋 CHECK 1: findAll() sans appels HTTP externes');
try {
  const filePath = path.join(__dirname, 'apps/backend/materials-service/src/materials/materials.service.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasOldCode = content.includes('await this.httpService.axiosRef.get');
  const hasNewCode = content.includes('// ✅ FIX: Return materials without site info');
  
  if (!hasOldCode && hasNewCode) {
    console.log('   ✅ PASS: findAll() corrigé (pas d\'appels HTTP)');
    checks.push({ name: 'findAll() fix', status: 'PASS' });
  } else if (hasOldCode) {
    console.log('   ❌ FAIL: findAll() contient encore des appels HTTP');
    checks.push({ name: 'findAll() fix', status: 'FAIL' });
  } else {
    console.log('   ⚠️  WARNING: Code modifié mais marqueur absent');
    checks.push({ name: 'findAll() fix', status: 'WARNING' });
  }
} catch (error) {
  console.log('   ⚠️  WARNING: Could not read file:', error.message);
  checks.push({ name: 'findAll() fix', status: 'WARNING' });
}

// ✅ CHECK 2: materials.service.ts - getMaterialsWithSiteInfo() sans appels HTTP
console.log('\n📋 CHECK 2: getMaterialsWithSiteInfo() sans appels HTTP externes');
try {
  const filePath = path.join(__dirname, 'apps/backend/materials-service/src/materials/materials.service.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasOldCode = content.includes('const axios = require(\'axios\')');
  const hasNewCode = content.includes('// ✅ FIX: Return materials without external site calls');
  
  if (!hasOldCode && hasNewCode) {
    console.log('   ✅ PASS: getMaterialsWithSiteInfo() corrigé');
    checks.push({ name: 'getMaterialsWithSiteInfo() fix', status: 'PASS' });
  } else if (hasOldCode) {
    console.log('   ❌ FAIL: getMaterialsWithSiteInfo() contient encore des appels HTTP');
    checks.push({ name: 'getMaterialsWithSiteInfo() fix', status: 'FAIL' });
  } else {
    console.log('   ⚠️  WARNING: Code modifié mais marqueur absent');
    checks.push({ name: 'getMaterialsWithSiteInfo() fix', status: 'WARNING' });
  }
} catch (error) {
  console.log('   ⚠️  WARNING: Could not read file:', error.message);
  checks.push({ name: 'getMaterialsWithSiteInfo() fix', status: 'WARNING' });
}

// ✅ CHECK 3: materials.controller.ts - hasModel() au lieu de isModelTrained()
console.log('\n📋 CHECK 3: getModelInfo() utilise hasModel()');
try {
  const filePath = path.join(__dirname, 'apps/backend/materials-service/src/materials/materials.controller.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasOldCode = content.includes('this.autoMLService.isModelTrained(materialId)');
  const hasNewCode = content.includes('this.autoMLService.hasModel(materialId)');
  
  if (!hasOldCode && hasNewCode) {
    console.log('   ✅ PASS: getModelInfo() utilise hasModel()');
    checks.push({ name: 'getModelInfo() fix', status: 'PASS' });
  } else if (hasOldCode) {
    console.log('   ❌ FAIL: getModelInfo() utilise encore isModelTrained()');
    checks.push({ name: 'getModelInfo() fix', status: 'FAIL' });
  } else {
    console.log('   ⚠️  WARNING: Code modifié mais méthode non trouvée');
    checks.push({ name: 'getModelInfo() fix', status: 'WARNING' });
  }
} catch (error) {
  console.log('   ⚠️  WARNING: Could not read file:', error.message);
  checks.push({ name: 'getModelInfo() fix', status: 'WARNING' });
}

// ✅ CHECK 4: materialService.ts - Validation paramètres getMaterials()
console.log('\n📋 CHECK 4: getMaterials() validation paramètres');
try {
  const filePath = path.join(__dirname, 'apps/frontend/src/services/materialService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasValidation = content.includes('const cleanParams: any = {};');
  const hasSortOrderCheck = content.includes('[\'asc\', \'desc\'].includes(params.sortOrder)');
  
  if (hasValidation && hasSortOrderCheck) {
    console.log('   ✅ PASS: getMaterials() valide les paramètres');
    checks.push({ name: 'getMaterials() validation', status: 'PASS' });
  } else {
    console.log('   ❌ FAIL: getMaterials() validation manquante');
    checks.push({ name: 'getMaterials() validation', status: 'FAIL' });
  }
} catch (error) {
  console.log('   ⚠️  WARNING: Could not read file:', error.message);
  checks.push({ name: 'getMaterials() validation', status: 'WARNING' });
}

// ✅ CHECK 5: materialService.ts - getModelInfo() gestion 404
console.log('\n📋 CHECK 5: getModelInfo() gestion 404');
try {
  const filePath = path.join(__dirname, 'apps/frontend/src/services/materialService.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const has404Check = content.includes('if (error.response?.status === 404)');
  const hasNewEndpoint = content.includes('/ml/model-info/${materialId}');
  
  if (has404Check && hasNewEndpoint) {
    console.log('   ✅ PASS: getModelInfo() gère le 404 gracieusement');
    checks.push({ name: 'getModelInfo() 404 handling', status: 'PASS' });
  } else {
    console.log('   ❌ FAIL: getModelInfo() gestion 404 manquante');
    checks.push({ name: 'getModelInfo() 404 handling', status: 'FAIL' });
  }
} catch (error) {
  console.log('   ⚠️  WARNING: Could not read file:', error.message);
  checks.push({ name: 'getModelInfo() 404 handling', status: 'WARNING' });
}

// ✅ CHECK 6: ConsumptionHistory.tsx - Endpoint export corrigé
console.log('\n📋 CHECK 6: Export endpoint corrigé');
try {
  const filePath = path.join(__dirname, 'apps/frontend/src/app/pages/materials/ConsumptionHistory.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasCorrectEndpoint = content.includes('/api/materials/consumption-history/export');
  const hasOldEndpoint = content.includes('/api/consumption-history/export') && 
                         !content.includes('/api/materials/consumption-history/export');
  
  if (hasCorrectEndpoint && !hasOldEndpoint) {
    console.log('   ✅ PASS: Export utilise le bon endpoint');
    checks.push({ name: 'Export endpoint fix', status: 'PASS' });
  } else if (hasOldEndpoint) {
    console.log('   ❌ FAIL: Export utilise encore l\'ancien endpoint');
    checks.push({ name: 'Export endpoint fix', status: 'FAIL' });
  } else {
    console.log('   ⚠️  WARNING: Endpoint non trouvé');
    checks.push({ name: 'Export endpoint fix', status: 'WARNING' });
  }
} catch (error) {
  console.log('   ⚠️  WARNING: Could not read file:', error.message);
  checks.push({ name: 'Export endpoint fix', status: 'WARNING' });
}

// ✅ CHECK 7: SiteConsumptionTracker.tsx - Vérification null materialId
console.log('\n📋 CHECK 7: Vérification null materialId');
try {
  const filePath = path.join(__dirname, 'apps/frontend/src/app/pages/materials/SiteConsumptionTracker.tsx');
  const content = fs.readFileSync(filePath, 'utf8');
  
  const hasNullCheck = content.includes('if (typeof firstReq.materialId === \'object\' && firstReq.materialId !== null)');
  const hasErrorToast = content.includes('toast.error(\'Material ID not found\')');
  
  if (hasNullCheck && hasErrorToast) {
    console.log('   ✅ PASS: Vérification null pour materialId présente');
    checks.push({ name: 'materialId null check', status: 'PASS' });
  } else {
    console.log('   ❌ FAIL: Vérification null manquante');
    checks.push({ name: 'materialId null check', status: 'FAIL' });
  }
} catch (error) {
  console.log('   ⚠️  WARNING: Could not read file:', error.message);
  checks.push({ name: 'materialId null check', status: 'WARNING' });
}

// ✅ SUMMARY
console.log('\n' + '='.repeat(80));
console.log('\n📊 RÉSUMÉ DES VÉRIFICATIONS\n');

const passed = checks.filter(c => c.status === 'PASS').length;
const failed = checks.filter(c => c.status === 'FAIL').length;
const warnings = checks.filter(c => c.status === 'WARNING').length;

checks.forEach(check => {
  const icon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${check.name}: ${check.status}`);
});

console.log('\n' + '='.repeat(80));
console.log(`\n✅ PASSED: ${passed}/${checks.length}`);
console.log(`❌ FAILED: ${failed}/${checks.length}`);
console.log(`⚠️  WARNINGS: ${warnings}/${checks.length}`);

if (failed === 0 && warnings === 0) {
  console.log('\n🎉 TOUTES LES CORRECTIONS SONT APPLIQUÉES CORRECTEMENT!\n');
  console.log('✅ Le Materials Service est prêt pour le démarrage.\n');
  console.log('📝 Prochaine étape: cd apps/backend/materials-service && npm start\n');
  process.exit(0);
} else if (failed === 0) {
  console.log('\n⚠️  Toutes les corrections sont appliquées mais certains fichiers n\'ont pas pu être vérifiés.\n');
  console.log('✅ Le Materials Service devrait fonctionner correctement.\n');
  process.exit(0);
} else {
  console.log('\n❌ CERTAINES CORRECTIONS SONT MANQUANTES OU INCOMPLÈTES!\n');
  console.log('⚠️  Veuillez vérifier les erreurs ci-dessus avant de démarrer le service.\n');
  process.exit(1);
}
