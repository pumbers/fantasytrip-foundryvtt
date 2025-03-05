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

Hooks.on("Hooks.combatStart", function (combat, updateData) {
  updateData.system = { phase: "movement" };
});

Hooks.on("Hooks.combatRound", function (combat, updateData, updateOptions) {
  updateData["system.phase"] = combat.system.phase === "movement" ? "combat" : "movement";
});

Hooks.on("FT.initiativeRoll", function (combat, combatant, data) {
  const party = combat.combatants.filter((c) => !c.isDefeated).filter((c) => c.isNPC === combatant.isNPC);
  const partyBonus = Math.max(...party.map((c) => c.actor.system.initiative.party));
  data.formula =
    combat.system.phase === "combat"
      ? `@dx.value+${(combatant.initiative ?? 0) / 10}`
      : `1d6+@initiative.situation+@initiative.self+${partyBonus}+(1d6/10)+(1d6/100)`;
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
    const data = {};
    Hooks.callAll("FT.initiativeRoll", this.parent, this, data);
    return super.getInitiativeRoll(data.formula);
  }
}
