import { FT } from "../config.mjs";
import { FTDiceRollerApp } from "../../applications/dice-roller.mjs";
import { extractRollParameters, determineRollResult } from "./rollResults.mjs";

const DICE_ROLLER = new FTDiceRollerApp();

/**
 * Make a Talent Roll for the specified Actor.
 *
 * @param {Actor} actor
 * @param {Item} talent
 * @param {Object} options
 */
export default function talentRoll(actor, talent, options) {
  // console.log("Action.talentRoll()", actor, talent, options);
  const context = {
    force: true,
    //
    type: "talent",
    dice: 3,
    actor,
    talent,
    attribute: talent.system.defaultAttribute,
    //
    submit: async (data) => {
      // console.log("Action.talentRoll().submit()", "data", data);
      // Extract roll parameters
      const { actor, talent, dice, attributes, totalAttributes, modifiers, totalModifiers, rollMode } =
        extractRollParameters(data);

      // Create & evaluate a roll based on the set parameters
      const roll = await new Roll(`${dice}D6`).evaluate();

      // Determine roll result and margin of success/failure
      const result = determineRollResult(dice, totalAttributes + totalModifiers, roll);
      const margin = totalAttributes + totalModifiers - roll.total;

      // Create a chat message for the result
      const message = game.i18n.format(`FT.system.roll.flavor.talent.${Math.floor(Math.random() * 6)}`, {
        talent: talent.name,
        result: game.i18n.format(`FT.system.roll.result.${result}`, {
          margin: Math.abs(margin),
        }),
      });

      const content = await foundry.applications.handlebars.renderTemplate(`${FT.path}/templates/chat/dice-roll.hbs`, {
        actor,
        token: actor.getDependentTokens()[0],
        item: talent,
        attributes: attributes.map((a) => game.i18n.localize(`FT.actor.attribute.${a}`)).join("+"),
        totalAttributes,
        modifiers,
        totalModifiers,
        targetNumber: totalAttributes + totalModifiers,
        roll,
        parts: roll.dice.map((d) => d.getTooltipData()),
      });

      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: message,
          content,
        },
        { rollMode },
      );
    },
  };

  DICE_ROLLER.render(context);
}
