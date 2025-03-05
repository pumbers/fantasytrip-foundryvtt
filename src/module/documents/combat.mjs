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

Hooks.on("renderCombatTracker", async (app, html, data) => {
  // console.log("Hooks.renderCombatTracker", "app", app, "html", html, "data", data);
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
});

Hooks.on("combatStart", function (combat, updateData) {
  // Set the initial combat phase
  updateData.system = { phase: "movement" };
  // console.log("Hooks.combatStart", "combat", combat, "updateData", updateData);
});

Hooks.on("combatRound", (combat, updateData, updateOptions) => {
  // Siwch the combat phase
  updateData["system.phase"] = combat.system.phase === "movement" ? "combat" : "movement";
  // console.log("Hooks.combatRound", "combat", combat, "updateData", updateData, "updateOptions", updateOptions);
});

Hooks.on("FT.getInitiativeRoll", (combat, combatant, data) => {
  // console.log("Hooks.getInitiativeRoll", "combatant", combatant, "actor", combatant.actor);

  // Party is either...
  // ... Other PC's if combatant is a PC
  // ... Other NPC's of the same Actor name (ie NPC type) if combatant is an NPC
  const party = combat.combatants
    .filter((c) => !c.isDefeated)
    .filter(
      (c) => (!combatant.isNPC && !c.isNPC) || (combatant.isNPC && c.isNPC && c.actor.name === combatant.actor.name)
    );

  // Party bonus is the highest party bonus from all party members
  const partyBonus = Math.max(...party.map((c) => c.actor.system.initiative.party));

  // Return the formula
  let formula = `1d6+@initiative.situation+@initiative.self+${partyBonus}+(1d6/10)+(1d6/100)`;
  console.log("Hooks.getInitiativeRoll", "party", party.map((c) => c.name).join(","), "formula", formula);
  data.formula = combat.system.phase === "combat" ? `@dx.value+${(combatant.initiative ?? 0) / 10}` : formula;
});

/**
 * Extend the Combatant class to add initiative modifications
 */
export class FTCombatant extends Combatant {
  /**
   * Override to call a Hook when rolling for initiative
   *
   * @param {String} formula
   * @returns {String} formula based on combat phase
   */
  getInitiativeRoll(formula) {
    const data = {};
    Hooks.callAll("FT.getInitiativeRoll", this.parent, this, data);
    return super.getInitiativeRoll(data.formula);
  }
}
