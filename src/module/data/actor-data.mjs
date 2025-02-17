const { SchemaField, NumberField, StringField, HTMLField, ArrayField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Character Data Type                       
/* -------------------------------------------- */

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
        min: new NumberField({ initial: 0 }), // Minimum value
        max: new NumberField({ initial: 8 }), // Maximum or base value
        mod: new NumberField({ initial: 0 }), // Manually set modifier
        value: new NumberField({ initial: 8 }), // Current value
        modFor: new SchemaField({
          success: new NumberField({ initial: 0 }), // Modifier to success rolls
          save: new NumberField({ initial: 0 }), // Modifier to save rolls
          damage: new NumberField({ initial: 0 }), // Modifier to damage done
        }),
      }),
      dx: new SchemaField({
        min: new NumberField({ initial: 0 }), // Minimum value
        max: new NumberField({ initial: 8 }), // Maximum or base value
        mod: new NumberField({ initial: 0 }), // Manually set modifier
        value: new NumberField({ initial: 8 }), // Current value
        modFor: new SchemaField({
          success: new NumberField({ initial: 0 }), // Modifier to success rolls
          save: new NumberField({ initial: 0 }), // Modifier to save rolls
          natural: new NumberField({ initial: 0 }), // Modifier to natural wepon attacks
          hth: new NumberField({ initial: 0 }), // Modifier to HTH attacks
          melee: new NumberField({ initial: 0 }), // Modifier to melee attacks
          polearm: new NumberField({ initial: 0 }), // Modifier to polearm attacks
          thrown: new NumberField({ initial: 0 }), // Modifier to thrown weapon attacks
          missile: new NumberField({ initial: 0 }), // Modifier to missile weapon attacks
        }),
      }),
      iq: new SchemaField({
        min: new NumberField({ initial: 0 }), // Minimum value
        max: new NumberField({ initial: 8 }), // Maximum or base value
        mod: new NumberField({ initial: 0 }), // Manually set modifier
        value: new NumberField({ initial: 8 }), // Current value
        modFor: new SchemaField({
          success: new NumberField({ initial: 0 }), // Modifier to success rolls
          save: new NumberField({ initial: 0 }), // Modifier to save rolls
        }),
      }),
      //
      ma: new SchemaField({
        min: new NumberField({ initial: 0 }), // Minimum value
        max: new NumberField({ initial: 10 }), // Maximum or base value
        mod: new NumberField({ initial: 0 }), // Manually set modifier
        value: new NumberField({ initial: 10 }), // Current value
      }),
      //
      initiative: new NumberField({ initial: 0 }), // Initiative modifier
      fatigue: new NumberField({ initial: 0 }), // Fatigue accrued
      damage: new NumberField({ initial: 0 }), // Damage taken
      mana: new SchemaField({
        min: new NumberField({ initial: 0 }), // Minimum value
        max: new NumberField({ initial: 0 }), // Maximum or base value
        value: new NumberField({ initial: 0 }), // Current value
      }),
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    // console.log("FTActorData.prepareDerivedData()", this);

    // Calculate attribute points
    const { st, dx, iq } = this;
    this.ap = [st, dx, iq].reduce((ap, attribute) => ap + attribute.max, 0);

    // Calculate Adjusted Attribute Values
    this.st.value = this.st.max + this.st.mod - this.damage - this.fatigue;
    this.dx.value = Math.max(this.dx.max + this.dx.mod, 0);
    this.iq.value = Math.max(this.iq.max + this.iq.mod, 0);
    this.ma.value = Math.max(this.ma.max + this.ma.mod, 0);

    // Calculate availoable mana (from staff if a wizard)
    this.mana.value = Math.min(this.mana.max, this.mana.value);
    this.mana.used = Math.max(this.mana.max - this.mana.value, 0);
  }
}
