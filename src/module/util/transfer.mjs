import { FT } from "../system/config.mjs";

/**
 * Impoirt data from pasted text or a file an update the Actor document
 * @param {Actor} actor
 */
export function importActor(actor) {
  console.log("importActor()", actor);
  new foundry.applications.api.DialogV2({
    id: "ft-import-actor",
    window: {
      title: game.i18n.localize("FT.dialog.import.title"),
      closeOnSubmit: true,
    },
    content: `<label for="pasted">${game.i18n.localize(
      "FT.dialog.import.label.instructions"
    )}</label><textarea id="pasted" name="pasted"></textarea><input type="file" name="upload"/>`,
    buttons: [
      {
        action: "cancel",
        label: game.i18n.localize("FT.dialog.import.action.cancel"),
        icon: "fa fa-times",
      },
      {
        action: "import",
        label: game.i18n.localize("FT.dialog.import.action.import"),
        icon: "fa fa-upload",
        default: true,
        callback: (event, button, dialog) => {
          console.log("import", button.form);
          return {
            action: "import",
            pasted: button.form.elements.pasted.value,
            file: button.form.elements.upload?.files[0],
          };
        },
      },
    ],
    submit: ({ action, pasted, file }) => {
      console.log("submit()", action, pasted, file);
      if (action !== "import") return;

      if (pasted.length) {
        const actorData = importStandardText(pasted);
        actor.items.clear();
        actor.update(actorData, { diff: false, recursive: false });
      } else if (file) {
        // Read the file contents
        const reader = new FileReader();
        reader.onload = function () {
          const content = new TextDecoder("utf-8").decode(this.result);
          const actorData = importStandardText(content);
          actor.update(actorData, { diff: false, recursive: false });
        };
        reader.readAsArrayBuffer(file);
      }
    },
  }).render({ force: true });
}

/**
 * Parse standard text format to structured JSON for Actor update
 * @param {String} text
 * @returns {Object} Parsed data
 */
