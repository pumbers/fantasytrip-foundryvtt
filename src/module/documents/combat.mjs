import { FT } from "../system/config.mjs";

// TODO Situational initiative bonuses
// TODO Bonuses for character tactics & strategy
// TODO Check behaviour with skipDefeated turned on
// TODO Individual or group initiative

/**
 * Combat sequence is...
 *
 *  Create:
 *    prepareDerivedData()
 *
 *  Add combatants:
 *    prepareDerivedData()
 *    setupTurns()
 *
 *  Roll first initiative:
 *    A rollAll()
 *    A getInitiativeRoll()
 *    prepareDerivedData()
 *    setupTurns()
 *
 *  Start:
 *    A startCombat()
 *      Hooks.combatStart
 *    prepareDerivedData()
 *    setupTurns()
 *    Hooks.combatTurnChange
 *
 *  Next combatant turn:
 *    nextTurn()
 *      Hooks.combatTurn
 *    prepareDerivedData()
 *    Hooks.combatTurnChange
 *
 *  Next round:
 *    A nextRound()
 *      Hooks.combatRound
 *    prepareDerivedData()
 *    A Combatant.getInitiativeRoll() x # of combatants
 *      prepareDerivedData()
 *      setupTurns()
 *    Hooks.combatTurnChange
 *
 *  End:
 *    endCombat()
 */

Hooks.on("combatStart", function (combat, updateData) {
  updateData.system = { phase: "movement" };
});

Hooks.on("combatRound", function (combat, updateData, updateOptions) {
  // Setup the combat phase and update the Combat and Combatants
  const phase = combat.system.phase === "movement" ? "combat" : "movement";
  updateData["system.phase"] = phase;
  combat.combatants.forEach((c) => c.update({ system: { phase } }));
  // console.log(
  //   "Hooks.combatRound",
  //   "combat",
  //   combat,
  //   "combatants",
  //   combat.combatants,
  //   "system",
  //   combat.system,
  //   "updates",
  //   updateData,
  //   updateOptions
  // );
});

/**
 * Extend the CombatTracker class to add system-specific UI data
 */
export class FTCombatTracker extends CombatTracker {
  /**
   * Override the Combat Tracker to display the Fantasy Trip combat phase
   * (movement or combat) as part of the round number header.
   *
   * @inheritdoc
   * @override
   */
  async _renderInner(data) {
    const html = await super._renderInner(data);
    if (data.combat?.round) {
      // Change round header to reflect phase
      html
        .find("h3.encounter-title")
        .append(
          data.combat?.system?.phase === "movement"
            ? `&nbsp;<a data-action="ft-change-phase" data-phase="combat">${game.i18n.localize(
                "FT.system.combat.phase.movement"
              )}</a>`
            : `&nbsp;<a data-action="ft-change-phase" data-phase="movement">${game.i18n.localize(
                "FT.system.combat.phase.combat"
              )}</a>`
        );
    }
    return html;
  }
}

/**
 * Extend the Combatant class to add initiative switching
 */
export class FTCombatant extends Combatant {
  /**
   * Override to switch initiative formula depending on combat phase
   *
   * @param {String} formula
   * @returns {String} formula based on combat phase
   */
  getInitiativeRoll(formula) {
    // console.log("Combatant.getInitiativeRoll()", "combatant", this.toObject(), "formula", formula);
    return super.getInitiativeRoll(
      this.system.phase === "combat" ? `@dx.value+${this.initiative / 10}` : FT.combat.initiative.formula
    );
  }
}
