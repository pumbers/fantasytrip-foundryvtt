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
        min: new NumberField({ initial: 0 }),
        max: new NumberField({ initial: 8 }),
        value: new NumberField({ initial: 8 }),
      }),
      dx: new SchemaField({
        min: new NumberField({ initial: 0 }),
        max: new NumberField({ initial: 8 }),
        value: new NumberField({ initial: 8 }),
      }),
      iq: new SchemaField({
        min: new NumberField({ initial: 0 }),
        max: new NumberField({ initial: 8 }),
        value: new NumberField({ initial: 8 }),
      }),
      ma: new SchemaField({
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
    };
  }

  prepareBaseData() {
    super.prepareBaseData();
    console.log("FTCharacterData.prepareBaseData()", this);
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    console.log("FTCharacterData.prepareDerivedData()", this);

    // Calculate attribute points
    const { st, dx, iq } = this;
    this.ap = [st, dx, iq].reduce((ap, attribute) => ap + attribute.max, 0);
  }
}
