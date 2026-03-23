import { FT } from "../config.mjs";
import { FTDiceRollerApp } from "../../applications/dice-roller.mjs";
import { extractRollParameters, determineRollResult } from "./rollResults.mjs";

const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Make an Attribute Roll for the specified Actor.
 *
 * @param {Actor} actor
 * @param {Object} options
 */
export default function attributeRoll(actor, options) {
  // console.log("Action.attributeRoll()", actor, options);
  const attribute = options.attribute.split(".")[0];
  const saveMod = actor.system[attribute].modFor.save;

  const context = {
    //
    force: true,
    //
    type: "save",
    dice: 3,
    actor,
    attribute: options.attribute,
    modifiers: {
      ...(saveMod !== 0
        ? {
            saveMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: saveMod,
            },
          }
        : {}),
    },
    //
    submit: (data) => {
      // console.log("Action.attributeRoll().submit()", "data", data);
      // Extract roll parameters
      const { actor, dice, attributes, totalAttributes, modifiers, totalModifiers, rollMode } =
        extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      new Roll(`${dice}D6`).evaluate().then(async (roll) => {
        // Determine roll result and margin of success/failure
        const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
        const margin = totalAttributes + totalModifiers - roll.total;

        // Create a chat message for the result
        const message = game.i18n.format(`FT.system.roll.flavor.attribute.${Math.floor(Math.random() * 6)}`, {
          attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
          result: game.i18n.format(`FT.system.roll.result.${result}`, {
            margin: Math.abs(margin),
          }),
        });

        const content = await foundry.applications.handlebars.renderTemplate(
          `${FT.path}/templates/chat/dice-roll.hbs`,
          {
            actor,
            attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
            totalAttributes,
            modifiers,
            totalModifiers,
            targetNumber: totalAttributes + totalModifiers,
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
          { rollMode },
        );
      });
    },
  };

  DICE_ROLLER.render(context);
}
