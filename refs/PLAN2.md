# Local-First Hood World With Arid SoCal Beach District

## Summary
- Build the game as a **local-first open world** with one persistent seeded save, split into districts and authored turf zones.
- Keep the hood/gun/HP direction for the city side, but make the **Beach** a mostly **natural arid SoCal coast**, not a dense urban beach strip.
- First core spaces:
  - `Downtown` starter district with 3 starter hoods
  - `Beach` district reached by travel trigger
  - `Studio Interior`
  - `Home Interior`
- Beach v1 should visually follow the new reference:
  - pale sand
  - stepped shoreline cliffs
  - transparent shallow teal water
  - visible underwater shelves
  - cacti + palms together
  - sparse rocks, drift props, and light coastal vegetation
- Keep combat/turf focused on the urban side for now. The beach is primarily an explorable natural coast.

## Key Changes
- **World structure**
  - Use one persistent seeded world with multiple districts, but load only one district at runtime in v1.
  - Districts:
    - `Downtown`: hood/turf/combat starter space
    - `Beach`: natural coastal biome
  - Travel between districts uses explicit travel triggers with fade transitions.

- **Hoods, turf, and combat**
  - Add 3 starter hoods.
  - Hood choice sets:
    - home/save spawn
    - allied faction
    - safe starting turf
    - starter weapon
  - Turf in v1 is authored and static:
    - friendly turf is safe
    - enemy turf is hostile
    - rare incursion events into home turf
  - Combat v1:
    - HP only
    - rival NPCs only
    - local-first, no multiplayer sync
    - starter gun with visible arm-raise animation
    - visible muzzle/tracer/shot effect
    - gun cooldown bar instead of ammo economy
  - Death:
    - respawn at save spot/home
    - lose a small random subset of unequipped items

- **Beach district visual target**
  - Make the beach read as **dry California/desert shoreline**, not tropical jungle and not a busy boardwalk.
  - Terrain rules:
    - broad pale sand flats
    - low stepped sand/cliff edges at the shoreline
    - mild coastal elevation, not dramatic mountains
    - sparse, open composition with long sightlines
  - Prop rules:
    - cacti and palms can coexist
    - sparse rocks, shells, drift props, and scrub
    - minimal dense greenery
    - no heavy urban beachfront in v1
  - Coastline rules:
    - shallow bright water near shore
    - visible stepped underwater terrain
    - deeper water darkens gradually
    - beach shelf and underwater geometry must remain readable from the orthographic camera

- **Water**
  - Water should be transparent and depth-shaded.
  - Generate terrain below sea level and expose underwater shelves near shore.
  - Apply a stylized depth-darkening function to:
    - water color
    - underwater terrain tint
    - underwater props/vegetation
  - Add beach-appropriate shoreline dressing:
    - light wet-edge vegetation only where it fits the arid look
    - underwater seagrass/rocks in shallow water
  - **Swimming stays deferred** in this version.

- **Ambient life**
  - Use a **light chunk-based ambient spawner**.
  - Prioritize non-combat world life:
    - fish in water
    - fireflies in dusk/night green zones
    - squirrels in greener land/tree areas
  - The beach itself should stay mostly atmospheric and natural, not crowded with wildlife systems in v1.

- **Interiors**
  - Use separate world spaces, not facade cutaways.
  - Ship first for:
    - `Studio`
    - `Home`
  - Use world-space IDs so interior and overworld save data remain isolated but compatible.

## Public Interfaces / Types
- Add or refactor toward:
  - `DistrictId`
  - `WorldSpaceId`
  - `InteriorSpaceId`
  - `HoodId`
  - `TurfZone`
  - `FactionDisposition`
  - `PlayerCombatState`
  - `WeaponDefinition`
  - `CooldownState`
  - `WaterCellData`
  - `AmbientSpawnZone`
  - `TravelTrigger`
- Runtime APIs:
  - `loadDistrict(id)`
  - `enterWorldSpace(id)`
  - `getTurfAt(position)`
  - `getFactionDisposition(a, b)`
  - `sampleHeight(x, z)`
  - `sampleWater(x, z)`
  - `fireAt(target)`
  - `applyDamage(target, amount)`
  - `respawnPlayer()`

## Test Plan
- **Hoods/combat**
  - Hood selection sets correct spawn, allies, safe turf, and starter weapon.
  - Rival NPCs are hostile only in correct contexts.
  - Click/hold target shooting works without breaking click-to-move or camera drag.
  - HP, cooldown bar, respawn, and small item-loss behavior work consistently.

- **Beach visuals**
  - Beach reads as arid SoCal coast, not tropical coast.
  - Shoreline has stepped sand edges and visible underwater shelves.
  - Water remains transparent near shore and darkens with depth.
  - Prop density stays sparse and readable.

- **Travel**
  - Downtown <-> Beach travel triggers work cleanly.
  - District unload/load leaves no stale colliders, hover targets, or NPC state behind.

- **Interiors**
  - Studio and Home load as separate interior spaces with correct spawn points and save isolation.

## Assumptions And Defaults
- Implementation is local/single-player first.
- Multiplayer, dynamic gang creation, and turf expansion come later.
- The Beach is **not** a major hood/combat zone in v1; it is a natural coastal district.
- No swimming yet.
- No ammo-buying economy yet.
- The beach palette and composition should prioritize:
  - pale sand
  - teal water
  - tan shoreline steps
  - cacti + palms
  - sparse coastal props
