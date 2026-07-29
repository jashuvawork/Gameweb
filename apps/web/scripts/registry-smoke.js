#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const registryPath = path.join(__dirname, '../../../games/registry.ts');
const src = fs.readFileSync(registryPath, 'utf8');
const keys = [
  'space-defender','pixel-runner','galaxy-assault','snake-evolution','brick-destroyer',
  'maze-escape','tank-arena','alien-blaster','sky-shooter','fruit-slice','tower-defender',
  'endless-racer','zombie-survival','word-puzzle','sudoku','chess','checkers',
  'twenty-forty-eight','bubble-pop','memory-match',
  'rise-of-the-forgotten-king','neon-velocity','shadow-assassin','galaxy-hunters','dragon-legacy',
  'survival-island','cyber-detective','wild-frontier','kingdom-builders','ocean-explorer',
  'zombie-frontier','monster-arena','ninja-legends','speed-legends','pirate-seas','robot-wars',
  'ancient-temple','battle-command','sky-kingdom','infinity-arena',
];
for (const k of keys) assert(src.includes("'" + k + "'") || src.includes(k + ':'), 'missing ' + k);
assert(src.includes('buildExpandedCatalog'), 'missing expandable catalog registration');
assert(fs.existsSync(path.join(__dirname, '../../../games/originals/rise-of-the-forgotten-king.ts')), 'missing story mode');
assert(fs.existsSync(path.join(__dirname, '../../../games/catalog/jgames-200.ts')), 'missing catalog');
console.log('registry smoke ok:', keys.length, 'signatures+classics');
