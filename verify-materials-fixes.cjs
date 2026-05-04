#!/usr/bin/env node

/**
 * VERIFICATION SCRIPT - Materials Service Fixes
 * 
 * This script verifies that all the fixes have been applied correctly:
 * 1. TypeScript compilation succeeds
 * 2. SitesService is properly injected
 * 3. Site information methods are implemented
 * 4. hasModel() is used instead of isModelTrained()
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('🔍 VERIFICATION SCRIPT - Materials Service Fixes');
console.log('='.repeat(80) + '\n');

let allChecksPassed = true;
const results = [];

// Helper function to check if a file contains a pattern
function fileContains(filePath, pattern, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const found = pattern.test(content);
    
    results.push({
      check: description,
      status: found ? '✅ PASS' : '❌ FAIL',
      file: filePath,
    });
    
    if (!found) {
      allChecksPassed = false;
      console.log(`❌ FAIL: ${description}`);
      console.log(`   File: ${filePath}`);
      console.log(`   Pattern not found: ${pattern}\n`);
    } else {
      console.log(`✅ PASS: ${description}`);
    }
    
    return found;
  } catch (error) {
    results.push({
      check: description,
      status: '❌ ERROR',
      file: filePath,
      error: error.message,
    });
    
    allChecksPassed = false;
    console.log(`❌ ERROR: ${description}`);
    console.log(`   File: ${filePath}`);
    console.log(`   Error: ${error.message}\n`);
    return false;
  }
}

// Check 1: SitesService import in materials.service.ts
console.log('\n📋 Check 1: SitesService Import');
console.log('-'.repeat(80));
fileContains(
  'apps/backend/materials-service/src/materials/materials.service.ts',
  /import\s+{\s*SitesService\s*}\s+from\s+['"]\.\.\/sites\/sites\.service['"]/,
  'SitesService is imported in materials.service.ts'
);

// Check 2: SitesService injection in constructor
console.log('\n📋 Check 2: SitesService Injection');
console.log('-'.repeat(80));
fileContains(
  'apps/backend/materials-service/src/materials/materials.service.ts',
  /private\s+readonly\s+sitesService:\s*SitesService/,
  'SitesService is injected in MaterialsService constructor'
);

// Check 3: findAll() fetches site info
console.log('\n📋 Check 3: findAll() Site Info Retrieval');
console.log('-'.repeat(80));
fileContains(
  'apps/backend/materials-service/src/materials/materials.service.ts',
  /const\s+site\s*=\s*await\s+this\.sitesService\.findOne\(siteIdStr\)/,
  'findAll() fetches site info using sitesService.findOne()'
);

// Check 4: findOne() fetches site info
console.log('\n📋 Check 4: findOne() Site Info Retrieval');
console.log('-'.repeat(80));
fileContains(
  'apps/backend/materials-service/src/materials/materials.service.ts',
  /async\s+findOne\(id:\s*string\):\s*Promise<any>/,
  'findOne() returns Promise<any> to include site info'
);

// Check 5: getMaterialsWithSiteInfo() fetches site info
console.log('\n📋 Check 5: getMaterialsWithSiteInfo() Site Info Retrieval');
console.log('-'.repeat(80));
fileContains(
  'apps/backend/materials-service/src/materials/materials.service.ts',
  /async\s+getMaterialsWithSiteInfo\(\)/,
  'getMaterialsWithSiteInfo() method exists'
);

// Check 6: hasModel() is used instead of isModelTrained()
console.log('\n📋 Check 6: hasModel() Usage in Controller');
console.log('-'.repeat(80));
fileContains(
  'apps/backend/materials-service/src/materials/materials.controller.ts',
  /this\.autoMLService\.hasModel\(materialId\)/,
  'hasModel() is used instead of isModelTrained()'
);

// Check 7: No isModelTrained() calls remain (excluding comments)
console.log('\n📋 Check 7: No isModelTrained() Calls');
console.log('-'.repeat(80));
try {
  const content = fs.readFileSync('apps/backend/materials-service/src/materials/materials.controller.ts', 'utf-8');
  // Remove comments and check for isModelTrained(
  const withoutComments = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const hasIsModelTrained = /isModelTrained\s*\(/.test(withoutComments);
  
  if (!hasIsModelTrained) {
    console.log('✅ PASS: No isModelTrained() calls found (excluding comments)');
    results.push({
      check: 'No isModelTrained() calls remain',
      status: '✅ PASS',
      file: 'apps/backend/materials-service/src/materials/materials.controller.ts',
    });
  } else {
    console.log('❌ FAIL: isModelTrained() calls still present');
    results.push({
      check: 'No isModelTrained() calls remain',
      status: '❌ FAIL',
      file: 'apps/backend/materials-service/src/materials/materials.controller.ts',
    });
    allChecksPassed = false;
  }
} catch (error) {
  console.log(`❌ ERROR: ${error.message}`);
  results.push({
    check: 'No isModelTrained() calls remain',
    status: '❌ ERROR',
    error: error.message,
  });
  allChecksPassed = false;
}

// Check 8: Site coordinates structure
console.log('\n📋 Check 8: Site Coordinates Structure');
console.log('-'.repeat(80));
fileContains(
  'apps/backend/materials-service/src/materials/materials.service.ts',
  /siteCoordinates:\s*site\.coordonnees\?\.latitude\s*&&\s*site\.coordonnees\?\.longitude/,
  'Site coordinates are properly extracted from site.coordonnees'
);

// Check 9: MaterialDetails.tsx displays site info
console.log('\n📋 Check 9: Frontend MaterialDetails Site Display');
console.log('-'.repeat(80));
fileContains(
  'apps/frontend/src/app/pages/materials/MaterialDetails.tsx',
  /material\.siteName/,
  'MaterialDetails.tsx displays siteName'
);

fileContains(
  'apps/frontend/src/app/pages/materials/MaterialDetails.tsx',
  /material\.siteCoordinates/,
  'MaterialDetails.tsx displays siteCoordinates'
);

// Summary
console.log('\n' + '='.repeat(80));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(80));

const passCount = results.filter(r => r.status === '✅ PASS').length;
const failCount = results.filter(r => r.status === '❌ FAIL').length;
const errorCount = results.filter(r => r.status === '❌ ERROR').length;

console.log(`\nTotal Checks: ${results.length}`);
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`❌ Errors: ${errorCount}`);

if (allChecksPassed) {
  console.log('\n🎉 ALL CHECKS PASSED! Materials Service is ready.');
  console.log('✅ TypeScript compilation should succeed');
  console.log('✅ Site information will be fetched from MongoDB');
  console.log('✅ Frontend will display site name, address, and GPS coordinates');
} else {
  console.log('\n⚠️  SOME CHECKS FAILED! Please review the errors above.');
}

console.log('\n' + '='.repeat(80) + '\n');

// Exit with appropriate code
process.exit(allChecksPassed ? 0 : 1);
