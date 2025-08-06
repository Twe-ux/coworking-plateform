#!/usr/bin/env node

/**
 * Script pour lancer Next.js dev en filtrant les warnings npm obsolètes
 */

const { spawn } = require('child_process')

// Warnings npm à filtrer
const filteredWarnings = [
  'npm warn Unknown env config "verify-deps-before-run"',
  'npm warn Unknown env config "_jsr-registry"'
]

// Lancer Next.js dev
const nextDev = spawn('npx', ['next', 'dev'], { 
  stdio: ['inherit', 'pipe', 'pipe'] 
})

// Filtrer et afficher stdout
nextDev.stdout.on('data', (data) => {
  const lines = data.toString().split('\n')
  lines.forEach(line => {
    if (line.trim() && !filteredWarnings.some(warning => line.includes(warning.split('"')[1]))) {
      console.log(line)
    }
  })
})

// Filtrer et afficher stderr 
nextDev.stderr.on('data', (data) => {
  const lines = data.toString().split('\n')
  lines.forEach(line => {
    if (line.trim() && !filteredWarnings.some(warning => line.includes(warning.split('"')[1]))) {
      console.error(line)
    }
  })
})

nextDev.on('close', (code) => {
  process.exit(code)
})

// Gestion propre des signaux
process.on('SIGINT', () => {
  nextDev.kill('SIGINT')
})

process.on('SIGTERM', () => {
  nextDev.kill('SIGTERM')
})