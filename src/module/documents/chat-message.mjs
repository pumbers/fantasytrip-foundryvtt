import * as Action from "../system/action.mjs";

export class FTChatMessage extends ChatMessage {}

/**
 * Hook into chat message rendering to add listeners for damage buttons.
 */
Hooks.on("renderChatMessageHTML", async (chatMessage, html, messageData) => {
  html
    .querySelectorAll("[data-ft-action='damage-roll']")
    .forEach((e) => e.addEventListener("click", onDamageRoll.bind(chatMessage)));
  html
    .querySelectorAll("[data-ft-action='apply-damage']")
    .forEach((e) => e.addEventListener("click", onApplyDamage.bind(chatMessage)));
  // Hide restricted elements (like buttons)
  html.querySelectorAll(".ft-restricted").forEach((e) => (e.style.display = "none"));
  // Then show them again if they are marked for the GM or a specific use
  if (game.user.isGM) html.querySelectorAll(".ft-show-gm").forEach((e) => (e.style.display = "block"));
  html.querySelectorAll(`.ft-show-${game.user.id}`).forEach((e) => (e.style.display = "block"));
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
