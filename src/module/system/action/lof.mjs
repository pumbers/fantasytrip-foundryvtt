import { determineRollResult } from "./rollResults.mjs";
import { FT } from "../config.mjs";

/**
 * Determine line of fire for thrown & missile weapons
 *
 * @param {Actor} actor
 * @param {Object} attack
 * @returns {Array[Object]}
 */
export function determineLoF(actor, attack) {
  if (
    game.settings.get(FT.id, "resolveLoF") &&
    canvas.grid.isHexagonal &&
    (attack.type === "missile" || attack.type === "thrown")
  ) {
    if (game.user.targets.size > 1) {
      ui.notifications.warn("FT.game.message.lofWarning", {
        localize: true,
      });
      return [];
    }

    // Pick the first target
    const [target] = game.user.targets;
    if (target) {
      // Find the direct path from the attacking actor to the target
      const from = actor.token.getSnappedPosition();
      const to = target.getSnappedPosition();
      const path = game.canvas.grid.getDirectPath([
        { i: 0, j: 0, ...canvas.grid.getOffset(from), k: 0 },
        { i: 0, j: 0, ...canvas.grid.getOffset(to), k: 0 },
      ]);

      // Remove the attacking actor and target from the path
      path.shift();
      path.pop();

      // Find which tokens fall in that path and set the line of fire
      const tokens = canvas.tokens.getDocuments().map((token) => ({
        _id: token._id,
        name: token.name,
        disposition: token.disposition,
        position: canvas.grid.getOffset(token.getSnappedPosition()),
      }));

      return path
        .map((hex) => tokens.find((token) => hex.i === token.position.i && hex.j === token.position.j))
        .filter((token) => token);
    }
  } else {
    return [];
  }
}

/**
 * Resolve misses for any tokens in line of fire
 *
 * @param {Actor} actor
 * @param {Object} attack
 * @param {Number} dice
 * @param {Array[Token]} lof
 */
export async function resolveLoF(
  actor,
  item,
  attack,
  dice,
  attributes,
  totalAttributes,
  modifiers,
  totalModifiers,
  lof,
) {
  for (const token of lof) {
    const lofRoll = await new Roll(`${dice}D6`).evaluate();
    const lofResult = ["failure", "criticalFailure"].includes(
      determineRollResult(dice, totalAttributes + totalModifiers, lofRoll),
    )
      ? "hit"
      : "miss";
    const lofTarget = token.disposition < CONST.TOKEN_DISPOSITIONS.NEUTRAL ? "hostile" : "friendly";

    foundry.applications.handlebars
      .renderTemplate(`${FT.path}/templates/chat/lof-roll.hbs`, {
        token,
        roll: lofRoll,
        attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
        totalAttributes,
        modifiers,
        totalModifiers,
        targetNumber: totalAttributes + totalModifiers,
        parts: lofRoll.dice.map((d) => d.getTooltipData()),
        result: lofResult,
        damage:
          lofResult === "hit" && lofTarget === "friendly"
            ? (await new Roll(`max(${attack.baseDamage},0)`).evaluate()).total
            : undefined,
      })
      .then((content) => {
        lofRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: game.i18n.format(`FT.system.roll.flavor.lof.${attack.type}`, {
            item: item.name,
            result: game.i18n.format(`FT.system.roll.result.lof.${attack.type}.${lofResult}.${lofTarget}`, {
              name: token.name,
            }),
          }),
          content,
        });
      });

    // If we got a hit, stop there
    if (lofResult === "hit") return true;
  }

  // LoF check did not hit any collateral targets
  return false;
}
