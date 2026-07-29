# Games Engine

## Universal engine

`games/engine/core.ts` provides:

- Canvas lifecycle, input (keyboard/pointer), DPR scaling
- Score / game-over hooks
- Helpers: `clearNeon`, `bumpScore`, `rand`, `clamp`

## Registry

Register titles in `games/registry.ts`:

```ts
export const GAME_REGISTRY = {
  'my-game': { title: 'My Game', create: myGameFactory },
};
```

Play route: `/play/<slug>` lazy-loads the factory.

## Drop-in folders

```
games/<slug>/
  manifest.json   # metadata
  index.ts        # export create factory
```

Wire the export into `GAME_REGISTRY` (auto-discovery can scan manifests at build time for 10k+ scale).

## Engines

Current free games use Canvas for maximum lightness. Manifest `engine` field supports `pixi` | `phaser` | `three` for premium titles.

## Endless Story Mode

Adventure games (e.g. Maze Escape) regenerate worlds forever. Backend AI endpoints supply dungeon master narration, NPC memory, quests, weather, bosses, and loot with `ends: false`.
