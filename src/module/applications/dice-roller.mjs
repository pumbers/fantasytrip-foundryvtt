import { FT } from "../system/config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Dice Roller Application
 */
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
      template: `${FT.path}/templates/application/dice-roller.hbs`,
    },
  };

  static #context = {};

  async _prepareContext(options) {
    // console.log("FTDiceRollerApp._prepareContext()", "options", options);
    FTDiceRollerApp.#context = {
      ...foundry.utils.mergeObject(
        {
          type: "save",
          dice: 3,
          modifiers: {
            situationMod: { min: FT.roll.modifiers.default.min, max: FT.roll.modifiers.default.max, value: 0 },
          },
          rollMode: "roll",
        },
        options,
        { recursive: true }
      ),
      FT: CONFIG.FT,
    };
    // console.log("FTDiceRollerApp._prepareContext()", "#context", FTDiceRollerApp.#context);
    return FTDiceRollerApp.#context;
  }

  static onSubmit(event, _, formData) {
    // console.log("FTDiceRollerApp.onSubmit()", "action", event.submitter?.value, "formData", formData);

    const data = foundry.utils.expandObject(Object.fromEntries(formData));

    data.dice = parseInt(data.dice ?? 0);
    Object.entries(data.modifiers ?? []).forEach(([key, value]) => (data.modifiers[key] = parseInt(value)));

    if (event.submitter?.value === "submit") {
      return FTDiceRollerApp.#context.submit?.(
        foundry.utils.mergeObject(FTDiceRollerApp.#context, data, {
          recursive: true,
        })
      );
    }

    this.close();
  }
}
