// Name of the store where notes metadata are stored
export const STORENAME_METADATA = "note-metadata";

// Name of the store where notes content are stored
export const STORENAME_CONTENT = "note-content";

export default class {

  constructor(login) {
    this.login = login;
    this.database = null;
  }

  // Initialize the store
  init() {
    return new Promise((resolve, reject) => {
      // Openning database of login
      let databaseConnection = indexedDB.open(this.login);
      // Creating object stores if not exists
      databaseConnection.onupgradeneeded = (e) => {
        let db = e.target.result;
        if (!db.objectStoreNames.contains(STORENAME_METADATA)) {
          db.createObjectStore(STORENAME_METADATA);
        };
        if (!db.objectStoreNames.contains(STORENAME_CONTENT)) {
          db.createObjectStore(STORENAME_CONTENT);
        };
      };
      databaseConnection.onsuccess = (e) => {
        this.database = e.target.result;
        resolve();
      };
      databaseConnection.onerror = (e) => {
        reject(e);
      };
    })
  }

  // Save the note
  async save(note) {
    if (note.id === undefined) {
      note.id = Date.now().toString();
    }
    let tx = this.database.transaction([
      STORENAME_METADATA,
      STORENAME_CONTENT
    ], 'readwrite');
    let storeMetadata = tx.objectStore(STORENAME_METADATA);
    let storeContent = tx.objectStore(STORENAME_CONTENT);
    let content = note.content;
    delete note.content;
    storeMetadata.put(note, note.id);
    storeContent.put(content, note.id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = (e) => {
        reject(e);
      };
    });
  }

  // Get all notes stored without contents
  async getNotes() {
    let tx = this.database.transaction(STORENAME_METADATA, 'readonly');
    let store = tx.objectStore(STORENAME_METADATA);
    let request = store.getAll();
    return new Promise((resolve, reject) => {
      tx.oncomplete = (e) => {
        resolve(request.result);
      };
      tx.onerror = (e) => {
        reject(e);
      };
    });
  }

  // Fill the note.content field
  async getContent(note) {
    note.content = await this._get(note.id, STORENAME_CONTENT);
  }

  // delete a note
  async delete(id) {
    let tx = this.database.transaction([
      STORENAME_METADATA,
      STORENAME_CONTENT
    ], 'readwrite');
    let storeMetadata = tx.objectStore(STORENAME_METADATA);
    let storeContent = tx.objectStore(STORENAME_CONTENT);
    storeMetadata.delete(id);
    storeContent.delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve();
      };
      tx.onerror = (e) => {
        reject(e);
      };
    });
  }

  // Get an object from a store
  async _get(id, storeName) {
    let tx = this.database.transaction(storeName, 'readonly');
    let store = tx.objectStore(storeName);
    let request = store.get(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        resolve(request.result);
      };
      tx.onerror = (e) => {
        reject(e);
      };
    });
  }
}