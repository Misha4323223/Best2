#!/usr/bin/env node

/**
 * Скрипт запуска для разработки
 * Запускает все необходимые сервисы
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Запуск BOOOMERANGS AI Platform...');

// Запуск основного сервера
const serverProcess = spawn('node', ['server/index.ts'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: 'development' }
});

serverProcess.on('error', (error) => {
  console.error('❌ Ошибка запуска сервера:', error);
});

serverProcess.on('exit', (code) => {
  console.log(`🔄 Сервер завершился с кодом ${code}`);
});

// Обработка завершения
process.on('SIGINT', () => {
  console.log('\n🛑 Завершение работы...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Принудительное завершение...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});