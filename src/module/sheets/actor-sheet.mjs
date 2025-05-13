import { FT } from "../system/config.mjs";
import * as Handlers from "../util/handlers.mjs";
import * as Effects from "../util/effects.mjs";
import * as Action from "../system/action.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Fantasy Trip Base Character Sheet
 *
 * @extends {ActorSheet} Extends the basic ActorSheet
 */
class FTBaseCharacterSheet extends HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
  /* -------------------------------------------- */
  /*  Sheet Setup                     
  /* -------------------------------------------- */

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    form: {
      submitOnChange: true,
    },
    actions: {
      attributeRoll: FTBaseCharacterSheet._attributeRoll,
      changeMovement: FTBaseCharacterSheet._changeMovement,
      attackRoll: FTBaseCharacterSheet._attackRoll,
      damageRoll: FTBaseCharacterSheet._damageRoll,
      //
      editHTML: FTBaseCharacterSheet._editHTML,
      //
      talentRoll: FTBaseCharacterSheet._talentRoll,
      //
      createItem: FTBaseCharacterSheet._createItem,
      editItem: FTBaseCharacterSheet._editItem,
      deleteItem: FTBaseCharacterSheet._deleteItem,
      changeItemLocation: FTBaseCharacterSheet._changeItemLocation,
      castItem: FTBaseCharacterSheet._castItem,
      //
      castSpell: FTBaseCharacterSheet._castSpell,
      cancelSpell: FTBaseCharacterSheet._cancelSpell,
      //
      createEffect: FTBaseCharacterSheet._manageEffect,
      editEffect: FTBaseCharacterSheet._manageEffect,
      deleteEffect: FTBaseCharacterSheet._manageEffect,
      toggleEffect: FTBaseCharacterSheet._manageEffect,
    },
  };

  get title() {
    return game.i18n.format("FT.actor.sheet.title", { name: this.actor.name });
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
      actor: foundry.utils.deepClone(this.actor),
      system: foundry.utils.deepClone(this.actor.system),
      flags: foundry.utils.mergeObject(foundry.utils.deepClone(this.actor.flags), {
        apExceeded: this.actor.system.ap > game.settings.get(FT.id, "initialAP") && this.actor.system.xp === 0,
      }),
      settings: {
        showItemIcons: game.settings.get(FT.id, "showItemIcons"),
      },
      // Categorized items
      talents: this.actor.items.filter((item) => item.type === "talent").sort((a, b) => a.name.localeCompare(b.name)),
      spells: this.actor.items.filter((item) => item.type === "spell").sort((a, b) => a.name.localeCompare(b.name)),
      inventory: this.actor.items
        .filter((item) => item.type === "equipment")
        .sort((a, b) => a.name.localeCompare(b.name)),
      // Attacks, Defenses, Magic Items, Readied Spells
      offenses: this.actor.items.filter((item) => item.system.isReady && item.system.hasAttacks),
      defenses: this.actor.items.filter((item) => item.system.isReady && item.system.hasDefenses),
      castables: this.actor.items.filter((item) => item.system.isReady && item.system.hasSpells),
      cast: this.actor.items.filter((item) => item.type === "spell" && item.system.isReady && !item.system.hasActions),
      //
      effects: Array.from(this.actor.allApplicableEffects()),
      enrichedNotes: await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.actor.system.notes),
    });

    // Sort inventory items into their containers
    context.inventory = context.inventory
      .map((item) => {
        if (!!item.system.capacity) {
          return [item, context.inventory.filter((contents) => contents.system.container === item._id)];
        } else if (!item.system.container) {
          return item;
        } else {
          return [];
        }
      })
      .flat(2);

    console.log("... actor context", context);
    return context;
  }

  /* -------------------------------------------- */
  /*  Action Functions                       
  /* -------------------------------------------- */

  static _createItem(event, target) {
    console.log("_createItem()", target.dataset);
    Handlers.onCreateItem(this.actor, event, target).then((item) => item.sheet.render(true));
  }

  static _editItem(event, target) {
    console.log("_editItem()", target.dataset);
    return Handlers.onEditItem(this.actor, event, target);
  }

  static _deleteItem(event, target) {
    console.log("_deleteItem()", target.dataset);
    return Handlers.onDeleteItem(this.actor, event, target);
  }

  static _changeItemLocation(event, target) {
    console.log("_changeItemLocation()", target.dataset);
    return Handlers.onIemChangeLocation(this.actor, FT.item.inventory.locations, event, target);
  }

  static _changeMovement(event, target) {
    console.log("_changeMovement()", target.dataset);
    const modes = Object.keys(CONFIG.FT.actor.ma.modes);
    this.actor.update({
      "system.ma.mode": modes[(modes.findIndex((m) => m === this.actor.system.ma.mode) + 1) % modes.length],
    });
  }

  static _attributeRoll(event, target) {
    console.log("_attributeRoll", target.dataset);
    Action.attributeRoll(this.actor, target.dataset);
  }

  static _talentRoll(event, target) {
    console.log("_talentRoll", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    Action.talentRoll(this.actor, item, target.dataset);
  }

  static _attackRoll(event, target) {
    console.log("_attackRoll", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    Action.attackRoll(this.actor, item, target.dataset);
  }

  static _damageRoll(event, target) {
    console.log("_damageRoll", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    Action.damageRoll(this.actor, item, target.dataset);
  }

  static _castSpell(event, target) {
    console.log("_castSpell", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    Action.castingRoll(this.actor, item, target.dataset);
  }

  static _cancelSpell(event, target) {
    console.log("_cancelSpell", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    item.update({ "system.stSpent": 0 });
  }

  static _castItem(event, target) {
    console.log("_castItem", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    if (!itemId) return;
    const item = this.actor.items.get(itemId);
    const spell = item.system.spells[target.dataset.index];
    Action.castingRoll(this.actor, spell.data, { ...target.dataset, burn: spell.burn, item });
  }

  static _manageEffect(event, target) {
    console.log("_manageEffect", target.dataset);
    Effects.onManageActiveEffect(this.actor, event, target);
  }

  editor = null;

  static async _editHTML(event, target) {
    console.log("_editHTML()", this.actor);
    const tab = target.closest("section.tab");
    const wrapper = tab.querySelector(".prosemirror.editor");

    wrapper.classList.add("active");
    const editorContainer = wrapper.querySelector(".editor-container");
    const content = foundry.utils.getProperty(this.actor, target.dataset.fieldName);

    this.editor = await foundry.applications.ux.ProseMirrorEditor.create(editorContainer, content, {
      document: this.actor,
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
    const currentValue = foundry.utils.getProperty(this.actor, fieldName);
    if (newValue !== currentValue) {
      await this.actor.update({ [fieldName]: newValue });
    }
    this.render(true);
  }

  async _onDragStart(event) {
    console.log("_onDragStart()", event.target?.dataset);
    super._onDragStart(event);
  }

  async _onDrop(event) {
    const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
    console.log("_onDrop()", "event", event, "data", data);

    // If the drop was an item....
    if (data.type === "Item") {
      const item = await Item.implementation.fromDropData(data);
      // If it was an equipment item type...
      if (FT.item.inventory.types.includes(item.type)) {
        // Check if it was dropped on a container item
        const element = $(event?.target);
        const containerId = element?.closest(".item-container").data("itemId");
        const container = !!containerId ? await this.actor.getEmbeddedDocument("Item", containerId) : null;

        // Check if the item is a container itself and is being dropped on a container
        if (!!container && item.system.isContainer) {
          ui.notifications.warn(game.i18n.format("FT.messages.noDropContainer", { item: item.name }));
          return item;
        }

        // Check if it's an existing ionventory item
        if (item?.parent?._id === this.actor._id) {
          // Check if the container has remaining capacity...
          if (item.system.wt > container?.system.remaining) {
            ui.notifications.warn(game.i18n.format("FT.messages.noCapacity", { container: container.name }));
            return item;
          }
          // Set the container and location
          await item.update({
            "system.container": containerId ?? null,
            "system.location": container?.system.location ?? "carried",
          });
          return item;
        }
      }
    }
    return super._onDrop(event);
  }
}

export class FTCharacterSheet extends FTBaseCharacterSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "character-sheet",
    classes: [FT.id, "character", "sheet"],
    position: {
      width: 430,
      height: 640,
    },
  };

  /** @inheritdoc */
  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "character" },
        { id: "notes" },
        { id: "talents" },
        { id: "inventory" },
        { id: "spells" },
        { id: "effects" },
      ],
      initial: "character",
      labelPrefix: "FT.actor.sheet.tab",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: `${FT.path}/templates/sheet/character/header.hbs`,
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    character: {
      template: `${FT.path}/templates/sheet/character/tab-character.hbs`,
    },
    notes: {
      template: `${FT.path}/templates/sheet/tab-notes.hbs`,
    },
    talents: {
      template: `${FT.path}/templates/sheet/character/tab-talents.hbs`,
    },
    inventory: {
      template: `${FT.path}/templates/sheet/character/tab-inventory.hbs`,
    },
    spells: {
      template: `${FT.path}/templates/sheet/character/tab-spells.hbs`,
    },
    effects: {
      template: `${FT.path}/templates/sheet/tab-effects.hbs`,
    },
  };
}

/**
 * Fantasy Trip NPC Sheet
 * @extends {ActorSheet} Extends the FTCHaracterSheet
 */
export class FTNPCSheet extends FTBaseCharacterSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    id: "npc-sheet",
    classes: [FT.id, "npc", "sheet"],
    position: {
      width: 445,
      height: 430,
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [{ id: "character" }, { id: "notes" }, { id: "inventory" }, { id: "effects" }],
      initial: "character",
      labelPrefix: "FT.actor.sheet.tab",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: `${FT.path}/templates/sheet/npc/header.hbs`,
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    character: {
      template: `${FT.path}/templates/sheet/npc/tab-character.hbs`,
    },
    notes: {
      template: `${FT.path}/templates/sheet/tab-notes.hbs`,
    },
    inventory: {
      template: `${FT.path}/templates/sheet/npc/tab-inventory.hbs`,
    },
    effects: {
      template: `${FT.path}/templates/sheet/tab-effects.hbs`,
    },
  };
}