export function importStandardText(text) {
  console.log(FT.prefix, "Importing character from standard text", text);

  // Parse initial text
  const header = /^(?<name>[\w\s’'`]*)[\s,]*(?<type>(wizard|hero))?[\s,]*(age\s(?<age>\d+))?$/m.exec(
    text.trim()
  )?.groups;
  const name = header.name ?? "Imported Character";
  const type = header.type ?? "hero";
  const age = header.age ?? 18;
  console.log("... character", name, "type", type, "age", age);

  // Parse attributes
  const { st, dx, iq, ma } =
    /^ST\s+(?<st>\d+)\s*,\s*DX\s*(?<dx>\d+)\s*,\s*IQ\s*(?<iq>\d+)\s*,\s*MA\s*(?<ma>\d+)/gm.exec(text)?.groups;
  console.log("... attributes", "ST", st, "DX", dx, "IQ", iq, "MA", ma);

  // Parse item lists
  let talents = [],
    spells = [],
    languages = [],
    weapons = [],
    armor = [],
    equipment = [],
    abilities = [],
    magic = [],
    notes = [];

  const lists = text.match(/^[\w\s\/]*:/gm);
  console.log("... found lists", lists);

  lists.forEach((name, index) => {
    // Standardize the list name to an id format
    const id = name.replace(":", "").replace(/\s+/g, " ").trim().toLowerCase();
    console.log("... processing list", id);

    // Parse the list items
    let regex = new RegExp(`^${name}\\s*(?<list>.*)${lists[index + 1] ?? "$"}`, "gms");
    console.log("... ... parsing list using regex", regex);
    let list = regex.exec(text)?.groups?.list;
    console.log("... ... list", list);
    if (!list) return;

    // Process each type of list
    switch (id) {
      // Talents
      case "talents":
        talents = list
          .split(",")
          .map((item) => item.trim())
          .map((name) => {
            const found = game.items.find((entry) => entry.type === "talent" && entry.name === name);
            return found ? found.toObject() : { name: name, type: "talent" };
          });
        console.log("... ... adding talents", talents);
        break;
      // Spells
      case "spells":
      case "spells include":
        spells = list
          .split(",")
          .map((item) => item.trim())
          .map((name) => {
            const found = game.items.find((entry) => entry.type === "spell" && entry.name === name);
            return found ? found.toObject() : { name: name, type: "spell" };
          });
        console.log("... ... adding spells", spells);
        break;
      // Languages
      case "languages":
        languages = list
          .split(",")
          .map((item) => item.trim())
          .map((name) => {
            const found = game.items.find((entry) => entry.type === "talent" && entry.name === `Language (${name})`);
            return found ? found.toObject() : { name: `Language (${name})`, type: "talent" };
          });
        console.log("... ... adding languages", languages);
        break;
      // Weapons
      case "weapon":
      case "weapons":
        weapons = list
          .split(",")
          .map((item) => item.trim())
          .map((item) => {
            const { name, damage } = /^(?<name>[\w\s’'`]*)(\((?<damage>.*)?\))?$/ms.exec(item)?.groups;
            const found = game.items.find((entry) => entry.type === "talent" && entry.name === name);
            return found
              ? found.toObject()
              : {
                  name: name.trim(),
                  type: "equipment",
                  system: { attacks: [{ action: "Attack", baseDamage: (damage ?? "").replace(/(d|D)/gms, "D6") }] },
                };
          });
        console.log("... ... adding weapons", weapons);
        break;
      // Armor
      case "armor":
      case "armour":
        armor = list
          .split(",")
          .map((item) => item.trim())
          .map((item) => {
            const { name, stops } = /^(?<name>[\w\s’'`]*)(stops|stop)+\s*(?<stops>\d*)/ms.exec(item)?.groups;
            const found = game.items.find((entry) => entry.type === "equipment" && entry.name === name);
            return found
              ? found.toObject()
              : {
                  name: name.trim(),
                  type: "equipment",
                  system: { defenses: [{ action: "Body", hitsStopped: parseInt(stops) }] },
                };
          });
        console.log("... ... adding armor", armor);
        break;
      // Equipment
      case "equipment":
        equipment = list
          .split(",")
          .map((item) => item.trim())
          .map((item) => {
            const { name, qty } = /^(?<name>[\w\s’'`]*)\s*(\((?<qty>\d*)\))?/ms.exec(item)?.groups;
            const found = game.items.find((entry) => entry.type === "equipment" && entry.name === name);
            return found
              ? found.toObject()
              : {
                  name: name.trim(),
                  type: "equipment",
                  system: { qty: parseInt(qty ?? 1) },
                };
          });
        console.log("... ... adding equipment", equipment);
        break;
      // Abilities
      case "special ability/weakness":
      case "special ability":
      case "special abilities":
      case "ability":
      case "abilities":
      case "attack":
      case "attacks":
        const items = list
          .split(",")
          .map((item) => item.trim())
          .map((item) => {
            const { name, notes } = /^(?<name>[\w\s’'`]*)(?<notes>.*)$/ms.exec(item)?.groups;
            const found = game.items.find((entry) => entry.type === "ability" && entry.name === name);
            return found
              ? found.toObject()
              : {
                  name: name.trim(),
                  type: "ability",
                  system: { notes },
                };
          });
        abilities.push(...items);
        console.log("... ... adding abilities", abilities);
        break;
      // Magic Items
      case "magic items":
        magic = list
          .split("•")
          .map((item) => item.trim())
          .filter((item) => item)
          .map((name) => ({ name, type: "equipment" }));
        console.log("... ... adding magic", magic);
        break;
      // Notes
      case "note":
      case "notes":
      case "special note":
      case "special notes":
        notes = [list.trim()];
        console.log("... ... adding notes", notes);
        break;
      default:
        console.error("Unrecognized list type in actor data:", name, id);
        break;
    }
  });

  return {
    name: name.trim(),
    system: {
      type,
      age: parseInt(age),
      st: { max: parseInt(st) },
      dx: { max: parseInt(dx) },
      iq: { max: parseInt(iq) },
      ma: { walk: parseInt(ma), fly: parseInt(ma), swim: parseInt(ma) },
      notes: notes.map((note) => `<p>${note}</p>`),
    },
    items: [...talents, ...spells, ...languages, ...weapons, ...armor, ...equipment, ...abilities, ...magic],
  };
}

/**
 * Creates a plain text block of character stats in the Fantasy Trip standard format
 * @param {*} actor
 * @returns {String} Text formatted character stats
 */
export function exportStandardText(actor) {
  console.log(FT.prefix, "Exporting", actor.name, "to standard text format");

  // Categorize and saummarize items
  const talents = Array.from(actor.items)
    .filter((item) => item.type === "talent")
    .filter((item) => !item.name.match(/^(Language|language)\s*\([\s\w’'`]*\)$/m))
    .map((item) => item.name);
  const languages = Array.from(actor.items)
    .filter((item) => item.type === "talent")
    .filter((item) => item.name.match(/^(Language|language)\s*\([\s\w’'`]*\)$/m))
    .map((item) => /^(Language|language)\s*\((?<name>[\s\w`']*)\)$/m.exec(item.name)?.groups?.name);
  const spells = Array.from(actor.items)
    .filter((item) => item.type === "spell")
    .map((item) => item.name);
  const weapons = Array.from(actor.items)
    .filter((item) => item.type === "equipment" && item.system.hasAttacks)
    .map((item) => `${item.name} (${item.system.attacks.map((attack) => attack.damage).join("/")})`);
  const armor = Array.from(actor.items)
    .filter((item) => item.type === "equipment" && item.system.hasDefenses)
    .map((item) => `${item.system.defenses.map((defense) => item.name + " stops " + defense.hitsStopped)}`);
  const equipment = Array.from(actor.items)
    .filter(
      (item) =>
        item.type === "equipment" && !item.system.hasAttacks && !item.system.hasDefenses && !item.system.hasSpells
    )
    .map((item) => `${item.name}${item.system.qty > 1 ? " (" + item.system.qty + ")" : ""}`);
  const magic = Array.from(actor.items)
    .filter((item) => item.type === "equipment" && item.system.hasSpells)
    .map((item) => `• ${item.name}`);

  // Create output lines
  const lines = [
    `${actor.name}, ${actor.system.type}${actor.system.age ? ", age " + actor.system.age : ""}`,
    `ST ${actor.system.st.max}, DX ${actor.system.dx.max}, IQ ${actor.system.iq.max}, MA ${actor.system.ma.walk.max}`,
  ];

  if (talents.length) lines.push(`Talents: ${talents.length > 0 ? talents.join(", ") : ""}`);
  if (languages.length) lines.push(`Languages: ${languages.length > 0 ? languages.join(", ") : ""}`);
  if (spells.length) lines.push(`Spells: ${spells.length > 0 ? spells.join(", ") : ""}`);
  if (weapons.length) lines.push(`Weapons: ${weapons.length > 0 ? weapons.join(", ") : ""}`);
  if (armor.length) lines.push(`Armor: ${armor.length > 0 ? armor.join(", ") : ""}`);
  if (equipment.length) lines.push(`Equipment: ${equipment.length > 0 ? equipment.join(", ") : ""}`);
  if (magic.length) lines.push(`Magic Items:\n${magic.length > 0 ? magic.join("\n") : ""}`);

  return lines.join("\n");
}
