import { FT } from "../system/config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/*****************************************************************************
 * Dice Roller Application
 *****************************************************************************/

export class FTDiceRollerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * App Setup
   */

  static DEFAULT_OPTIONS = {
    id: "ft-dice-roller",
    classes: [FT.id, "dice-roller"],
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

  /**
   * Data Preparation
   */

  // The current roll (set on each render), used again when the form is submitted
  #context = {};

  async _prepareContext(options) {
    // console.log("FTDiceRollerApp._prepareContext()", "options", options);
    this.#context = {
      ...foundry.utils.mergeObject(
        {
          type: "save",
          dice: 3,
          modifiers: {
            situationMod: {
              min: FT.roll.modifiers.default.min,
              max: FT.roll.modifiers.default.max,
              value: 0,
            },
          },
          messageMode: "ic",
        },
        options,
        { recursive: true },
      ),
      FT: CONFIG.FT,
    };
    // console.log("FTDiceRollerApp._prepareContext()", "#context", this.#context);
    return this.#context;
  }

  /**
   * Action & Utility Functions
   */

  // Called by Foundry with this set to the application instance
  static onSubmit(event, _, formData) {
    // console.log("FTDiceRollerApp.onSubmit()", "action", event.submitter?.value, "formData", formData);

    const data = foundry.utils.expandObject(Object.fromEntries(formData));

    data.dice = parseInt(data.dice ?? 0);
    Object.entries(data.modifiers ?? []).forEach(
      ([key, value]) => (data.modifiers[key] = parseInt(value)),
    );

    if (event.submitter?.value === "submit") {
      return this.#context.submit?.(
        foundry.utils.mergeObject(this.#context, data, {
          recursive: true,
        }),
      );
    }

    this.close();
  }
}

/**
 * The single dice roller shared by all roll actions, so that only one is ever
 * open: starting a new roll re-renders it with that roll's context.
 */
export const DICE_ROLLER = new FTDiceRollerApp();
