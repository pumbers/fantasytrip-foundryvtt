import { importStandardText, exportStandardText } from "../transfer.mjs";

const fullActor = `Doctor Mandrake, wizard, age 99
ST 12, DX 13, IQ 18, MA 10
Talents: Alchemy, Knife, Literacy, Horsemanship, Sword
Spells include: Cleansing, Cleanse Poison, Create/Destroy
Elemental, Darkness, Dazzle, Dispel Missiles, 4-Hex Image,
Glamor, Iron Flesh, Lesser Magic Item Enchantment,
Lightning, Minor Medicament, Regeneration, Remove
Thrown Spell, Spell Shield, Staff III, Wizard’s Wrath
Languages: Common, Goblin, Sorcerers’ Tongue
Weapon: Silver shortsword (2d-1)
Attacks: Halitosis (1d-3) (see below)
Special Ability/Weakness: Allergic to cats (-1 to DX and IQ in presence of any feline)
Armor: Enchanted silken robes stop 3 hits/attack
Equipment: Torches (2), wizard’s chest
Magic Items:
• Gem of Summoning (4-Hex Dragon)
• Powerstone, 5 ST (emerald; see below)
• Staff III (Mana 12): 2’ ebony wand, value $300 (1d)
Special note: Dr. Mandrake becomes violently angry if he is reminded, intentionally or not, of his age.`;

const minimalActor = `Little Crabmen
ST 7, DX 10, IQ 3, MA 8 (walking or swimming)
Armor: Shell stops 1 hit/attack
Attacks: Two pincer attacks (1d-1 each)`;

// test("Import Minimal Actor", () => {
//   const { actor, items } = importStandardText(minimalActor);
//   console.log("actor", actor, "items", items);
// });

beforeAll(() => {
  const items = [
    { _id: "test", name: "Literacy", type: "talent" },
    { _id: "test", name: "Glamor", type: "spell" },
  ];
  game.items.find = (fn) => {
    const found = items.find(fn);
    return found ? { toObject: () => found } : undefined;
  };
});

test("Import Full Actor", () => {
  const { name, system, items } = importStandardText(fullActor);

  // Base
  expect(name).toBe("Doctor Mandrake");
  expect(system.type).toBe("wizard");
  expect(system.age).toBe(99);

  // Attributes
  expect(system.st.max).toBe(12);
  expect(system.dx.max).toBe(13);
  expect(system.iq.max).toBe(18);
  expect(system.ma.walk).toBe(10);
  expect(system.ma.fly).toBe(10);
  expect(system.ma.swim).toBe(10);

  expect(items.length).toBe(34);

  // Talents
  expect(items).toContainEqual({ name: "Alchemy", type: "talent" });
  expect(items).toContainEqual({ _id: "test", name: "Literacy", type: "talent" });
  expect(items).toContainEqual({ name: "Sword", type: "talent" });

  // Spells
  expect(items).toContainEqual({ name: "Darkness", type: "spell" });
  expect(items).toContainEqual({ _id: "test", name: "Glamor", type: "spell" });
  expect(items).toContainEqual({ name: "Regeneration", type: "spell" });

  // Equipment
  expect(items).toContainEqual({
    name: "Silver shortsword",
    system: { attacks: [{ action: "Attack", baseDamage: "2D6-1" }] },
    type: "equipment",
  });
  expect(items).toContainEqual({
    name: "Enchanted silken robes",
    system: { defenses: [{ action: "Body", hitsStopped: 3 }] },
    type: "equipment",
  });
  expect(items).toContainEqual({ name: "Torches", type: "equipment", system: { qty: 2 } });
  expect(items).toContainEqual({ name: "wizard’s chest", type: "equipment", system: { qty: 1 } });
  expect(items).toContainEqual({
    name: "Allergic to cats",
    type: "ability",
    system: { notes: "(-1 to DX and IQ in presence of any feline)" },
  });
  expect(items).toContainEqual({
    name: "Allergic to cats",
    type: "ability",
    system: { notes: "(-1 to DX and IQ in presence of any feline)" },
  });
  expect(items).toContainEqual(
    { name: "Gem of Summoning (4-Hex Dragon)", type: "equipment" },
    { name: "Powerstone, 5 ST (emerald; see below)", type: "equipment" },
    { name: "Staff III (Mana 12): 2’ ebony wand, value $300 (1d)", type: "equipment" }
  );
  expect(system.notes).toContainEqual(
    "<p>Dr. Mandrake becomes violently angry if he is reminded, intentionally or not, of his age.</p>"
  );
});

test("Import Full Actor", () => {
  const { name, system, items } = importStandardText(minimalActor);

  // Base
  expect(name).toBe("Little Crabmen");
  expect(system.type).toBe("hero");
  expect(system.age).toBe(18);
});
