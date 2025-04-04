import * as Handlers from "../util/handlers.mjs";
import * as Effects from "../util/effects.mjs";
import * as Action from "../system/action.mjs";

/**
 * Fantasy Trip Character Sheet
 *
 * @extends {ActorSheet} Extends the basic ActorSheet
 */
export class FTCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["fantasy-trip", "character", "sheet"],
      template: `${CONFIG.FT.path}/templates/sheet/character/character-sheet.hbs`,
      width: 430,
      height: 640,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "character",
        },
      ],
      dragDrop: [{ dragSelector: ".item[draggable='true']", dropSelector: null }],
    });
  }

  /* ------------------------------------------- */
  /*  Sheet Data Preparation                     */
  /* ------------------------------------------- */

  /** @override */
  async getData() {
    // console.log("actor-sheet.getData()", this);
    const context = {
      ...super.getData(),
      // General Documents, Settings & Config
      FT: CONFIG.FT,
      actor: foundry.utils.deepClone(this.actor),
      system: foundry.utils.deepClone(this.actor.system),
      flags: foundry.utils.mergeObject(foundry.utils.deepClone(this.actor.flags), {
        apExceeded: this.actor.system.ap > game.settings.get("fantasy-trip", "initialAP") && this.actor.system.xp === 0,
      }),
      settings: {
        showItemIcons: game.settings.get("fantasy-trip", "showItemIcons"),
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
    };

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

    // Applied Active Effects
    context.effects = Array.from(this.actor.allApplicableEffects()).filter((e) => !e.disabled);

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

    // Item actions
    html.find(".document-chat").click(Handlers.onChatItem.bind(this));
    html.find(".document-create").click(Handlers.onItemCreate.bind(this));
    html.find(".document-edit").click(Handlers.onItemEdit.bind(this));
    html.find(".document-delete").click(Handlers.onItemDelete.bind(this));
  }

  /**
   * Handle a sheet click event
   *
   * @param {Event} event
   */
  click(event) {
    event.preventDefault();
    const element = $(event?.currentTarget);
    const dataset = element?.data();
    const itemId = element?.closest("[data-item-id]").data("itemId");
    let item;

    switch (dataset.action) {
      case "item-change-location":
        // console.log("click():item-change-location", dataset);
        if (!itemId) return;
        this.onItemChangeLocation(itemId);
        break;
      case "item-delete":
        // console.log("click():item-delete", dataset);
        if (!itemId) return;
        this.onItemDelete(itemId);
        break;
      case "change-movement":
        // console.log("click():change-movement", dataset);
        const modes = Object.keys(CONFIG.FT.actor.ma.modes);
        this.actor.update({
          "system.ma.mode": modes[(modes.findIndex((m) => m === this.actor.system.ma.mode) + 1) % modes.length],
        });
        break;
      case "attribute-roll":
        // console.log("click():attribute-roll", dataset);
        Action.attributeRoll(this.actor, dataset);
        break;
      case "talent-roll":
        // console.log("click():talent-roll", dataset);
        if (!itemId) return;
        item = this.actor.items.get(itemId);
        Action.talentRoll(this.actor, item, dataset);
        break;
      case "attack-roll":
        // console.log("click():attack-roll", dataset);
        if (!itemId) return;
        item = this.actor.items.get(itemId);
        Action.attackRoll(this.actor, item, dataset);
        break;
      case "damage-roll":
        // console.log("click():damage-roll", dataset);
        if (!itemId) return;
        item = this.actor.items.get(itemId);
        Action.damageRoll(this.actor, item, dataset);
        break;
      case "cast-spell":
        // console.log("click():cast-spell", dataset);
        if (!itemId) return;
        item = this.actor.items.get(itemId);
        Action.castingRoll(this.actor, item, dataset);
        break;
      case "cancel-spell":
        // console.log("click():cast-spell", dataset);
        if (!itemId) return;
        item = this.actor.items.get(itemId);
        item.update({ "system.stSpent": 0 });
        break;
      case "cast-item":
        // console.log("click():cast-item", dataset);
        if (!itemId) return;
        item = this.actor.items.get(itemId);
        const spell = item.system.spells[dataset.index];
        Action.castingRoll(this.actor, spell.data, { ...dataset, burn: spell.burn, item });
        break;
      case "create-effect":
      case "edit-effect":
      case "toggle-effect":
      case "delete-effect":
        Effects.onManageActiveEffect.call(this.actor, event);
        break;
      default:
        console.error(`FT | Unimplemented action: ${dataset.action}`);
        break;
    }
  }

  /**
   * Handle a drop event
   *
   * @param {Event} event
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);

    // If the drop was an item....
    if (data.type === "Item") {
      const item = await Item.implementation.fromDropData(data);
      // If it was an equipment item type...
      if (item.type === "equipment") {
        // Check if it was dropped on a container item
        const element = $(event?.target);
        const containerId = element?.closest(".item-container").data("itemId");
        const container = !!containerId ? await this.actor.getEmbeddedDocument("Item", containerId) : null;

        // Check if the item is a container itself
        if (!!container && item.system.isContainer) {
          ui.notifications.warn(game.i18n.format("FT.messages.noDropContainer", { item: item.name }));
          return item;
        }

        if (item?.parent?._id === this.actor._id) {
          // Existing inventory item dropped
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
        } else {
          // New item dropped
          const dropped = await super._onDrop(event);
          this.actor.updateEmbeddedDocuments(
            "Item",
            dropped.map((d) => ({
              _id: d._id,
              "system.location": container?.system.location ?? this.actor.type === "npc" ? "equipped" : "carried",
              "system.container": container?._id,
            }))
          );
          return dropped;
        }
      }
    }
    return super._onDrop(event);
  }

  /**
   * Change an item's location
   *
   * @param {String} itemId
   */
  onItemChangeLocation(itemId) {
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    const changes = [];

    // Move it to the next location
    const movedTo =
      (CONFIG.FT.item.inventory.locations.findIndex((location) => location === item.system.location) + 1) % 5;
    changes.push({ _id: itemId, "system.location": CONFIG.FT.item.inventory.locations[movedTo] });

    // If it's a container, also move its contents
    if (item.system.isContainer) {
      this.actor.items.forEach((i) => {
        if (i.system.container === itemId)
          changes.push({ _id: i._id, "system.location": CONFIG.FT.item.inventory.locations[movedTo] });
      });
    }

    this.actor.updateEmbeddedDocuments("Item", changes);
  }

  /**
   * Delete an item
   *
   * @param {String} itemId
   */
  onItemDelete(itemId) {
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    const changes = [];
    if (item.system.isContainer) {
      this.actor.items.forEach((i) => {
        if (i.system.container === itemId)
          changes.push({ _id: i._id, "system.container": null, "system.location": "dropped" });
      });
    }
    this.actor.updateEmbeddedDocuments("Item", changes);
    this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }
}

/**
 * Fantasy Trip NPC Sheet
 * @extends {ActorSheet} Extends the FTCHaracterSheet
 */
export class FTNPCSheet extends FTCharacterSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["fantasy-trip", "npc", "sheet"],
      template: `${CONFIG.FT.path}/templates/sheet/npc/npc-sheet.hbs`,
      width: 445,
      height: 400,
    });
  }
}
