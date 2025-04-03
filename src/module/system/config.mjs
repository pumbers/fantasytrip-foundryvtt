export const FT = {};

/* ------------------------------------------- */
/*  Game System Config & Options                  */
/* ------------------------------------------- */

FT.path = "systems/fantasy-trip";

FT.settings = {
  damageMultiplierStrategy: {
    options: {
      rollTimes: "FT.game.settings.damageMultiplierStrategy.options.rollTimes",
      multiply: "FT.game.settings.damageMultiplierStrategy.options.multiply",
    },
  },
};

FT.roll = {
  types: {
    save: "FT.system.roll.type.save",
    talent: "FT.system.roll.type.talent",
    attack: "FT.system.roll.type.attack",
    damage: "FT.system.roll.type.damage",
    cast: "FT.system.roll.type.cast",
  },
  modifiers: {
    default: { min: -6, max: 6 },
    range: { min: -9, max: 0 },
  },
  result: {
    automaticSuccess: "FT.system.roll.result.automaticSuccess",
    success: "FT.system.roll.result.success",
    failure: "FT.system.roll.result.failure",
    criticalFailure: "FT.system.roll.result.criticalFailure",
  },
};

/* ------------------------------------------- */
/*  Character Config & Options                 */
/* ------------------------------------------- */

FT.actor = {
  types: {
    hero: "FT.actor.type.hero",
    wizard: "FT.actor.type.wizard",
  },
  races: [
    "FT.actor.race.human",
    "FT.actor.race.elf",
    "FT.actor.race.dwarf",
    "FT.actor.race.halfling",
    "FT.actor.race.orc",
    "FT.actor.race.goblin",
  ],
  attributes: {
    "st.max": "FT.actor.attribute.st.max",
    "st.value": "FT.actor.attribute.st.value",
    "dx.max": "FT.actor.attribute.dx.max",
    "dx.value": "FT.actor.attribute.dx.value",
    "iq.max": "FT.actor.attribute.iq.max",
    "iq.value": "FT.actor.attribute.iq.value",
  },
  ma: {
    modes: {
      walk: "FT.actor.ma.mode.walk",
      swim: "FT.actor.ma.mode.swim",
      fly: "FT.actor.ma.mode.fly",
    },
  },
  tracks: {
    encumbrance: {
      colors: ["bg-lime", "bg-lime", "bg-lime", "bg-amber", "bg-amber", "bg-red", "bg-red"],
    },
    damage: { color: "bg-red-500" },
    fatigue: { color: "bg-amber-500" },
    mana: { color: "bg-sky-400" },
  },
};

/* ------------------------------------------- */
/*  Item Config & Options                  */
/* ------------------------------------------- */

FT.item = {
  inventory: {
    locations: ["equipped", "dropped", "carried", "stowed", "stored"],
    icons: {
      equipped: "icon-battle-gear",
      carried: "icon-knapsack",
      dropped: "icon-drop-weapon",
      stowed: "icon-chest",
      stored: "icon-white-tower",
    },
    encumbering: ["carried", "equipped"],
  },
  attack: {
    types: {
      natural: "FT.item.attack.type.natural",
      hth: "FT.item.attack.type.hth",
      melee: "FT.item.attack.type.melee",
      polearm: "FT.item.attack.type.polearm",
      thrown: "FT.item.attack.type.thrown",
      missile: "FT.item.attack.type.missile",
    },
    icon: {
      natural: "icon-fist",
      melee: "icon-swordman",
      polearm: "icon-mace",
      thrown: "icon-thrown-knife",
      missile: "icon-bowman",
    },
  },
  spell: {
    types: {
      missile: "FT.item.spell.type.missile",
      thrown: "FT.item.spell.type.thrown",
      creation: "FT.item.spell.type.creation",
      special: "FT.item.spell.type.special",
    },
    icon: {
      missile: "icon-bowman",
      thrown: "icon-thrown-knife",
      creation: "icon-magic-swirl",
      special: "icon-pentagram-rose",
    },
    castAttribute: {
      missile: "dx.value",
      thrown: "dx.value",
      creation: "dx.value",
      special: "dx.value",
    },
  },
};
