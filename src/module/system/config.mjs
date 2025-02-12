export const FT = {};

/* ------------------------------------------- */
/*  Character Config & Options                  */
/* ------------------------------------------- */

FT.path = "systems/fantasytrip";

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
  tracks: {
    encumbrance: {
      colors: ["bg-lime", "bg-lime", "bg-lime", "bg-amber", "bg-amber", "bg-red", "bg-red", ""],
    },
    fatigue: {
      colors: [],
    },
    damage: {
      colors: [],
    },
  },
};

/* ------------------------------------------- */
/*  Item Config & Options                  */
/* ------------------------------------------- */

FT.item = {};

/* ------------------------------------------- */
/*  Combat Config & Options                  */
/* ------------------------------------------- */

FT.combat = {};
