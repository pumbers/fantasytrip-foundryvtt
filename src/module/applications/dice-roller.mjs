const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FTDiceRollerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ft-dice-roller",
    classes: ["fantasy-trip"],
    tag: "form",
    window: {
      title: "Dice Roller",
      icon: "fa fa-dice",
    },
    form: {
      handler: FTDiceRollerApp.formHandler,
      cancellable: true,
      submitOnChange: false,
      closeOnSubmit: false,
    },
    actions: {
      "select-roll-type": FTDiceRollerApp.selectRollType,
      "select-attribute": FTDiceRollerApp.selectAttribute,
      "select-dice": FTDiceRollerApp.selectDice,
      "select-modifier": FTDiceRollerApp.selectModifier,
      "select-visibility": FTDiceRollerApp.selectVisibility,
    },
  };

  static PARTS = {
    form: {
      template: `systems/fantasytrip/templates/application/dice-roller.hbs`,
    },
  };

  async _prepareContext(options) {
    console.log("FTDiceRollerApp._prepareContext()", "options", options);
    const context = { ...(await super._prepareContext(options)), ...options, FT: CONFIG.FT };
    console.log("FTDiceRollerApp._prepareContext()", "context", context);
    return context;
  }

  static selectRollType(event, target) {
    console.log("FTDiceRollerApp.selectRollType()", event, target);
    event.preventDefault();
    event.stopPropagation();
    if (event.detail > 1) return; // Ignore repeated clicks
    console.log("FTDiceRollerApp.selectRollType()", "type", target?.dataset.type);
  }

  static selectAttribute(event, target) {
    console.log("FTDiceRollerApp.selectAttribute()", event, target);
    event.preventDefault();
    event.stopPropagation();
    if (event.detail > 1) return; // Ignore repeated clicks
    console.log("FTDiceRollerApp.selectAttribute()", "attribute", target?.dataset.attribute);
  }

  static selectDice(event, target) {
    console.log("FTDiceRollerApp.selectDice()", event, target);
    event.preventDefault();
    event.stopPropagation();
    if (event.detail > 1) return; // Ignore repeated clicks
    console.log("FTDiceRollerApp.selectDice()", "dice", target?.dataset.dice);
  }

  static selectModifier(event, target) {
    console.log("FTDiceRollerApp.selectModifier()", event, target);
    event.preventDefault();
    event.stopPropagation();
    if (event.detail > 1) return; // Ignore repeated clicks
    console.log("FTDiceRollerApp.selectModifier()", "modifier", target?.dataset.modifier);
  }

  static selectVisibility(event, target) {
    console.log("FTDiceRollerApp.selectVisibility()", event, target);
    event.preventDefault();
    event.stopPropagation();
    if (event.detail > 1) return; // Ignore repeated clicks
    console.log("FTDiceRollerApp.selectVisibility()", "modifier", target?.dataset.visibility);
  }

  /**
   * Process form submission for the sheet
   * @this {MyApplication}                      The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element  that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async formHandler(event, form, formData) {
    console.log("FTDiceRollerApp.formHandler()", event, form, formData);
  }
}
