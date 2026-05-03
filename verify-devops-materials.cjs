#!/usr/bin/env node

/**
 * Script de Vérification DevOps - Materials Service
 * Vérifie que tous les fichiers DevOps sont correctement configurés
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VÉRIFICATION DEVOPS - MATERIALS SERVICE\n');
console.log('=' .repeat(60));

const SERVICE_DIR = 'apps/backend/materials-service';
const checks = [];

// ========== VÉRIFICATION 1: Dockerfile ==========
console.log('\n📦 1. Vérification du Dockerfile...');
const dockerfilePath = path.join(SERVICE_DIR, 'Dockerfile');
if (fs.existsSync(dockerfilePath)) {
  const content = fs.readFileSync(dockerfilePath, 'utf8');
  
  const hasBuilder = content.includes('FROM node:20-alpine AS builder');
  const hasProduction = content.includes('FROM node:20-alpine AS production');
  const hasPort3009 = content.includes('EXPOSE 3009');
  const hasCorrectCmd = content.includes('CMD ["node", "dist/src/main"]');
  
  if (hasBuilder && hasProduction && hasPort3009 && hasCorrectCmd) {
    console.log('   ✅ Dockerfile: Multi-stage build correct');
    console.log('   ✅ Port: 3009');
    console.log('   ✅ CMD: node dist/src/main');
    checks.push({ name: 'Dockerfile', status: 'OK' });
  } else {
    console.log('   ❌ Dockerfile: Configuration incorrecte');
    checks.push({ name: 'Dockerfile', status: 'ERREUR' });
  }
} else {
  console.log('   ❌ Dockerfile: Fichier manquant');
  checks.push({ name: 'Dockerfile', status: 'MANQUANT' });
}

// ========== VÉRIFICATION 2: .dockerignore ==========
console.log('\n📦 2. Vérification du .dockerignore...');
const dockerignorePath = path.join(SERVICE_DIR, '.dockerignore');
if (fs.existsSync(dockerignorePath)) {
  const content = fs.readFileSync(dockerignorePath, 'utf8');
  
  const hasNodeModules = content.includes('node_modules');
  const hasDist = content.includes('dist');
  const hasEnv = content.includes('.env');
  const hasTests = content.includes('*.spec.ts');
  
  if (hasNodeModules && hasDist && hasEnv && hasTests) {
    console.log('   ✅ .dockerignore: Configuration correcte');
    console.log('   ✅ Exclut: node_modules, dist, .env, tests');
    checks.push({ name: '.dockerignore', status: 'OK' });
  } else {
    console.log('   ❌ .dockerignore: Configuration incomplète');
    checks.push({ name: '.dockerignore', status: 'ERREUR' });
  }
} else {
  console.log('   ❌ .dockerignore: Fichier manquant');
  checks.push({ name: '.dockerignore', status: 'MANQUANT' });
}

// ========== VÉRIFICATION 3: Jenkinsfile (CI) ==========
console.log('\n🔧 3. Vérification du Jenkinsfile (CI)...');
const jenkinsfilePath = path.join(SERVICE_DIR, 'Jenkinsfile');
if (fs.existsSync(jenkinsfilePath)) {
  const content = fs.readFileSync(jenkinsfilePath, 'utf8');
  
  const hasCheckout = content.includes("stage('Checkout')");
  const hasInstall = content.includes("stage('Install Dependencies')");
  const hasTests = content.includes("stage('Unit Tests')");
  const hasBuild = content.includes("stage('Build')");
  const hasSonar = content.includes("stage('SonarQube Analysis')");
  const hasQualityGate = content.includes("stage('Quality Gate')");
  const hasTriggerCD = content.includes("stage('Trigger CD')");
  
  if (hasCheckout && hasInstall && hasTests && hasBuild && hasSonar && hasQualityGate && hasTriggerCD) {
    console.log('   ✅ Jenkinsfile CI: Toutes les étapes présentes');
    console.log('   ✅ Étapes: Checkout → Install → Tests → Build → SonarQube → Quality Gate → Trigger CD');
    checks.push({ name: 'Jenkinsfile CI', status: 'OK' });
  } else {
    console.log('   ❌ Jenkinsfile CI: Étapes manquantes');
    checks.push({ name: 'Jenkinsfile CI', status: 'ERREUR' });
  }
} else {
  console.log('   ❌ Jenkinsfile CI: Fichier manquant');
  checks.push({ name: 'Jenkinsfile CI', status: 'MANQUANT' });
}

// ========== VÉRIFICATION 4: Jenkinsfile-CD ==========
console.log('\n🚀 4. Vérification du Jenkinsfile-CD...');
const jenkinsfileCDPath = path.join(SERVICE_DIR, 'Jenkinsfile-CD');
if (fs.existsSync(jenkinsfileCDPath)) {
  const content = fs.readFileSync(jenkinsfileCDPath, 'utf8');
  
  const hasGhada = content.includes('ghada/smartsite-materials-service');
  const hasCheckout = content.includes("stage('Checkout')");
  const hasDockerBuild = content.includes("stage('Docker Build')");
  const hasDockerPush = content.includes("stage('Docker Push')");
  const hasDeploy = content.includes("stage('Deploy')");
  const hasHealthCheck = content.includes("stage('Health Check')");
  const hasPort3009 = content.includes("PORT          = '3009'");
  
  if (hasGhada && hasCheckout && hasDockerBuild && hasDockerPush && hasDeploy && hasHealthCheck && hasPort3009) {
    console.log('   ✅ Jenkinsfile-CD: Toutes les étapes présentes');
    console.log('   ✅ Docker Image: ghada/smartsite-materials-service');
    console.log('   ✅ Port: 3009');
    console.log('   ✅ Étapes: Checkout → Docker Build → Docker Push → Deploy → Health Check');
    checks.push({ name: 'Jenkinsfile-CD', status: 'OK' });
  } else {
    console.log('   ❌ Jenkinsfile-CD: Configuration incorrecte');
    if (!hasGhada) console.log('   ⚠️  Docker image devrait être: ghada/smartsite-materials-service');
    checks.push({ name: 'Jenkinsfile-CD', status: 'ERREUR' });
  }
} else {
  console.log('   ❌ Jenkinsfile-CD: Fichier manquant');
  checks.push({ name: 'Jenkinsfile-CD', status: 'MANQUANT' });
}

// ========== VÉRIFICATION 5: sonar-project.properties ==========
console.log('\n📊 5. Vérification du sonar-project.properties...');
const sonarPath = path.join(SERVICE_DIR, 'sonar-project.properties');
if (fs.existsSync(sonarPath)) {
  const content = fs.readFileSync(sonarPath, 'utf8');
  
  const hasProjectKey = content.includes('sonar.projectKey=smartsite-materials-service');
  const hasProjectName = content.includes('sonar.projectName=SmartSite - Materials Service');
  const hasSources = content.includes('sonar.sources=src');
  const hasExclusions = content.includes('sonar.exclusions=');
  const hasCoverage = content.includes('sonar.javascript.lcov.reportPaths=coverage/lcov.info');
  
  if (hasProjectKey && hasProjectName && hasSources && hasExclusions && hasCoverage) {
    console.log('   ✅ sonar-project.properties: Configuration correcte');
    console.log('   ✅ Project Key: smartsite-materials-service');
    console.log('   ✅ Sources: src');
    console.log('   ✅ Coverage: coverage/lcov.info');
    checks.push({ name: 'sonar-project.properties', status: 'OK' });
  } else {
    console.log('   ❌ sonar-project.properties: Configuration incomplète');
    checks.push({ name: 'sonar-project.properties', status: 'ERREUR' });
  }
} else {
  console.log('   ❌ sonar-project.properties: Fichier manquant');
  checks.push({ name: 'sonar-project.properties', status: 'MANQUANT' });
}

// ========== VÉRIFICATION 6: package.json ==========
console.log('\n📦 6. Vérification du package.json...');
const packagePath = path.join(SERVICE_DIR, 'package.json');
if (fs.existsSync(packagePath)) {
  const content = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const hasBuildScript = content.scripts && content.scripts.build;
  const hasTestScript = content.scripts && content.scripts.test;
  const hasStartScript = content.scripts && content.scripts.start;
  
  if (hasBuildScript && hasTestScript && hasStartScript) {
    console.log('   ✅ package.json: Scripts présents');
    console.log('   ✅ Scripts: build, test, start');
    checks.push({ name: 'package.json', status: 'OK' });
  } else {
    console.log('   ❌ package.json: Scripts manquants');
    checks.push({ name: 'package.json', status: 'ERREUR' });
  }
} else {
  console.log('   ❌ package.json: Fichier manquant');
  checks.push({ name: 'package.json', status: 'MANQUANT' });
}

// ========== RÉSUMÉ ==========
console.log('\n' + '='.repeat(60));
console.log('📊 RÉSUMÉ DES VÉRIFICATIONS\n');

const okCount = checks.filter(c => c.status === 'OK').length;
const errorCount = checks.filter(c => c.status === 'ERREUR').length;
const missingCount = checks.filter(c => c.status === 'MANQUANT').length;

checks.forEach(check => {
  const icon = check.status === 'OK' ? '✅' : check.status === 'ERREUR' ? '❌' : '⚠️';
  console.log(`${icon} ${check.name.padEnd(30)} ${check.status}`);
});

console.log('\n' + '='.repeat(60));
console.log(`✅ OK: ${okCount}`);
console.log(`❌ ERREURS: ${errorCount}`);
console.log(`⚠️  MANQUANTS: ${missingCount}`);
console.log('='.repeat(60));

if (okCount === checks.length) {
  console.log('\n🎉 SUCCÈS: Tous les fichiers DevOps sont correctement configurés!');
  console.log('\n📝 PROCHAINES ÉTAPES:');
  console.log('   1. Tester le build Docker local:');
  console.log('      cd apps/backend/materials-service');
  console.log('      docker build -t ghada/smartsite-materials-service .');
  console.log('');
  console.log('   2. Tester le conteneur:');
  console.log('      docker run -d --name materials-service -p 3009:3009 \\');
  console.log('        -e MONGODB_URI="mongodb+srv://..." \\');
  console.log('        ghada/smartsite-materials-service');
  console.log('');
  console.log('   3. Vérifier le service:');
  console.log('      curl http://localhost:3009/api/materials/health');
  console.log('');
  console.log('   4. Configurer Jenkins:');
  console.log('      - Créer job "materials-service-CI"');
  console.log('      - Créer job "materials-service-CD"');
  console.log('      - Configurer credentials Docker Hub (ghada)');
  console.log('      - Configurer webhook GitHub');
  process.exit(0);
} else {
  console.log('\n❌ ÉCHEC: Certains fichiers DevOps nécessitent des corrections.');
  process.exit(1);
}
