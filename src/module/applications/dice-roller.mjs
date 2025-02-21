import { FT } from "../system/config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FTDiceRollerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ft-dice-roller",
    classes: ["fantasy-trip", "dice-roller"],
    tag: "form",
    window: {
      title: "Dice Roller",
      icon: "fa fa-dice",
      resizable: true,
    },
    form: {
      handler: FTDiceRollerApp.onSubmit,
      cancellable: true,
      submitOnChange: false,
      closeOnSubmit: false,
    },
  };

  static PARTS = {
    form: {
      template: `systems/fantasytrip/templates/application/dice-roller.hbs`,
    },
  };

  #defaultOptions = {
    type: "success",
    dice: 3,
    modifiers: { manual: 0 },
    rollMode: "roll",
  };

  static #context = {};

  async _prepareContext(options) {
    console.log("FTDiceRollerApp._prepareContext()", "options", options);
    FTDiceRollerApp.#context = {
      ...foundry.utils.mergeObject(this.#defaultOptions, options, { recursive: true }),
      FT: CONFIG.FT,
    };
    return FTDiceRollerApp.#context;
  }

  static onSubmit(event, form, formData) {
    console.log("FTDiceRollerApp.onSubmit()", "action", event.submitter?.value, "formData", formData);

    const data = foundry.utils.expandObject(Object.fromEntries(formData));
    data.dice = parseInt(data.dice);
    Object.entries(data.modifiers).forEach(([key, value]) => (data.modifiers[key] = parseInt(value)));

    if (event.submitter?.value === "submit") {
      return FTDiceRollerApp.#context.submit?.(
        foundry.utils.mergeObject(FTDiceRollerApp.#context, data, {
          recursive: true,
        })
      );
    } else if (event.submitter?.value === "cancel") {
      this.close();
    }
  }
}
