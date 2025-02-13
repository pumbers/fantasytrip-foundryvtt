const { HTMLField, SchemaField, NumberField, StringField, ArrayField, ForeignDocumentField } = foundry.data.fields;

/* -------------------------------------------- */
/*  Item Data Type                       
/* -------------------------------------------- */

class FTBaseItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      notes: new HTMLField(),
    };
  }
}

export class FTTalentData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      iq: new NumberField({ initial: 0 }),
      acquire: new NumberField({ initial: 0 }),
    });
  }
}

export class FTSpellData extends FTTalentData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      st: new NumberField({ initial: 0 }),
    });
  }
}

export class FTEquipmentData extends FTBaseItemData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      cost: new NumberField({ initial: 0 }),
      wt: new NumberField({ initial: 0 }),
      qty: new NumberField({ initial: 1 }),
      //
      location: new StringField({ initial: "carried" }),
      capacity: new NumberField({ initial: 0 }),
      container: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
    });
  }
}

export class FTWeaponData extends FTEquipmentData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      damage: new StringField(),
      minST: new NumberField({ initial: 0 }),
      //
      talent: new ForeignDocumentField(foundry.documents.BaseItem, { idOnly: true }),
    });
  }
}

export class FTArmorData extends FTEquipmentData {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      hitsStopped: new NumberField({ initial: 0 }),
    });
  }
}
