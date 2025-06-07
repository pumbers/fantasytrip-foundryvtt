import { FT } from "../system/config.mjs";
import * as Handlers from "../util/handlers.mjs";
import * as Effects from "../util/effects.mjs";
import * as Action from "../system/action.mjs";
import * as Editor from "../util/editor.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Fantasy Trip Base Character Sheet
 *
 * @extends {ActorSheetV2} Extends the basic ActorSheetV2
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
      chat: FTBaseCharacterSheet.#chat,
      chatItem: FTBaseCharacterSheet.#chatItem,
      //
      attributeRoll: FTBaseCharacterSheet.#attributeRoll,
      changeMovement: FTBaseCharacterSheet.#changeMovement,
      attackRoll: FTBaseCharacterSheet.#attackRoll,
      damageRoll: FTBaseCharacterSheet.#damageRoll,
      //
      editHTML: FTBaseCharacterSheet.#editHTML,
      //
      talentRoll: FTBaseCharacterSheet.#talentRoll,
      //
      createItem: FTBaseCharacterSheet.#createItem,
      editItem: FTBaseCharacterSheet.#editItem,
      deleteItem: FTBaseCharacterSheet.#deleteItem,
      changeItemLocation: FTBaseCharacterSheet.#changeItemLocation,
      castSpellFromItem: FTBaseCharacterSheet.#castSpellFromItem,
      setItemField: FTBaseCharacterSheet.#setItemField,
      //
      castSpell: FTBaseCharacterSheet.#castSpell,
      maintainSpell: FTBaseCharacterSheet.#maintainSpell,
      cancelSpell: FTBaseCharacterSheet.#cancelSpell,
      //
      createEffect: FTBaseCharacterSheet.#manageEffect,
      editEffect: FTBaseCharacterSheet.#manageEffect,
      deleteEffect: FTBaseCharacterSheet.#manageEffect,
      toggleEffect: FTBaseCharacterSheet.#manageEffect,
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
      spells: this.actor.items
        .filter((item) => item.type === "spell" && !item.isReady)
        .sort((a, b) => a.name.localeCompare(b.name)),
      inventory: this.actor.items
        .filter((item) => item.type === "equipment")
        .sort((a, b) => a.name.localeCompare(b.name)),
      abilities: this.actor.items
        .filter((item) => item.type === "ability")
        .sort((a, b) => a.name.localeCompare(b.name)),
      // Readied Attacks, Defenses, Magic Items, Active Spells
      readied: this.actor.items
        .filter((item) => item.system.isReady && item.system.hasActions)
        .map((item) => {
          item.system.spells
            ?.filter((spell) => !!spell.uuid)
            .forEach((spell) => {
              foundry.utils.fromUuid(spell.uuid).then((found) => {
                spell.name = found.name;
                spell.casting = found.system.casting;
              });
            });
          return item;
        })
        .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)),
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

  static #chat(event, target) {
    console.log("#chat()", target.dataset);
    this.actor.chat();
  }

  static #chatItem(event, target) {
    console.log("#chatItem()", target.dataset);
    return Handlers.onChatItem(this.actor, event, target);
  }

  static #createItem(event, target) {
    console.log("#createItem()", target.dataset);
    Handlers.onCreateItem(this.actor, event, target).then((item) => item.sheet.render(true));
  }

  static #editItem(event, target) {
    console.log("#editItem()", target.dataset);
    return Handlers.onEditItem(this.actor, event, target);
  }

  static #deleteItem(event, target) {
    console.log("#deleteItem()", target.dataset);
    return Handlers.onDeleteItem(this.actor, event, target);
  }

  static #changeItemLocation(event, target) {
    console.log("#changeItemLocation()", target.dataset);
    return Handlers.onIemChangeLocation(this.actor, FT.item.inventory.locations, event, target);
  }

  static #setItemField(event, target) {
    console.log("#setItemField()", target.dataset);
    return Handlers.onSetItemField(this.actor, event, target);
  }

  static #changeMovement(event, target) {
    console.log("#changeMovement()", target.dataset);
    const modes = Object.keys(CONFIG.FT.actor.ma.modes);
    this.actor.update({
      "system.ma.mode": modes[(modes.findIndex((m) => m === this.actor.system.ma.mode) + 1) % modes.length],
    });
  }

  static #attributeRoll(event, target) {
    console.log("#attributeRoll", target.dataset);
    Action.attributeRoll(this.actor, target.dataset);
  }

  static #talentRoll(event, target) {
    console.log("#talentRoll", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return console.error(FT.prefix, "Unable to find item", itemId);
    Action.talentRoll(this.actor, item, target.dataset);
  }

  static #attackRoll(event, target) {
    console.log("#attackRoll", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return console.error(FT.prefix, "Unable to find item", itemId);
    Action.attackRoll(this.actor, item, target.dataset);
  }

  static #damageRoll(event, target) {
    console.log("#damageRoll", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return console.error(FT.prefix, "Unable to find item", itemId);
    Action.damageRoll(this.actor, item, target.dataset);
  }

  static #castSpell(event, target) {
    console.log("#castSpell", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return console.error(FT.prefix, "Unable to find item", itemId);
    Action.castingRoll(this.actor, item, target.dataset);
  }

  static #maintainSpell(event, target) {
    console.log("#maintainSpell", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return console.error(FT.prefix, "Unable to find item", itemId);
    this.actor.update({ "system.fatigue": this.actor.system.fatigue + item.system.stToMaintain });
  }

  static #cancelSpell(event, target) {
    console.log("#cancelSpell", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    const spell = this.actor.items.get(itemId);
    spell.delete();
  }

  static #castSpellFromItem(event, target) {
    console.log("#castSpellFromItem", target.dataset);
    const itemId = target?.closest("[data-item-id]").dataset?.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return console.error(FT.prefix, "Unable to find item", itemId);
    const spell = foundry.utils.fromUuidSync(target.dataset.spellUuid);
    if (!spell) return console.error(FT.prefix, "Unable to find spell", target.dataset.spellUuid);
    Action.castingRoll(this.actor, spell, { ...target.dataset, burn: target.dataset.burn, item });
  }

  static #manageEffect(event, target) {
    console.log("#manageEffect", target.dataset);
    Effects.onManageActiveEffect(this.actor, event, target);
  }

  editor = null;

  static async #editHTML(event, target) {
    Editor.editHTML.call(this, event, target);
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
      width: 450,
      height: 680,
    },
  };

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
      template: `${FT.path}/templates/sheet/actor/character/header.hbs`,
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    character: {
      template: `${FT.path}/templates/sheet/actor/character/tab-character.hbs`,
    },
    notes: {
      template: `${FT.path}/templates/sheet/tab-notes.hbs`,
    },
    talents: {
      template: `${FT.path}/templates/sheet/actor/character/tab-talents.hbs`,
    },
    inventory: {
      template: `${FT.path}/templates/sheet/actor/character/tab-inventory.hbs`,
    },
    spells: {
      template: `${FT.path}/templates/sheet/actor/character/tab-spells.hbs`,
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
      width: 460,
      height: 440,
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
      template: `${FT.path}/templates/sheet/actor/npc/header.hbs`,
    },
    tabs: {
      // Foundry-provided generic template
      template: "templates/generic/tab-navigation.hbs",
    },
    character: {
      template: `${FT.path}/templates/sheet/actor/npc/tab-character.hbs`,
    },
    notes: {
      template: `${FT.path}/templates/sheet/tab-notes.hbs`,
    },
    inventory: {
      template: `${FT.path}/templates/sheet/actor/npc/tab-inventory.hbs`,
    },
    effects: {
      template: `${FT.path}/templates/sheet/tab-effects.hbs`,
    },
  };
}
