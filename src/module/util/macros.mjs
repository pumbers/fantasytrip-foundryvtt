/**
 * Hotbar Macro Utilities
 * @module macros
 */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
export async function createHotbarMacro(data, slot) {
  if (data.type === "Item") {
    // Check to make sure the item is owned
    if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
      return ui.notifications.warn(game.i18n.localize("FT.messages.createHotbarMacroItemNotOwned"));
    }

    // Retrieve the item from dropped data
    const item = await Item.fromDropData(data);

    // Create the macro command
    let command = `game.${game.data.system.id}.useItemMacro("${item._id}");`;
    let macro = game.macros.find((m) => m.command === command);
    if (!macro) {
      macro = await Macro.create({
        name: item.name,
        type: "script",
        img: item.img,
        command: command,
        flags: { [`${game.data.system.id}.itemMacro`]: true },
      });
    }

    // Drop it in the hotbar
    game.user.assignHotbarMacro(macro, slot);
    return false;
  }
}

/**
 * Execute an item macro
 * @param {string} itemId
 * @return {Promise}
 */
export function useItemMacro(itemId) {
  // Construct some dummy drop data
  const dropData = {
    type: "Item",
    id: itemId,
  };

  // Use the drop data to retrieve the item
  Item.fromDropData(dropData).then((item) => {
    // Check that the item is still owned
    if (!item ?? !item.parent) {
      // const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(game.i18n.localize("FT.messages.useItemMacroItemNotOwned"));
    }

    // Call the use() function on the item
    item.use();
  });
}
