import * as Effects from "../util/effects.mjs";

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class FTItemSheet extends ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      template: `${CONFIG.FT.path}/templates/sheets/item-sheet.hbs`,
      classes: ["fantasy-trip", "item", "sheet"],
      width: 380,
      height: 520,
      resizable: true,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }],
    });
  }

  /** @override */
  getData() {
    // console.log("item-sheet.getData()", this.item.type, this);
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
          talents: this.item.parent?.items
            ?.values()
            .filter((item) => item.type === "talent")
            .reduce((talents, talent) => ({ ...talents, [talent._id]: talent.name }), {}),
        }),
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

    console.log("click()", element, dataset);

    switch (dataset.action) {
      case "add-attack":
        console.log("click():add-attack");
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
        console.log("click():delete-attack", dataset.index);
        this.item.system.attacks.splice(dataset.index, 1);
        this.item.update({ "system.attacks": this.item.system.attacks });
        break;
      case "add-defense":
        console.log("click():add-defense");
        this.item.system.defenses.push({
          name: "Defend",
          hitsStopped: 0,
        });
        this.item.update({ "system.defenses": this.item.system.defenses });
        break;
      case "delete-attack":
        console.log("click():delete-attack", dataset.index);
        this.item.system.defenses.splice(dataset.index, 1);
        this.item.update({ "system.defenses": this.item.system.defenses });
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
    console.log("...", this.item.system);
  }
}
