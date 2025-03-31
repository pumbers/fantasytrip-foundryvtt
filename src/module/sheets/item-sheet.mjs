import * as Effects from "../util/effects.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class FTItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `${CONFIG.FT.path}/templates/sheet/item/item-sheet.hbs`,
      classes: ["fantasy-trip", "item", "sheet"],
      width: 380,
      height: 520,
      resizable: true,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
    });
  }

  /** @override */
  getData() {
    const context = {
      ...super.getData(),
      FT: CONFIG.FT,
      system: foundry.utils.deepClone(this.item.system),
      flags: foundry.utils.deepClone(this.item.flags),
      owned: !!this.item.parent,
      selectOptions: {
        attributes: CONFIG.FT.character.attributes,
        spellTypes: CONFIG.FT.item.spell.types,
        attackTypes: CONFIG.FT.item.attack.types,
        // Applicable skill options from the parent actor
        ...(!!this.item.parent && {
          talents: Array.from(this.item.parent?.items.values())
            .filter((item) => item.type === "talent")
            .reduce((talents, talent) => ({ ...talents, [talent._id]: talent.name }), {}),
        }),
        worldSpells: Array.from(game.items.values())
          .filter((item) => item.type === "spell")
          .reduce((spells, spell) => ({ ...spells, [spell._id]: spell.name }), {}),
      },
    };
    return context;
  }

  /* ------------------------------------------- */
  /*  Sheet Listeners & Handlers                 */
  /* ------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Sheet Actions
    html.find("[data-action]").click(this.click.bind(this));
  }

  click(event) {
    event.preventDefault();
    const element = $(event?.currentTarget);
    const dataset = element?.data();

    switch (dataset.action) {
      case "add-attack":
        // console.log("click():add-attack");
        this.item.system.attacks.push({
          name: "Attack",
          type: "melee",
          toHitMod: 0,
          baseDamage: "1d6",
          minST: 7,
          talent: null,
        });
        this.item.update({ "system.attacks": this.item.system.attacks });
        break;
      case "delete-attack":
        // console.log("click():delete-attack", dataset.index);
        this.item.system.attacks.splice(dataset.index, 1);
        this.item.update({ "system.attacks": this.item.system.attacks });
        break;
      case "add-defense":
        // console.log("click():add-defense");
        this.item.system.defenses.push({
          name: "Defend",
          hitsStopped: 0,
        });
        this.item.update({ "system.defenses": this.item.system.defenses });
        break;
      case "delete-defense":
        // console.log("click():delete-attack", dataset.index);
        this.item.system.defenses.splice(dataset.index, 1);
        this.item.update({ "system.defenses": this.item.system.defenses });
        break;
      case "add-spell":
        // console.log("click():add-spell", dataset);
        this.item.system.spells.push({ id: null, item: null });
        this.item.update({ "system.spells": this.item.system.spells });
        break;
      case "delete-spell":
        // console.log("click():delete-spell", dataset.index);
        this.item.system.spells.splice(dataset.index, 1);
        this.item.update({ "system.spells": this.item.system.spells });
        break;
      case "create-effect":
      case "edit-effect":
      case "toggle-effect":
      case "delete-effect":
        Effects.onManageActiveEffect.call(this.item, event);
        break;
      default:
        console.error(`FT | Unimplemented action: ${dataset.action}`);
        break;
    }
  }
}

Hooks.on("preUpdateItem", (item, changes, options, userId) => {
  // console.log("Hooks.preUpdateItem", item.type, item, "changes", changes, "options", options, "userId", userId);

  Object.values(changes.system.spells ?? [])
    .filter((s) => s.id !== s.data?._id)
    .forEach((spell) => {
      spell.data = game.items.get(spell.id);
    });
});
