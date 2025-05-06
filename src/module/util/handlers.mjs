/**
 * Sheet Event Handlers
 * @module handlers
 */

import { FT } from "../system/config.mjs";

/**
 * Handle creating a new Item for the actor using initial data defined in the HTML dataset
 * @param {Actor} actor  The actor
 * @param {Event} event   The originating click event
 * @param {Target} target  The target element for the event
 */
export function onCreateItem(actor, event, target) {
  const { name, type, ...system } = target.dataset ?? {};
  // Prepare the item object.
  foundry.utils.deepClone(system);
  const itemData = {
    name: name || `New ${type.capitalize()}`,
    type,
    system,
  };
  // Finally, create the item!
  return Item.create(itemData, { parent: actor });
}

/**
 * Handle editing an item by opening the item sheet
 * @param {Actor} actor  The actor
 * @param {Event} event   The originating click event
 * @param {Target} target  The target element for the event
 */
export function onEditItem(actor, event, target) {
  const itemId = target?.closest("[data-item-id]").dataset?.itemId;
  if (!itemId) return;
  const item = actor.items.get(itemId);
  item?.sheet.render(true);
}

/**
 * Handle deleting an item
 * @param {Actor} actor  The actor
 * @param {Event} event   The originating click event
 * @param {Target} target  The target element for the event
 */
export function onDeleteItem(actor, event, target) {
  const itemId = target?.closest("[data-item-id]").dataset?.itemId;
  if (!itemId) return;
  const item = actor.items.get(itemId);
  const changes = [];
  if (item.system.isContainer) {
    actor.items.forEach((i) => {
      if (i.system.container === itemId)
        changes.push({ _id: i._id, "system.container": null, "system.location": "dropped" });
    });
  }
  actor.updateEmbeddedDocuments("Item", changes);
  actor.deleteEmbeddedDocuments("Item", [itemId]);
}

export function onIemChangeLocation(actor, locations, event, target) {
  const itemId = target?.closest("[data-item-id]").dataset?.itemId;
  if (!itemId) return;
  const item = actor.items.get(itemId);
  const changes = [];

  // Move it to the next location
  const movedTo = (locations.findIndex((location) => location === item.system.location) + 1) % 5;
  changes.push({ _id: itemId, "system.location": FT.item.inventory.locations[movedTo] });

  // If it's a container, also move its contents
  if (item.system.isContainer) {
    actor.items.forEach((i) => {
      if (i.system.container === itemId)
        changes.push({ _id: i._id, "system.location": FT.item.inventory.locations[movedTo] });
    });
  }

  actor.updateEmbeddedDocuments("Item", changes);
}

/**
 * Handle activation of item "use"
 * @param {Event} event   The originating click event
 */
// export function onUseItem(event) {
//   event.preventDefault();
//   const element = $(event?.currentTarget);
//   const { shiftKey, ctrlKey, altKey } = event;
//   let itemId = element?.closest("[data-item-id]").data("itemId");
//   if (itemId) {
//     const item = this.actor.getEmbeddedDocument("Item", itemId);
//     item?.use();
//   }
// }

/**
 * Handle activation of item "chat"
 * @param {Event} event   The originating click event
 */
// export function onChatItem(event) {
//   event.preventDefault();
//   const element = $(event?.currentTarget);
//   const { shiftKey, ctrlKey, altKey } = event;
//   let itemId = element?.closest("[data-item-id]").data("itemId");
//   if (itemId) {
//     const item = this.actor.getEmbeddedDocument("Item", itemId);
//     item?.chat();
//   }
// }
