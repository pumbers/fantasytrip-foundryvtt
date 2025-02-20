import { FT } from "../system/config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class FTDiceRollerApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "ft-dice-roller",
    classes: ["fantasy-trip", "dice-roller"],
    tag: "div",
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
      "select-roll-type": FTDiceRollerApp.onChange,
      "select-attribute": FTDiceRollerApp.onChange,
      "select-dice": FTDiceRollerApp.onChange,
      "select-modifier": FTDiceRollerApp.onChange,
      "select-visibility": FTDiceRollerApp.onChange,
      roll: FTDiceRollerApp.onRoll,
      cancel: FTDiceRollerApp.onCancel,
    },
  };

  static PARTS = {
    div: {
      template: `systems/fantasytrip/templates/application/dice-roller.hbs`,
    },
  };

  static #context = {
    type: "success",
    dice: 3,
    modifier: 0,
    visibility: "roll",
  };

  async _prepareContext(options) {
    console.log("FTDiceRollerApp._prepareContext()", "context", FTDiceRollerApp.#context, "options", options);
    FTDiceRollerApp.#context = { ...FTDiceRollerApp.#context, ...options, FT: CONFIG.FT };
    return FTDiceRollerApp.#context;
  }

  static onChange(event, target) {
    console.log("FTDiceRollerApp.onChange()", event, target, target?.dataset);
    event.preventDefault();
    event.stopPropagation();
    if (event.detail > 1) return; // Ignore repeated clicks
    switch (target?.dataset.action) {
      case "select-dice":
        this.render({ ...target?.dataset, dice: parseInt(target?.dataset.dice ?? 0) });
        break;
      case "select-modifier":
        this.render({ ...target?.dataset, modifier: parseInt(target?.dataset.modifier ?? 0) });
        break;
      default:
        this.render({ ...target?.dataset });
        break;
    }
  }

  static onRoll(event, target) {
    console.log("FTDiceRollerApp.onRoll()", "context", FTDiceRollerApp.#context);

    // TODO critical success & failure
    const { actor, item, attribute, dice, modifier, targets, visibility } = FTDiceRollerApp.#context;
    const formula = `${dice}D6`;
    const roll = new Roll(formula, { actor, item });

    roll.evaluate().then((roll) => {
      roll.toMessage(
        {
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: `Strikes ${targets.map((t) => t.name).join(", ")} with ${item.name}... ${
            roll.total <= foundry.utils.getProperty(actor.getRollData(), attribute) + modifier
              ? "Success!"
              : "and misses"
          }`,
        },
        { rollMode: visibility }
      );
    });
  }

  static onCancel(event, target) {
    console.log("FTDiceRollerApp.onCancel()", "context", FTDiceRollerApp.#context);
    this.close();
  }
}
