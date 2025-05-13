import { FT } from "../system/config.mjs";
import * as Effects from "../util/effects.mjs";

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
      editHTML: FTItemSheet._editHTML,
      //
      addAttack: FTItemSheet._addAttack,
      deleteAttack: FTItemSheet._deleteAttack,
      addDefense: FTItemSheet._addDefense,
      deleteDefense: FTItemSheet._deleteDefense,
      addSpell: FTItemSheet._addSpell,
      deleteSpell: FTItemSheet._deleteSpell,
      //
      createEffect: FTItemSheet._manageEffect,
      editEffect: FTItemSheet._manageEffect,
      deleteEffect: FTItemSheet._manageEffect,
      toggleEffect: FTItemSheet._manageEffect,
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

  static _addAttack(event, target) {
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

  static _deleteAttack(event, target) {
    console.log("_deleteAttack", target.dataset);
    this.item.system.attacks.splice(target.dataset.index, 1);
    this.item.update({ "system.attacks": this.item.system.attacks });
  }

  static _addDefense(event, target) {
    console.log("_addDefense", target.dataset);
    this.item.system.defenses.push({
      name: "Defend",
      hitsStopped: 0,
    });
    this.item.update({ "system.defenses": this.item.system.defenses });
  }

  static _deleteDefense(event, target) {
    console.log("_deleteDefense", target.dataset);
    this.item.system.defenses.splice(target.dataset.index, 1);
    this.item.update({ "system.defenses": this.item.system.defenses });
  }

  static _addSpell(event, target) {
    console.log("_addSpell", target.dataset);
    this.item.system.spells.push({ id: null, item: null });
    this.item.update({ "system.spells": this.item.system.spells });
  }

  static _deleteSpell(event, target) {
    console.log("_deleteSpell", target.dataset);
    this.item.system.spells.splice(target.dataset.index, 1);
    this.item.update({ "system.spells": this.item.system.spells });
  }

  static _manageEffect(event, target) {
    console.log("_manageEffect", target.dataset);
    Effects.onManageActiveEffect(this.item, event, target);
  }

  editor = null;

  static async _editHTML(event, target) {
    console.log("_editHTML()", this.item, target.dataset);
    const tab = target.closest("section.tab");
    const wrapper = tab.querySelector(".prosemirror.editor");

    wrapper.classList.add("active");
    const editorContainer = wrapper.querySelector(".editor-container");
    const content = foundry.utils.getProperty(this.item, target.dataset.fieldName);

    this.editor = await foundry.applications.ux.ProseMirrorEditor.create(editorContainer, content, {
      document: this.item,
      fieldName: target.dataset.fieldName,
      relativeLinks: true,
      collaborate: true,
      plugins: {
        menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
          destroyOnSave: true,
          onSave: this._saveEditor.bind(this),
        }),
        keyMaps: ProseMirror.ProseMirrorKeyMaps.build(ProseMirror.defaultSchema, {
          onSave: this._saveEditor.bind(this),
        }),
      },
    });
  }

  async _saveEditor() {
    console.log("_saveEditor()", this.editor);
    const newValue = ProseMirror.dom.serializeString(this.editor.view.state.doc.content);
    const [uuid, fieldName] = this.editor.uuid.split("#");
    this.editor.destroy();
    this.editor = null;
    const currentValue = foundry.utils.getProperty(this.item, fieldName);
    if (newValue !== currentValue) {
      await this.item.update({ [fieldName]: newValue });
    }
    this.render(true);
  }
}
