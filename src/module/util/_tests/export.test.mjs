import fs from "fs";
import { exportStandardText } from "../transfer.mjs";

test("Export Full Actor", async () => {
  // Set up test object
  const actorData = fs.readFileSync("src/module/util/_tests/fvtt-test-actor-export.json", "utf8");
  const actor = JSON.parse(actorData);
  const items = actor.items.reduce((items, item) => {
    item.system.hasAttacks = item.system.attacks?.length > 0;
    item.system.attacks.forEach((attack) => {
      attack.damage = attack.baseDamage;
    });
    item.system.hasDefenses = item.system.defenses?.length > 0;
    item.system.hasSpells = item.system.spells?.length > 0;
    return items.set(item._id, item);
  }, new Map());

  // Run object through export
  const text = exportStandardText(actor);

  expect(text).toEqual(`Uldor, wizard, age 18
ST 9, DX 8, IQ 16, MA 10
Talents: Literacy, Area Knowledge, Quarterstaff, Carousing
Languages: Common, Goblin, Human, Sorcerors' Tongue
Spells: Summon Gargoyle, Drain Strength, Fireball
Weapons: Wizards Staff (1d6+3), Shortsword (2d6-1), Longbow (1d6)
Armor: Light Leather stops 1, Backpack stops 1
Equipment: Silver Coins (16), Copper Coins (8), Belt Pouch, Torch
Magic Items:
• Book of Shadows`);
});
