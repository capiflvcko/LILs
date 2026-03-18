# Seeded District World With Beach Travel, Water Depth, Swimming, And Ambient Wildlife

## Summary
- Yes, this is possible with the current stack, and easier here than in the video. This project already uses real 3D world space in Three.js and real collision in Rapier, so elevation/beach work is a world-generation and gameplay-system problem, not a rendering-library blocker.
- Build the game as one **persistent seeded world** made of **districts**, with only the active district loaded at a time.
- First districts:
  - `Downtown`: gentle, road-friendly, low-relief starter area
  - `Beach`: coastal district reached by a **Sims-style travel trigger**
- Beach v1 includes:
  - transparent depth-shaded water
  - below-sea-level terrain
  - shoreline plants and underwater vegetation
  - swimming
  - ambient wildlife only, with normal animals and atmosphere rather than combat creatures

## Key Changes
- **World and district architecture**
  - Replace the single hardcoded flat town model with a seeded district runtime.
  - Each district owns:
    - terrain cells/heights
    - road and lot masks
    - water mask and sea level data
    - placed props/buildings/NPCs/traffic
    - traversal connectors
    - travel triggers
    - arrival points
  - Keep only the active district simulated and rendered in v1.
  - Use one persistent seed per save/profile so downtown and beach remain stable across sessions.

- **Terrain generation**
  - Use a hybrid terrain model:
    - macro height from noise/profile functions
    - quantized readable isometric levels for cliffs/terraces
    - flattening passes for roads, parking lots, sidewalks, and building pads
  - Downtown rules:
    - mostly smooth/gentle grades
    - road-first generation
    - shopping-center and city-block feel
  - Beach rules:
    - terrain allowed below sea level
    - shoreline transition from road/boardwalk to sand to shallow water to deeper water
    - mild dunes/bluffs away from the arrival zone
  - Roads remain drivable and readable by flattening lane corridors onto generated terrain.

- **Water and beach presentation**
  - Add a sea-level-aware water system:
    - any terrain below sea level is water-covered
    - water remains transparent
    - water darkens with depth using a depth-to-color function
  - Add shoreline/coastal dressing:
    - cattails/lily-type shoreline plants where appropriate
    - underwater vegetation/rocks in shallow water
    - cleaner beach-specific shoreline assets for the actual beach district
  - Add beach readability cues:
    - shallow-to-deep water gradient
    - shoreline foam/light band
    - underwater prop tinting based on depth
  - Keep orthographic camera; rely on shading, side faces, edge lines, and water-depth tint for depth readability.

- **Movement, traversal, and swimming**
  - Preserve manual movement and click-to-move.
  - Pathfinding stays **intra-district** only.
  - Vertical traversal inside districts supports:
    - walk
    - stairs/ramps
    - short jump links
    - elevators where authored
  - Add swimming as a separate movement state:
    - triggered when entering swimmable water depth
    - slower movement than land
    - swimming animation set for the player
    - no skateboard use in water
    - click-to-move can path into water only where the shoreline is marked swimmable
  - Default water rules:
    - ankle/shallow water stays walkable
    - swim state begins at configured medium depth threshold
    - deep water blocks vehicles and normal pedestrian pathing unless swimming is allowed

- **Beach travel system**
  - Implement explicit district travel, not world-scale walking.
  - Add a `TravelTrigger` in downtown and one in the beach district for return travel.
  - Travel flow:
    1. player interacts with trigger
    2. travel prompt appears
    3. input freezes and screen fades out
    4. current district unloads
    5. target district loads from the same world seed
    6. player spawns at target arrival point
    7. fade in and resume input
  - Default trigger style: road-exit/taxi/transport marker, not “teleport from anywhere.”

- **Ambient wildlife**
  - Do not build a combat-mob system in v1.
  - Add a lightweight ambient wildlife manager instead of a full ecosystem/spawner framework.
  - Wildlife targets for the first plan:
    - fish in water
    - fireflies in low-light green/coastal edge areas
    - squirrels in greener/tree-lined zones near districts
  - Wildlife behavior is simple:
    - idle
    - wander/patrol
    - flee/vanish when appropriate
    - no attack/combat/loot system
  - This keeps the world alive without turning the game into a survival or mob-focused design.

## Public Interfaces / Types
- Add or refactor toward these core interfaces:
  - `DistrictId`
  - `WorldSeedConfig`
  - `TerrainCell`
  - `TerrainChunk`
  - `WaterCellData`
  - `TraversalConnector`
  - `TravelTrigger`
  - `AmbientWildlifeAgent`
- Runtime entrypoints:
  - `loadDistrict(id)`
  - `unloadDistrict(id)`
  - `sampleHeight(x, z)`
  - `sampleCell(x, z)`
  - `sampleWater(x, z)`
  - `projectToGround(x, z)`
  - `findPath(from, to)` for active district only
- Player/world behavior additions:
  - terrain-aware ground projection
  - swim-state detection and movement rules
  - travel-trigger interaction contract

## Test Plan
- **Generation**
  - Same seed reproduces the same downtown and beach across reloads.
  - Downtown remains road-friendly and low-relief.
  - Beach always generates valid shoreline, shallow water, and safe arrival area.

- **Travel**
  - Downtown trigger sends player to beach arrival point.
  - Beach trigger returns player to downtown.
  - Travel unloads old props/colliders/NPCs/traffic cleanly.
  - Fade and input lock behave correctly during transition.

- **Water / swimming**
  - Water gets darker with depth.
  - Underwater props tint correctly with depth.
  - Player transitions cleanly from walking to swimming and back.
  - Click-to-move respects swimmable vs non-swimmable water.

- **Traversal / terrain**
  - Player, NPCs, traffic, and props sit on resolved terrain heights.
  - Roads stay drivable and visually clear on uneven terrain.
  - Intra-district pathfinding uses walk/stairs/jump/elevator links correctly.

- **Ambient life**
  - Fish stay in water regions only.
  - Fireflies appear only in allowed dusk/night habitats.
  - Squirrels stay on land/green areas.
  - Wildlife does not block navigation or create combat expectations.

## Assumptions And Defaults
- The project remains on Three.js + Rapier; no engine swap.
- The world is one seeded save-space composed of districts, but only one district is active at a time in v1.
- Beach is part of the same world, not a disconnected one-off scene.
- Cross-district travel is trigger-based only.
- Beach v1 includes full environmental feel, swimming, and ambient animals, but **not** a reusable population/ecosystem sim or hostile creature system.
- Ambient wildlife is lightweight and atmospheric, matching the “more GTA than creature-game” direction.
