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
  'twenty-forty-eight','bubble-pop','memory-match'
];
for (const k of keys) assert(src.includes("'" + k + "'") || src.includes(k + ':'), 'missing ' + k);
console.log('registry smoke ok:', keys.length);
