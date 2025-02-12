import * as Handlers from "../util/handlers.mjs";

/**
 * Fantasy Trip Character Sheet
 * @extends {ActorSheet} Extends the basic ActorSheet
 */
export class FTCharacterSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["fantasy-trip", "character", "sheet"],
      template: `${CONFIG.FT.path}/templates/sheets/character-sheet.hbs`,
      width: 400,
      height: 550,
      tabs: [
        {
          navSelector: ".sheet-tabs",
          contentSelector: ".sheet-body",
          initial: "stats",
        },
      ],
      dragDrop: [{ dragSelector: ".item[draggable='true']" }],
    });
  }

  /* ------------------------------------------- */
  /*  Sheet Data Preparation                     */
  /* ------------------------------------------- */

  /** @override */
  async getData() {
    // console.log("character-sheet.getData()", this);
    const context = {
      ...super.getData(),
      FT: CONFIG.FT,
      actor: foundry.utils.deepClone(this.actor),
      system: foundry.utils.deepClone(this.actor.system),
      flags: foundry.utils.deepClone(this.actor.flags),
      settings: {
        showItemIcons: game.settings.get("fantasytrip", "showItemIcons"),
      },
    };

    context.organizedItems = context.actor.items.reduce(
      (slots, item) => {
        switch (item.type) {
          case "talent":
            break;
          case "item":
            break;
          case "weapon":
            break;
          case "armor":
            break;
          case "spell":
            break;
          default:
            break;
        }
        slots[item.type].push(item);
        return slots;
      },
      {
        talent: [],
        item: [],
        weapon: [],
        armor: [],
        spell: [],
      }
    );

    // Prepare active effects
    context.effects = Array.from(this.actor.allApplicableEffects());

    return context;
  }

  /* ------------------------------------------- */
  /*  Sheet Listeners & Handlers                 */
  /* ------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    // Sheet Actions
    html.find(".clickable").click(this.click.bind(this));

    // Item actions
    html.find(".document-set-field").click(Handlers.onSetItemField.bind(this));
    html.find(".document-chat").click(Handlers.onChatItem.bind(this));
    html.find(".document-edit").click(Handlers.onItemEdit.bind(this));
    html.find(".document-delete").click(Handlers.onItemDelete.bind(this));
  }

  click(event) {
    event.preventDefault();
    const element = $(event?.currentTarget);
    const dataset = element?.data();
    const { shiftKey, ctrlKey, altKey } = event;

    switch (dataset.action) {
      default:
        console.error(`FT | Unimplemented clickable action: ${dataset.action}`);
        break;
    }
  }
}
