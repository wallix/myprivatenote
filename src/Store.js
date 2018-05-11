import { sign } from './Sign'
import * as DataPeps from 'datapeps-sdk';

// Name of the store where notes metadata are stored
export const STORENAME_METADATA = "note-metadata";

// Name of the store where notes content are stored
export const STORENAME_CONTENT = "note-content";

export default class {

  constructor(login) {
    this.login = login;
    this.database = null;
    this.session = null;
  }

  // Initialize the store
  async init() {
    await this._initDataPepsSession();
    await this._initDatabase();
  }

  _initDatabase() {
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

  async _initDataPepsSession() {
    // request delegated access
    let accessRequest = await DataPeps.requestDelegatedAccess(this.login, sign);
    // open a window for delegated access request resolution and resolve the request
    accessRequest.openResolver();
    // wait for the resolution
    this.session = await accessRequest.waitSession();
  }

  // Save the note
  async save(note) {
    if (note.id === undefined) {
      note.id = Date.now().toString();
    }
    note = await this._encryptNote(note);
    this.saveEncrypted(note)
  }

  // Save the encrypted note
  async saveEncrypted(note) {
    let tx = this.database.transaction([
      STORENAME_METADATA,
      STORENAME_CONTENT
    ], 'readwrite');
    let storeMetadata = tx.objectStore(STORENAME_METADATA);
    let storeContent = tx.objectStore(STORENAME_CONTENT);
    let content = note.encryptedContent;
    delete note.content;
    delete note.encryptedContent;
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

  // Encrypts a note with DataPeps, encrypt the content file and add the dataPepsId metadata
  async _encryptNote(note) {
    // Create a DataPeps resource to encrypt the note
    let resource = await this.session.Resource.create("myprivatenote/note", {
      description: "note " + note.id + ": " + ((note.content.length > 23) ? note.content.substring(0,20) + "..." : note.content),
      MIMEType: "text/plain",
      URI: window.location.origin + "#" + note.id
    }, [this.session.login]);
    // Encrypt the note content
    let encryptedContent = resource.encrypt(new TextEncoder().encode(note.content));
    return { ...note, dataPepsId: resource.id.toString(), encryptedContent };
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

  // Fill the note.content and encryptedContent field
  async getContent(note) {
    note.encryptedContent = await this._get(note.id, STORENAME_CONTENT);
    note.content = await this._decryptNote(note);
  }

  async _decryptNote(note) {
    // Get the DataPeps resource that was used to encrypt the note
    let resource = await this.session.Resource.get(note.dataPepsId);
    // Decrypt the note content
    return new TextDecoder().decode(resource.decrypt(note.encryptedContent));
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