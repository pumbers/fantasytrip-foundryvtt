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
      attributes: new SchemaField({
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
          max: new NumberField({ initial: 8 }),
          value: new NumberField({ initial: 8 }),
        }),
      }),
      //
      points: new NumberField({ initial: 8 }),
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
    // console.log("FTItemData.prepareBaseData()", this);
    super.prepareBaseData();
  }

  prepareDerivedData() {
    // console.log("FTItemData.prepareDerivedData()", this);
    super.prepareDerivedData();
  }
}
