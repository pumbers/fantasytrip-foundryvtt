/**
 * Sheet Event Handlers
 * @module handlers
 */

/**
 * Update a field on a character sheet form, usually based on a click event
 * @param {Event} event The originating change event
 */
export function onSetField(event) {
  event.preventDefault();
  const element = $(event.currentTarget);
  const dataset = element.data();
  const field = element?.closest("[data-field]").data("field");

  this.actor?.update({ [field]: value });
}

/**
 * Update a field to a new value
 * @param {Event} event The originating change event
 */
export function onUpdateField(event) {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const dataset = element?.data();
  const actor = this.actor;
  actor.update({
    [dataset.field]: parseInt(element.val),
  });
}

/**
 * Handle creating a new Item for the actor using initial data defined in the HTML dataset
 * @param {Event} event   The originating click event
 */
export function onItemCreate(event) {
  event?.preventDefault();
  const element = $(event?.currentTarget);
  const { name, type, ...system } = element?.data() || {};
  // Prepare the item object.
  foundry.utils.deepClone(system);
  const itemData = {
    name: name || `New ${type.capitalize()}`,
    type,
    system,
  };

  // Finally, create the item!
  return Item.create(itemData, { parent: this.actor });
}

/**
 * Handle editing an item by opening the item sheet
 * @param {Event} event   The originating click event
 */
export function onItemEdit(event) {
  event?.preventDefault();
  const element = $(event.currentTarget);
  const itemId = element?.closest("[data-item-id]").data("itemId");
  if (itemId) {
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    item?.sheet.render(true);
  }
}

/**
 * Handle deleting an item
 * @param {Event} event   The originating click event
 */
export function onItemDelete(event) {
  event?.preventDefault();
  const element = $(event?.currentTarget);
  const itemId = element?.closest("[data-item-id]").data("itemId");
  if (itemId) {
    this.actor.deleteEmbeddedDocuments("Item", [itemId]);
  }
}

/**
 * Update an item field from a character sheet form; usually triggered by an onChange() event from the form.
 * @param {Event} event The originating change event
 */
export function onUpdateItemField(event) {
  event.preventDefault();
  const element = $(event.currentTarget);
  const dataset = element.data();
  const itemId = element?.closest("[data-item-id]").data("itemId");
  if (!itemId) return;

  // Find and update the item
  const item = this.actor.getEmbeddedDocument("Item", itemId);
  item?.update({ [dataset.field]: value }, {});
}

/**
 * Set an item field to a particular value
 * @param {event} event
 * @returns
 */
export function onSetItemField(event) {
  event.preventDefault();
  const element = $(event.currentTarget);
  const dataset = element.data();
  const itemId = element?.closest("[data-item-id]").data("itemId");
  if (!itemId) return;

  // Find and update the item
  const item = this.actor.getEmbeddedDocument("Item", itemId);
  console.log("onSetItemField()", item.name, dataset.field, dataset.value);
  item?.update({ [dataset.field]: dataset.value });
}

/**
 * Update or set/unset an item flag
 * @param {Event} event The originating change event
 */
export function onUpdateItemFlag(event) {
  event?.preventDefault();
  const element = $(event?.currentTarget);
  const dataset = element?.data();
  const itemId = element?.closest("[data-item-id]").data("itemId");
  if (!itemId) return;
  const item = this.actor?.getEmbeddedDocument("Item", itemId);

  switch (dataset?.dtype?.toLowerCase()) {
    case "boolean":
      item?.setFlag(game.data.system.id, dataset.flag, Boolean(dataset.value));
      break;
    case "string":
      item?.setFlag(game.data.system.id, dataset.flag, dataset.value);
      break;
    case "number":
      item?.setFlag(game.data.system.id, dataset.flag, Number(dataset.value));
      break;
    default:
      item?.unsetFlag(game.data.system.id, dataset.flag);
      break;
  }
}

/**
 * Turns active effects for an item on or off
 * @param {Event} event
 */
export function onSetItemEffects(event) {
  event.preventDefault();
  const element = $(event.currentTarget);
  const dataset = element.data();
  const itemId = element?.closest("[data-item-id]").data("itemId");
  if (!itemId) return;

  // Find and update the item effects
  const item = this.actor.getEmbeddedDocument("Item", itemId);
  item?.effects?.values().forEach((effect) => {
    effect?.update({ disabled: dataset.disabled });
  });
}

/**
 * Handle activation of item "use"
 * @param {Event} event   The originating click event
 */
export function onUseItem(event) {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const { shiftKey, ctrlKey, altKey } = event;
  let itemId = element?.closest("[data-item-id]").data("itemId");
  if (itemId) {
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    item?.use();
  }
}

/**
 * Handle activation of item "chat"
 * @param {Event} event   The originating click event
 */
export function onChatItem(event) {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const { shiftKey, ctrlKey, altKey } = event;
  let itemId = element?.closest("[data-item-id]").data("itemId");
  if (itemId) {
    const item = this.actor.getEmbeddedDocument("Item", itemId);
    item?.chat();
  }
}

/**
 * Handle clickable rolls.
 * @param {Event} event   The originating click event
 */
export function onRoll(event) {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const dataset = element?.data();
  const { shiftKey, ctrlKey, altKey } = event;

  if (dataset?.roll) {
    let roll = new Roll(dataset.roll, this.actor.data.data);
    roll.roll().toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: dataset.label ? dataset.label : "Rolling",
      rollMode: shiftKey ? "gmroll" : game.settings.get("core", "rollMode"),
    });
  }
}

/**
 * Handle increment sheet value
 * @param {Event} event   The originating click event
 */
export function onIncrementValue(event) {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const dataset = element?.data();
  const actor = this.actor;
  actor?.update({
    [dataset.value]: Math.min(foundry.utils.getProperty(actor.data, dataset.value) + 1, parseInt(dataset.max) || 20),
  });
}

/**
 * Handle increment sheet value
 * @param {Event} event   The originating click event
 */
export function onDecrementValue(event) {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const dataset = element?.data();
  const actor = this.actor;
  actor?.update({
    [dataset.value]: Math.max(foundry.utils.getProperty(actor.data, dataset.value) - 1, parseInt(dataset.min) || 0),
  });
}
