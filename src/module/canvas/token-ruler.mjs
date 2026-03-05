import { FT } from "../system/config.mjs";

export class FTTokenRuler extends foundry.canvas.placeables.tokens.TokenRuler {
  static applyFTMovementConfig() {
    foundry.utils.mergeObject(
      CONFIG.Token.movement.actions,
      {
        walk: {
          canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
        },
        fly: {
          canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
        },
        swim: {
          canSelect: (token) => !(token instanceof TokenDocument) || !token.hasStatusEffect("prone"),
        },
        "-=burrow": null,
        "-=crawl": null,
        "-=climb": null,
        "-=jump": null,
        "-=blink": null,
      },
      { performDeletions: true },
    );
  }

  _getSegmentStyle(waypoint) {
    const style = super._getSegmentStyle(waypoint);
    this.#getMovementStyle(style, waypoint);
    return style;
  }

  _getGridHighlightStyle(waypoint, offset) {
    const style = super._getGridHighlightStyle(waypoint, offset);
    this.#getMovementStyle(style, waypoint);
    return style;
  }

  #getMovementStyle(style, waypoint) {
    const RED = 0xff0000,
      GREEN = 0x32cd32,
      FEET_PER_MA = 4;
    const mode = foundry.utils.getProperty(this, `token.document.actor.system.ma.mode`) ?? "walk";
    const ma = foundry.utils.getProperty(this, `token.document.actor.system.ma.${mode}.value`) ?? Infinity;
    style.color = waypoint.measurement.cost <= ma * FEET_PER_MA ? GREEN : RED;
  }
}
