import { FT } from "../system/config.mjs";
const { SchemaField, NumberField, StringField, HTMLField, BooleanField } = foundry.data.fields;

/**
 * Fantasy Trip Actor Data Model
 */
export class FTActorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      type: new StringField({ initial: "hero" }),
      race: new StringField({ initial: "Human" }),
      age: new NumberField({ initial: 18 }),
      job: new SchemaField({
        name: new StringField(),
        pay: new NumberField({ initial: 0 }),
        risk: new SchemaField({ low: new NumberField({ initial: 3 }), high: new NumberField({ initial: 18 }) }),
      }),
      xp: new NumberField({ initial: 0 }),
      notes: new HTMLField(),
      //
      st: new SchemaField({
        max: new NumberField({ initial: 8 }), // Maximum or base value
        mod: new NumberField({ initial: 0 }), // Manually set modifier
        value: new NumberField({ initial: 8 }), // Current or adjusted value
        modFor: new SchemaField({
          save: new NumberField({ initial: 0 }), // Modifier to save rolls
          damage: new NumberField({ initial: 0 }), // Modifier to damage done
        }),
      }),
      dx: new SchemaField({
        max: new NumberField({ initial: 8 }), // Maximum or base value
        mod: new NumberField({ initial: 0 }), // Manually set modifier
        value: new NumberField({ initial: 8 }), // Current or adjusted value
        modFor: new SchemaField({
          save: new NumberField({ initial: 0 }), // Modifier to save rolls
          hth: new NumberField({ initial: 0 }), // Modifier to HTH attacks
          natural: new NumberField({ initial: 0 }), // Modifier to natural wepon attacks
          melee: new NumberField({ initial: 0 }), // Modifier to melee attacks
          polearm: new NumberField({ initial: 0 }), // Modifier to polearm attacks
          thrown: new NumberField({ initial: 0 }), // Modifier to thrown weapon attacks
          missile: new NumberField({ initial: 0 }), // Modifier to missile weapon attacks
          casting: new NumberField({ initial: 0 }), // Modifier to spell casting
        }),
      }),
      iq: new SchemaField({
        max: new NumberField({ initial: 8 }), // Maximum or base value
        mod: new NumberField({ initial: 0 }), // Manually set modifier
        value: new NumberField({ initial: 8 }), // Current or adjusted value
        modFor: new SchemaField({
          save: new NumberField({ initial: 0 }), // Modifier to save rolls
        }),
      }),
      ma: new SchemaField({
        mode: new StringField({ initial: "walk" }), // Movement type
        walk: new SchemaField({
          max: new NumberField({ initial: 10 }), // Maximum or base value
          mod: new NumberField({ initial: 0 }), // Manually set modifier
          value: new NumberField({ initial: 10 }), // Current or adjusted value
        }),
        swim: new SchemaField({
          max: new NumberField({ initial: 10 }), // Maximum or base value
          mod: new NumberField({ initial: 0 }), // Manually set modifier
          value: new NumberField({ initial: 10 }), // Current or adjusted value
        }),
        fly: new SchemaField({
          max: new NumberField({ initial: 0 }), // Maximum or base value
          mod: new NumberField({ initial: 0 }), // Manually set modifier
          value: new NumberField({ initial: 0 }), // Current or adjusted value
        }),
      }),
      //
      initiative: new SchemaField({
        situation: new NumberField({ initial: 0 }),
        self: new NumberField({ initial: 0 }),
        party: new NumberField({ initial: 0 }),
      }), // Initiative modifiers
      fatigue: new NumberField({ initial: 0 }), // Fatigue accrued
      damage: new NumberField({ initial: 0 }), // Damage taken
      mana: new SchemaField({
        max: new NumberField({ initial: 0 }), // Maximum or base value
        value: new NumberField({ initial: 0 }), // Current value
      }),
    };
  }

  prepareBaseData() {
    super.prepareBaseData();
    // console.log("FTActorData.prepareDerivedData()", this);

    // Calculate attribute points
    const { st, dx, iq } = this;
    this.ap = [st, dx, iq].reduce((ap, attribute) => ap + attribute.max, 0);

    // Calculate Adjusted Attribute Values
    this.st.value = this.st.max + this.st.mod - this.damage - this.fatigue;
    this.dx.value = Math.max(this.dx.max + this.dx.mod, 0);
    this.iq.value = Math.max(this.iq.max + this.iq.mod, 0);
    Object.keys(FT.actor.ma.modes).forEach((mode) => {
      this.ma[mode].value = Math.max(this.ma[mode].max + this.ma[mode].mod, 0);
    });
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // Calculate available mana (from staff if a wizard)
    this.mana.value = Math.min(this.mana.max, this.mana.value);
    this.mana.used = Math.max(this.mana.max - this.mana.value, 0);
  }

  get currentMA() {
    return this.ma[this.ma.mode];
  }

  get isTired() {
    return this.fatigue > 0;
  }

  get isHurt() {
    return this.damage > 0;
  }

  get isDown() {
    return this.damage + this.fatigue >= this.st.max;
  }

  get isDead() {
    return this.damage > this.st.max;
  }
}
