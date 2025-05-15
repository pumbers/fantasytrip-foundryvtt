/**
 * Function to open ProseMirror editor to edit a document field
 *
 * @param {*} event
 * @param {*} target
 */
export async function editHTML(event, target) {
  // console.log("_editHTML()", this.document);
  const tab = target.closest("section.tab");
  const wrapper = tab.querySelector(".prosemirror.editor");

  wrapper.classList.add("active");
  const editorContainer = wrapper.querySelector(".editor-container");
  const content = foundry.utils.getProperty(this.document, target.dataset.fieldName);

  this.editor = await foundry.applications.ux.ProseMirrorEditor.create(editorContainer, content, {
    document: this.document,
    fieldName: target.dataset.fieldName,
    relativeLinks: true,
    collaborate: true,
    plugins: {
      menu: ProseMirror.ProseMirrorMenu.build(ProseMirror.defaultSchema, {
        destroyOnSave: true,
        onSave: saveEditor.bind(this),
      }),
      keyMaps: ProseMirror.ProseMirrorKeyMaps.build(ProseMirror.defaultSchema, {
        onSave: saveEditor.bind(this),
      }),
    },
  });
}

/**
 * Function to save ProseMirror edits to a document field
 */
async function saveEditor() {
  // console.log("_saveEditor()", this.editor);
  const newValue = ProseMirror.dom.serializeString(this.editor.view.state.doc.content);
  const [uuid, fieldName] = this.editor.uuid.split("#");
  this.editor.destroy();
  this.editor = null;
  const currentValue = foundry.utils.getProperty(this.document, fieldName);
  if (newValue !== currentValue) {
    await this.document.update({ [fieldName]: newValue });
  }
  this.render(true);
}
