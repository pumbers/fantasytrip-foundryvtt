import * as Handlers from "../util/handlers.mjs";

/**
 * Fantasy Trip Character Sheet
 * @extends {ActorSheet} Extends the basic ActorSheet
 */
export class FTCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["fantasy-trip", "character", "sheet"],
      template: `${CONFIG.FT.path}/templates/sheets/character-sheet.hbs`,
      width: 350,
      height: 550,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "stats",
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
    // console.log("character-sheet.getData()", this);
    const context = {
      ...super.getData(),
      FT: CONFIG.FT,
      actor: foundry.utils.deepClone(this.actor),
      system: foundry.utils.deepClone(this.actor.system),
      flags: foundry.utils.deepClone(this.actor.flags),
      settings: {
        showItemIcons: game.settings.get("fantasytrip", "showItemIcons"),
      },
      // Categorized itemsa
      talents: this.actor.items.filter((item) => item.type === "talent").map((item) => item.toObject()),
      weapons: this.actor.items.filter((item) => item.type === "weapon").map((item) => item.toObject()),
      armor: this.actor.items.filter((item) => item.type === "armor").map((item) => item.toObject()),
      spells: this.actor.items.filter((item) => item.type === "spell").map((item) => item.toObject()),
      // Character's Inventory
      inventory: this.actor.items
        .filter((item) => ["equipment", "weapon", "armor"].includes(item.type))
        .sort((a, b) => a.name.localeCompare(b.name)),
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

    // Prepare active effects
    context.effects = Array.from(this.actor.allApplicableEffects());

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
    html.find(".clickable").click(this.click.bind(this));

    // Item actions
    html.find(".document-set-effects").click(Handlers.onSetItemEffects.bind(this));
    html.find(".document-set-field").click(Handlers.onSetItemField.bind(this));
    html.find(".document-chat").click(Handlers.onChatItem.bind(this));
    html.find(".document-edit").click(Handlers.onItemEdit.bind(this));
    html.find(".document-delete").click(Handlers.onItemDelete.bind(this));
  }

  async _onDropItem(event, data) {
    const item = (await super._onDropItem(event, data))[0];
    console.log("_onDrop()", "data", data, "item", item);

    // If the item is a general item...
    if (["equipment", "weapon", "armor"].includes(item.type)) {
      // Find the nearest container (any item with a capcity)
      const element = $(event?.target);
      const containerId = element?.closest(".item-container").data("itemId");
      console.log("_onDrop() dropped to", "element", element, "container", containerId);

      if (containerId) {
        // If there is a container, set the container reference on the item and mark the items location
        await item?.update({ "system.location": "contained", "system.container": containerId }, {});
        console.log("_onDrop() moved to", "container", containerId, "item", item);
      } else {
        // If not, then assume the character has it "in-hand"
        await item?.update({ "system.location": "equipped", "system.container": null }, {});
        console.log("_onDrop() equipped", "item", item);
      }
    }

    // dropping items when a container is deleted
    // changing an items location to be the same as the container
    // dropping an item onto itself
    // dropping a container onto another container
  }

  click(event) {
    event.preventDefault();
    const element = $(event?.currentTarget);
    const dataset = element?.data();
    const { shiftKey, ctrlKey, altKey } = event;
    let itemId;

    switch (dataset.action) {
      case "attribute-roll":
        console.log("click():attribute-roll", dataset.attribute);
        break;
      case "talent-roll":
        itemId = element?.closest("[data-item-id]").data("itemId");
        console.log("click():talent-roll", itemId);
        if (!itemId) return;
        item = this.actor.getEmbeddedDocument("Item", itemId);
        break;
      case "cast-spell":
        itemId = element?.closest("[data-item-id]").data("itemId");
        console.log("click():cast-spell", itemId);
        item = this.actor.getEmbeddedDocument("Item", itemId);
        if (!itemId) return;
        break;
      default:
        console.error(`FT | Unimplemented clickable action: ${dataset.action}`);
        break;
    }
  }
}
