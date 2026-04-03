import { FT } from "../config.mjs";

/**
 * Extract roll parameters from the dice roller form.
 *
 * @param {FormData} data
 * @returns
 */
export function extractRollParameters(data) {
  const attributes = JSON.parse(data.attributes ?? "[]").filter((a) => !!a);
  const totalAttributes = attributes.reduce(
    (total, attribute) => total + foundry.utils.getProperty(data.actor.getRollData(), attribute),
    0,
  );
  const totalModifiers = Object.values(data.modifiers ?? []).reduce((total, modifier) => total + parseInt(modifier), 0);
  if (data.cost) data.cost.st.value = parseInt(data.cost.st.value ?? 0);

  console.log("LOF", data.lof);

  const lof = Object.entries(data.lof ?? {})
    .filter(([_id, value]) => value === "true")
    .map(([_id, _]) => canvas.tokens.viewedDocuments().find((token) => token._id === _id));

  return {
    ...data,
    multiplier: parseInt(data.multiplier ?? 0),
    attributes,
    totalAttributes,
    totalModifiers,
    lof,
  };
}
/**
 * Determine the result (level of success) of a dice roll.
 *
 * @param {Number} dice Number of dice rolled
 * @param {Number} target Target number
 * @param {Roll} evaluated roll The Foundry dice roll (with results)
 * @returns
 */
export function determineRollResult(dice, target, roll) {
  if (roll.total === target) return "exact";

  if (game.settings.get(FT.id, "failureRollResults") === "classic") {
    // Dice roll failure levels as per classic rules
    switch (dice) {
      case 1:
        return "automaticSuccess";
      case 2:
        if (roll.total === 2) return "automaticSuccess";
        if (roll.total === 12) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 3:
        if (roll.total <= 5) return "automaticSuccess";
        if (roll.total >= 16) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 4:
        if (roll.total <= 8) return "automaticSuccess";
        if (roll.total >= 20) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 5:
        if (roll.total <= 11) return "automaticSuccess";
        if (roll.total >= 22) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 6:
        if (roll.total <= 14) return "automaticSuccess";
        if (roll.total >= 24) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 7:
        if (roll.total <= 17) return "automaticSuccess";
        if (roll.total >= 26) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 8:
        if (roll.total <= 20) return "automaticSuccess";
        if (roll.total >= 28) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      default:
        console.error(FT.prefix, "Incorrect number of dice rolled", dice);
        break;
    }
  } else {
    // Dice roll failure levels as per classic rules
    switch (dice) {
      case 1:
        return "automaticSuccess";
      case 2:
        if (roll.total === 2) return "automaticSuccess";
        if (roll.total === 12) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 3:
        if (roll.total <= 5) return "automaticSuccess";
        if (roll.total >= 16) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 4:
        if (roll.total <= 8) return "automaticSuccess";
        if (roll.total >= 20) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 5:
        if (roll.total <= 11) return "automaticSuccess";
        if (roll.total >= 24) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 6:
        if (roll.total <= 14) return "automaticSuccess";
        if (roll.total >= 28) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 7:
        if (roll.total <= 17) return "automaticSuccess";
        if (roll.total >= 32) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      case 8:
        if (roll.total <= 20) return "automaticSuccess";
        if (roll.total >= 36) return "criticalFailure";
        return roll.total <= target ? "success" : "failure";
      default:
        console.error(FT.prefix, "Incorrect number of dice rolled", dice);
        break;
    }
  }
}
