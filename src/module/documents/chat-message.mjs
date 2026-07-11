import { FT } from "../system/config.mjs";
import * as Action from "../system/action/_module.mjs";

export class FTChatMessage extends ChatMessage {}

/**
 * Hook into chat message rendering to add listeners for damage buttons.
 */
Hooks.on("renderChatMessageHTML", async (chatMessage, html, messageData) => {
  html
    .querySelectorAll("[data-ft-action='damageRoll']")
    .forEach((e) => e.addEventListener("click", onDamageRoll.bind(chatMessage)));
  html
    .querySelectorAll("[data-ft-action='applyDamage']")
    .forEach((e) => e.addEventListener("click", onApplyDamage.bind(chatMessage)));
  // Hide restricted elements (like buttons)
  html.querySelectorAll(".ft-restricted").forEach((e) => (e.style.display = "none"));
  // Then show them again if they are marked for the GM or a specific use
  if (game.user.isGM) html.querySelectorAll(".ft-show-gm").forEach((e) => (e.style.display = "block"));
  html.querySelectorAll(`.ft-show-${game.user.id}`).forEach((e) => (e.style.display = "block"));
});

/**
 * Collect damage roll parameters and evaluate the roll.
 */
const onDamageRoll = async (event) => {
  // console.log("onDamageRoll()", event.target.dataset);
  const dataset = event.target.dataset;
  const item = await foundry.utils.fromUuid(dataset.itemUuid);
  if (!item)
    return ui.notifications.error("FT.system.error.noItem", { localize: true, format: { itemId: dataset.itemUuid } });
  const actor = game.actors.tokens[dataset.tokenId] ?? game.actors.get(dataset.actorId);
  if (!actor)
    return ui.notifications.error("FT.system.error.noActor", {
      localize: true,
      format: { actorId: game.actors.tokens[dataset.tokenId] ?? game.actors.get(dataset.actorId) },
    });
  Action.damageRoll(actor, item, event.target.dataset);
};

/**
 * Collect damage parameters and apply them to a target actor.
 */
const onApplyDamage = async (event) => {
  // console.log("onApplyDamage()", event.target.dataset);
  const dataset = event.target.dataset;
  const actor = game.actors.tokens[dataset.tokenId] ?? game.actors.get(dataset.actorId);
  if (!actor)
    return ui.notifications.error("FT.system.error.noActor", {
      localize: true,
      format: { actorId: game.actors.tokens[dataset.tokenId] ?? game.actors.get(dataset.actorId) },
    });
  Action.applyDamage(actor, dataset.damage);
};
