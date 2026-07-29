#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const registryPath = path.join(__dirname, '../../../games/registry.ts');
const src = fs.readFileSync(registryPath, 'utf8');
const freeKeys = [
  'pixel-runner','galaxy-defender','brick-blast','snake-evolution',
  'neon-drift','desert-rally','mountain-racer','street-sprint',
  'ancient-temple','number-master','logic-blocks','memory-match',
  'zombie-escape','shadow-ninja','alien-attack','robot-arena',
  'jungle-explorer','treasure-hunter','lost-kingdom','crystal-quest',
];
for (const k of freeKeys) assert(src.includes("'" + k + "'") || src.includes(k + ':'), 'missing free ' + k);
assert(src.includes('FREE_GAME_FACTORIES'), 'missing free factories');
assert(src.includes('temple-of-legends'), 'premium temple rename missing');
assert(fs.existsSync(path.join(__dirname, '../../../games/free/polished-free-games.ts')), 'missing polished free games');
assert(fs.existsSync(path.join(__dirname, '../../../games/catalog/free-tier.ts')), 'missing free-tier catalog');
console.log('registry smoke ok:', freeKeys.length, 'polished free games');
