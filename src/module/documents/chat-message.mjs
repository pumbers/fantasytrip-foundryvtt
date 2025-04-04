import * as Action from "../system/action.mjs";

export class FTChatMessage extends ChatMessage {}

/**
 * Hook into chat message rendering to add listeners for damage buttons.
 */
Hooks.on("renderChatMessage", async (chatMessage, html, messageData) => {
  html.find("[data-ft-action='damage-roll']").click(onDamageRoll.bind(chatMessage));
  html.find("[data-ft-action='apply-damage']").click(onApplyDamage.bind(chatMessage));

  // Hide restricted elements (like buttons)
  html.find(".ft-restricted").hide();

  // Then show them again if they are marked for the GM or a specific user
  if (game.user.isGM) html.find(".ft-show-gm").show();
  html.find(`.ft-show-${game.user.id}`).show();
});

/**
 * Collect damage roll parameters and evaluate the roll.
 *
 * @param {Event} event
 */
const onDamageRoll = async (event) => {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const dataset = element?.data();

  const actor = game.actors.tokens[dataset.tokenId] ?? game.actors.get(dataset.actorId);
  const item = actor.items.get(dataset.itemId);
  const attackIndex = dataset.attackIndex;
  const multiplier = dataset.multiplier;

  Action.damageRoll(actor, item, { attackIndex, multiplier });
};

/**
 * Collect damage parameters and apply them to a target actor.
 *
 * @param {Event} event
 */
const onApplyDamage = async (event) => {
  event.preventDefault();
  const element = $(event?.currentTarget);
  const dataset = element?.data();
  const actor = game.actors.tokens[dataset.tokenId] ?? game.actors.get(dataset.actorId);

  if (!actor) {
    ui.notifications.warn(game.i18n.format("FT.system.combat.notification.notActive", { name: dataset.tokenName }));
    return;
  }

  Action.applyDamage(actor, dataset.damage);
};
