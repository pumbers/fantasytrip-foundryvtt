export const FT = {};

/* ------------------------------------------- */
/*  Game System Config & Options                  */
/* ------------------------------------------- */

FT.path = "systems/fantasytrip";

FT.settings = {
  damageMultiplierStrategy: {
    options: {
      rollTimes: "FT.game.settings.damageMultiplierStrategy.options.rollTimes",
      multiply: "FT.game.settings.damagedamageMultiplierStrategy.options.multiply",
    },
  },
};

FT.roll = {
  types: {
    success: "FT.system.roll.type.success",
    save: "FT.system.roll.type.save",
    talent: "FT.system.roll.type.talent",
    attack: "FT.system.roll.type.attack",
    damage: "FT.system.roll.type.damage",
    cast: "FT.system.roll.type.cast",
  },
};

/* ------------------------------------------- */
/*  Character Config & Options                  */
/* ------------------------------------------- */

FT.character = {
  types: {
    hero: "FT.character.type.hero",
    wizard: "FT.character.type.wizard",
  },
  races: [
    "FT.character.race.human",
    "FT.character.race.elf",
    "FT.character.race.dwarf",
    "FT.character.race.halfling",
    "FT.character.race.orc",
    "FT.character.race.goblin",
  ],
  attributes: {
    st: "FT.character.attribute.st",
    dx: "FT.character.attribute.dx",
    iq: "FT.character.attribute.iq",
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
    types: ["equipment", "weapon", "armor", "shield"],
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
  weapon: {
    types: {
      natural: "FT.item.weapon.type.natural",
      melee: "FT.item.weapon.type.melee",
      polearm: "FT.item.weapon.type.polearm",
      thrown: "FT.item.weapon.type.thrown",
      missile: "FT.item.weapon.type.missile",
    },
  },
  armor: { types: { natural: "FT.item.armor.type.natural", made: "FT.item.armor.type.made" } },
  spell: {
    types: {
      missile: "FT.item.spell.type.missile",
      thrown: "FT.item.spell.type.thrown",
      creation: "FT.item.spell.type.creation",
      special: "FT.item.spell.type.special",
    },
  },
};
