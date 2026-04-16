import { FT } from "../config.mjs";
import { FTDiceRollerApp } from "../../applications/dice-roller.mjs";
import { extractRollParameters, determineRollResult } from "./rollResults.mjs";

const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Make a Damage Roll for the specified Actor & attack
 *
 * @param {Actor} actor
 * @param {Item} item
 * @param {Object} options
 */
export default function damageRoll(actor, item, options = {}) {
  // console.log("Action.damageRoll()", "actor", actor, "item", item, "options", options);
  const attack = item.system.attacks[options.attackIndex ?? 0];

  // Create a damage roll
  const context = {
    force: true,
    //
    type: "damage",
    actor,
    item,
    formula: attack.damage,
    minimum: options.minimum ?? 0,
    multiplier: options.multiplier ?? 1,
    damageMultiplierStrategy:
      item.type === "spell" ? "rollTimes" : game.settings.get(FT.id, "damageMultiplierStrategy"),
    submit: (data) => {
      // console.log("Action.damageRoll().submit()", "data", data);
      // Extract roll parameters
      const { actor, formula, minimum, multiplier, damageMultiplierStrategy, messageMode } =
        extractRollParameters(data);

      // Build a damage formula
      const finalFormula =
        damageMultiplierStrategy === "rollTimes"
          ? "max(" + new Array(multiplier ?? 1).fill(`max(${formula},0)`).join("+") + `,${minimum})`
          : `max(max(${formula},0)*${multiplier ?? 1},${minimum ?? 0})`;

      // Roll and generate a chat message for each target
      if (!!game.user.targets.size) {
        game.user.targets.forEach(async (token) => {
          // Create & evaluate a roll based on the set parameters
          const roll = await new Roll(finalFormula).evaluate();

          // Create a chat message for the result
          const message = game.i18n.format(`FT.system.roll.flavor.damage.${Math.floor(Math.random() * 6)}`, {
            name: token.name,
            effects: attack.effects,
            total: roll.total,
          });

          const content = await foundry.applications.handlebars.renderTemplate(
            `${FT.path}/templates/chat/damage-roll.hbs`,
            {
              token,
              actor: token.actor,
              roll,
              parts: roll.dice.map((d) => d.getTooltipData()),
            },
          );

          roll.toMessage(
            {
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: message,
              content,
            },
            { messageMode },
          );
        });
      } else {
        // If no targets, just roll
        new Roll(finalFormula).evaluate().then((roll) => {
          roll.toMessage(
            {
              speaker: ChatMessage.getSpeaker({ actor }),
              flavor: game.i18n.format(`FT.system.roll.flavor.damage.${Math.floor(Math.random() * 6)}`, {
                item: item.name,
                total: roll.total,
                effects: attack.effects,
              }),
            },
            { messageMode },
          );
        });
      }
    },
  };

  DICE_ROLLER.render(context);
}
