import * as Handlers from "../util/handlers.mjs";
import * as Effects from "../util/effects.mjs";
import * as Action from "../system/action.mjs";

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
      width: 400,
      height: 600,
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
      talents: this.actor.items.filter((item) => item.type === "talent"),
      weapons: this.actor.items.filter((item) => item.type === "weapon"),
      armor: this.actor.items.filter((item) => item.type === "armor"),
      shields: this.actor.items.filter((item) => item.type === "shield"),
      spells: this.actor.items.filter((item) => item.type === "spell"),
      // Character's Inventory
      inventory: this.actor.items
        .filter((item) => CONFIG.FT.item.inventory.types.includes(item.type))
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
    html.find("[data-action]").click(this.click.bind(this));
    html.find(".effect-manage").click(Effects.onManageActiveEffect.bind(this.actor));

    // Item actions
    html.find(".document-chat").click(Handlers.onChatItem.bind(this));
    html.find(".document-edit").click(Handlers.onItemEdit.bind(this));
    html.find(".document-delete").click(Handlers.onItemDelete.bind(this));
  }

  click(event) {
    event.preventDefault();
    const element = $(event?.currentTarget);
    const dataset = element?.data();
    const itemId = element?.closest("[data-item-id]").data("itemId");
    let item;

    switch (dataset.action) {
      case "item-change-location":
        console.log("click():item-change-location", dataset);
        if (!itemId) return;
        this.onItemChangeLocation(itemId);
        break;
      case "item-delete":
        console.log("click():item-delete", dataset);
        if (!itemId) return;
        this.onItemDelete(itemId);
        break;
      case "attribute-roll":
        console.log("click():attribute-roll", dataset);
        // TODO
        // this.DICE_ROLLER.render({
        //   force: true,
        //   actor: this.actor,
        //   type: "attribute",
        //   ...dataset,
        // });
        break;
      case "talent-roll":
        console.log("click():talent-roll", dataset);
        if (!itemId) return;
        item = this.actor.getEmbeddedDocument("Item", itemId);
        // TODO
        // this.DICE_ROLLER.render({
        //   force: true,
        //   actor: this.actor,
        //   item,
        //   type: "talent",
        //   attribute: item.system.defaultAttribute,
        //   ...dataset,
        // });
        break;
      case "attack-roll":
        console.log("click():attack-roll", dataset);
        if (!itemId) return;
        item = this.actor.getEmbeddedDocument("Item", itemId);
        Action.attackRoll(this.actor, item, dataset);
        break;
      case "damage-roll":
        console.log("click():damage-roll", dataset);
        if (!itemId) return;
        item = this.actor.getEmbeddedDocument("Item", itemId);
        Action.damageRoll(this.actor, item);
        break;
      case "cast-spell":
        console.log("click():cast-spell", dataset);
        if (!itemId) return;
        item = this.actor.getEmbeddedDocument("Item", itemId);
        // TODO
        // this.DICE_ROLLER.render({
        //   force: true,
        //   actor: this.actor,
        //   item,
        //   type: "cast",
        //   attribute: "adjiq",
        //   ...dataset,
        // });
        break;
      default:
        console.error(`FT | Unimplemented action: ${dataset.action}`);
        break;
    }
  }

  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);

    // If the drop was an item....
    if (data.type === "Item") {
      const item = await Item.implementation.fromDropData(data);
      // If it was an inventory item type...
      if (CONFIG.FT.item.inventory.types.includes(item.type)) {
        // Check if it was dropped on a container item
        const element = $(event?.target);
        const containerId = element?.closest(".item-container").data("itemId");
        const container = !!containerId ? await this.actor.getEmbeddedDocument("Item", containerId) : null;

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
              "system.location": container?.system.location ?? "carried",
              "system.container": container?._id,
            }))
          );
          return dropped;
        }
      }
    }
    return super._onDrop(event);
  }

  onItemChangeLocation(itemId) {
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    // Move it to the next location
    const movedTo =
      (CONFIG.FT.item.inventory.locations.findIndex((location) => location === item.system.location) + 1) % 5;
    item.update({ "system.location": CONFIG.FT.item.inventory.locations[movedTo] });
    // If it's a container, also move its contents
    if (item.system.isContainer) {
      this.actor.updateEmbeddedDocuments(
        "Item",
        Array.from(this.actor.items)
          .filter((i) => i.system.container === itemId)
          .map((i) => ({ _id: i._id, "system.location": CONFIG.FT.item.inventory.locations[movedTo] }))
      );
    }
  }

  onItemDelete(itemId) {
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    if (item.system.isContainer) {
      this.actor.updateEmbeddedDocuments(
        "Item",
        Array.from(this.actor.items)
          .filter((i) => i.system.container === itemId)
          .map((i) => ({ _id: i._id, "system.container": null, "system.location": "dropped" }))
      );
    }
    this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }
}
