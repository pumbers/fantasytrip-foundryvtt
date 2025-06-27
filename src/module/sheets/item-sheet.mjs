import { FT } from "../system/config.mjs";
import * as Effects from "../util/effects.mjs";
import * as Editor from "../util/editor.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Fantasy Trip Item Sheet
 *
 * @extends {ItemSheet}
 */
export class FTItemSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ItemSheetV2) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: [FT.id, "item", "sheet"],
    position: {
      width: 380,
      height: 520,
    },
    form: {
      submitOnChange: true,
    },
    actions: {
      //
      openPDF: FTItemSheet.#openPDF,
      editHTML: FTItemSheet.#editHTML,
      //
      addAttack: FTItemSheet.#addAttack,
      deleteAttack: FTItemSheet.#deleteAttack,
      addDefense: FTItemSheet.#addDefense,
      deleteDefense: FTItemSheet.#deleteDefense,
      addSpell: FTItemSheet.#addSpell,
      deleteSpell: FTItemSheet.#deleteSpell,
      //
      createEffect: FTItemSheet.#manageEffect,
      editEffect: FTItemSheet.#manageEffect,
      deleteEffect: FTItemSheet.#manageEffect,
      toggleEffect: FTItemSheet.#manageEffect,
    },
  };

  /** @inheritdoc */
  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [{ id: "notes" }, { id: "actions" }, { id: "effects" }],
      initial: "notes",
      labelPrefix: "FT.item.sheet.tab",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: `${FT.path}/templates/sheet/item/header.hbs`,
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    settings: {
      template: `${FT.path}/templates/sheet/item/tab-settings.hbs`,
    },
    notes: {
      template: `${FT.path}/templates/sheet/tab-notes.hbs`,
    },
    actions: {
      template: `${FT.path}/templates/sheet/item/tab-actions.hbs`,
    },
    effects: {
      template: `${FT.path}/templates/sheet/tab-effects.hbs`,
    },
  };

  get title() {
    return game.i18n.format("FT.item.sheet.title", { name: this.item.name });
  }

  /* ------------------------------------------- */
  /*  Sheet Data Preparation                     */
  /* ------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    console.log("_prepareContext()", this, options);
    const context = Object.assign(await super._prepareContext(options), {
      // General Documents, Settings & Config
      FT,
      item: foundry.utils.deepClone(this.item),
      system: foundry.utils.deepClone(this.item.system),
      settings: { pdfPagerEnabled: game.settings.get(FT.id, "pdfPagerEnabled") },
      flags: {
        ...foundry.utils.deepClone(this.item.flags),
        ...(this.item.type === "equipment" && {
          maxAttacks: FT.item.flags.maxAttacks,
          maxDefenses: FT.item.flags.maxDefenses,
          maxSpells: FT.item.flags.maxSpells,
        }),
        ...(this.item.type === "talent" && {
          maxAttacks: FT.item.flags.maxAttacks,
          maxDefenses: FT.item.flags.maxDefenses,
          maxSpells: 0,
        }),
        ...(this.item.type === "spell" && {
          maxAttacks: this.item.system.type === "missile" ? 1 : 0,
          maxDefenses: FT.item.flags.maxDefenses,
          maxSpells: 0,
        }),
        ...(this.item.type === "ability" && {
          maxAttacks: FT.item.flags.maxAttacks,
          maxDefenses: FT.item.flags.maxDefenses,
          maxSpells: FT.item.flags.maxSpells,
        }),
      },
      owned: !!this.item.parent,
      selectOptions: {
        attributes: FT.actor.attributes,
        inventoryLocations: FT.item.inventory.locations.reduce(
          (options, location) => Object.assign(options, { [location]: `FT.actor.sheet.label.location.${location}` }),
          {}
        ),
        spellTypes: FT.item.spell.types,
        attackTypes: FT.item.attack.types,
        // Applicable skill options from the parent actor
        ...(!!this.item.parent && {
          talents: Array.from(this.item.parent?.items.values())
            .filter((item) => item.type === "talent")
            .reduce((talents, talent) => ({ ...talents, [talent._id]: talent.name }), {}),
        }),
        // World Spells for Magic Items
        spells: Array.from(game.items.values())
          .filter((item) => item.type === "spell")
          .reduce((spells, spell) => ({ ...spells, [spell.uuid]: spell.name }), {}),
      },
      //
      effects: this.item.effects,
      enrichedNotes: await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.notes),
    });

    console.log("... item context", context);
    return context;
  }

  /* ------------------------------------------- */
  /*  Sheet Listeners & Handlers                 */
  /* ------------------------------------------- */

  static #addAttack(event, target) {
    console.log("#addAttack", target.dataset);
    this.item.system.attacks.push({
      name: "Attack",
      type: "melee",
      toHitMod: 0,
      baseDamage: "1d6",
      minST: 7,
      talent: null,
    });
    this.item.update({ "system.attacks": this.item.system.attacks });
  }

  static #deleteAttack(event, target) {
    console.log("#deleteAttack", target.dataset);
    this.item.system.attacks.splice(target.dataset.index, 1);
    this.item.update({ "system.attacks": this.item.system.attacks });
  }

  static #addDefense(event, target) {
    console.log("#addDefense", target.dataset);
    this.item.system.defenses.push({
      name: "Defend",
      hitsStopped: 0,
    });
    this.item.update({ "system.defenses": this.item.system.defenses });
  }

  static #deleteDefense(event, target) {
    console.log("#deleteDefense", target.dataset);
    this.item.system.defenses.splice(target.dataset.index, 1);
    this.item.update({ "system.defenses": this.item.system.defenses });
  }

  static #addSpell(event, target) {
    console.log("#addSpell", target.dataset);
    this.item.system.spells.push({ id: null, item: null });
    this.item.update({ "system.spells": this.item.system.spells });
  }

  static #deleteSpell(event, target) {
    console.log("#deleteSpell", target.dataset);
    this.item.system.spells.splice(target.dataset.index, 1);
    this.item.update({ "system.spells": this.item.system.spells });
  }

  static #manageEffect(event, target) {
    console.log("#manageEffect", target.dataset);
    Effects.onManageActiveEffect(this.item, event, target);
  }

  editor = null;

  static async #editHTML(event, target) {
    Editor.editHTML.call(this, event, target);
  }

  static #openPDF(event, target) {
    console.log("#openPDF", target.dataset);
    const re = /^([a-zA-Z0-9_]*)#(\d*)$/m;
    if (!re.test(target.dataset.reference)) return;
    const [_, code, page] = target.dataset.reference.match(re);
    ui.pdfpager?.openPDFByCode(code, { page });
  }
}
