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
      width: 400,
      height: 520,
      resizable: true,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "settings" }],
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
      // Applicable skill options from the parent actor
      ...(!!this.item.parent &&
        ["weapon"].includes(this.item.type) && {
          selectOptions: !!this.item.parent
            ? {
                talents: this.item.parent?.items
                  ?.values()
                  .filter((item) => item.type === "talent")
                  .reduce((talents, talent) => ({ ...talents, [talent._id]: talent.name }), {}),
              }
            : { talents: {} },
        }),
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
    html.find(".effect-manage").click(Effects.onManageActiveEffect.bind(this.item));
  }
}
