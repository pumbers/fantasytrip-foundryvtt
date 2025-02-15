const { SchemaField, NumberField, StringField, HTMLField, ArrayField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Character Data Type                       
/* -------------------------------------------- */

export class FTCharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      type: new StringField({ initial: "hero" }),
      race: new StringField({ initial: "human" }),
      gender: new StringField(),
      //
      st: new SchemaField({
        bonus: new NumberField({ initial: 0 }),
        min: new NumberField({ initial: 0 }),
        max: new NumberField({ initial: 8 }),
        value: new NumberField({ initial: 8 }),
      }),
      dx: new SchemaField({
        bonus: new NumberField({ initial: 0 }),
        min: new NumberField({ initial: 0 }),
        max: new NumberField({ initial: 8 }),
        value: new NumberField({ initial: 8 }),
      }),
      iq: new SchemaField({
        bonus: new NumberField({ initial: 0 }),
        min: new NumberField({ initial: 0 }),
        max: new NumberField({ initial: 8 }),
        value: new NumberField({ initial: 8 }),
      }),
      ma: new SchemaField({
        bonus: new NumberField({ initial: 0 }),
        min: new NumberField({ initial: 0 }),
        max: new NumberField({ initial: 10 }),
        value: new NumberField({ initial: 10 }),
      }),
      //
      xp: new NumberField({ initial: 0 }),
      //
      job: new SchemaField({
        name: new StringField(),
        pay: new NumberField({ initial: 0 }),
        risk: new SchemaField({ low: new NumberField({ initial: 3 }), high: new NumberField({ initial: 18 }) }),
      }),
      //
      notes: new HTMLField(),
      //
      fatigue: new NumberField({ initial: 0 }),
      damage: new NumberField({ initial: 0 }),
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    // console.log("FTCharacterData.prepareDerivedData()", this);

    // Calculate attribute points
    const { st, dx, iq } = this;
    this.ap = [st, dx, iq].reduce((ap, attribute) => ap + attribute.max, 0);

    // Calculate Adjusted Attribute Values
    this.st.value = Math.max(this.st.max + this.st.bonus - this.damage - this.fatigue, 0);
    this.dx.value = Math.max(this.dx.max + this.dx.bonus, 0);
    this.iq.value = Math.max(this.iq.max + this.iq.bonus, 0);
    this.ma.value = Math.max(this.ma.max + this.ma.bonus, 0);
  }
}
