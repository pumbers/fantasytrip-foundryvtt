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
    id: "item-sheet",
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
      FT: CONFIG.FT,
      item: foundry.utils.deepClone(this.item),
      system: foundry.utils.deepClone(this.item.system),
      flags: foundry.utils.deepClone(this.item.flags),
      owned: !!this.item.parent,
      selectOptions: {
        attributes: CONFIG.FT.actor.attributes,
        spellTypes: CONFIG.FT.item.spell.types,
        attackTypes: CONFIG.FT.item.attack.types,
        // Applicable skill options from the parent actor
        ...(!!this.item.parent && {
          talents: Array.from(this.item.parent?.items.values())
            .filter((item) => item.type === "talent")
            .reduce((talents, talent) => ({ ...talents, [talent._id]: talent.name }), {}),
        }),
        // World Compendia Spells for Magic Items
        worldSpells: Array.from(game.items.values())
          .filter((item) => item.type === "spell")
          .reduce((spells, spell) => ({ ...spells, [spell._id]: spell.name }), {}),
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
    console.log("_addAttack", target.dataset);
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
    console.log("_deleteAttack", target.dataset);
    this.item.system.attacks.splice(target.dataset.index, 1);
    this.item.update({ "system.attacks": this.item.system.attacks });
  }

  static #addDefense(event, target) {
    console.log("_addDefense", target.dataset);
    this.item.system.defenses.push({
      name: "Defend",
      hitsStopped: 0,
    });
    this.item.update({ "system.defenses": this.item.system.defenses });
  }

  static #deleteDefense(event, target) {
    console.log("_deleteDefense", target.dataset);
    this.item.system.defenses.splice(target.dataset.index, 1);
    this.item.update({ "system.defenses": this.item.system.defenses });
  }

  static #addSpell(event, target) {
    console.log("_addSpell", target.dataset);
    this.item.system.spells.push({ id: null, item: null });
    this.item.update({ "system.spells": this.item.system.spells });
  }

  static #deleteSpell(event, target) {
    console.log("_deleteSpell", target.dataset);
    this.item.system.spells.splice(target.dataset.index, 1);
    this.item.update({ "system.spells": this.item.system.spells });
  }

  static #manageEffect(event, target) {
    console.log("_manageEffect", target.dataset);
    Effects.onManageActiveEffect(this.item, event, target);
  }

  editor = null;

  static async #editHTML(event, target) {
    Editor.editHTML.call(this, event, target);
  }
}
