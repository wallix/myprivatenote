import React, { Component } from 'react';
import './Notes.css'

// downloaded notes are saved with this extension
const fileNameExtension = ".dpr";

class Notes extends Component {

  constructor(props) {
    super(props);
    this.state = {
      notes: [],
    }
    this.onSaveNote = this.onSaveNote.bind(this);
    this.onImportNote = this.onImportNote.bind(this);
    this.onDeleteNote = this.onDeleteNote.bind(this);
    this.onDownloadNote = this.onDownloadNote.bind(this);
    this.onExpandNote = this.onExpandNote.bind(this);
    this.onCollapseNote = this.onCollapseNote.bind(this);
    this.onShareNote = this.onShareNote.bind(this);
    this.onShareClose = this.onShareClose.bind(this);
  }

  render() {
    return (
      <div className="container">
        <div className="tile is-ancestor is-vertical">
          <div className="tile is-child box account-id">
            <span className="icon is-small is-left">
              <i className="fa fa-user" />{this.props.login}
              <i className="fa fa-arrow-right" />{this.props.store.session.login}
            </span>
          </div>
          <ShareNote
            note={this.state.noteToShare}
            session={this.props.store.session}
            onClose={this.onShareClose}
            downloadContent={this.downloadContent}
          />
          <CreateNote
            onSave={this.onSaveNote}
            onImport={this.onImportNote}
          />
          {this.state.notes.map(note =>
            <Note
              key={note.id}
              note={note}
              onExpand={() => this.onExpandNote(note)}
              onCollapse={() => this.onCollapseNote(note)}
              onDelete={() => this.onDeleteNote(note)}
              onDownload={() => this.onDownloadNote(note)}
              onShare={() => this.onShareNote(note)}
            />
          )}
        </div>
      </div>
    );
  }

  componentDidMount() {
    this.loadNotes();
  }

  // Save a new note
  async onSaveNote(note) {
    await this.props.store.save(note);
    this.loadNotes();
  }

  // add to the collection of notes a previously downloaded note
  async onImportNote(note) {
    await this.props.store.saveEncrypted(note);
    await this.loadNotes();
    await this.onExpandNote(note);
  }

  // Delete a note
  async onDeleteNote(note) {
    await this.props.store.delete(note.id);
    this.loadNotes();
  }

  // Download a copy of a note
  async onDownloadNote(note) {
    let reader = new FileReader()
    reader.onloadend = () => {
      let url = reader.result;
      // create a download link
      var link = document.createElement("a");
      link.download = note.dataPepsId + fileNameExtension;
      link.href = url;
      document.body.appendChild(link);

      // activate a download link
      link.click();
      document.body.removeChild(link);
    };
    await this.props.store.getContent(note);
    reader.readAsDataURL(new Blob([note.encryptedContent]));
    delete note.content;
  }

  // Show the content of a note
  async onExpandNote(note) {
    await this.props.store.getContent(note);
    let notes = this.state.notes.map(n => n.id === note.id ? note : n);
    this.setState({ notes });
  }

  // Hide the content of a note
  onCollapseNote(note) {
    let notes = this.state.notes.map(
      n => n.id === note.id ? { ...note, content: null } : n);
    this.setState({ notes });
  }

  // fetch notes ids from the database
  async loadNotes() {
    let notes = await this.props.store.getNotes();
    this.setState({ notes });
  }

  // Open the share note modal
  async onShareNote(note) {
    this.setState({ noteToShare: note });
  }

  // Close the share note modal
  async onShareClose() {
    this.setState({ noteToShare: null });
  }
}

// represents note creation (saving or importing) part of the page
class CreateNote extends Component {

  constructor(props) {
    super(props)

    this.state = {
      textAreaContent: '',
      fileInputValue: '',
    }

    this.onTextAreaChange = this.onTextAreaChange.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onFileInputClick = this.onFileInputClick.bind(this);
  }

  render() {
    return (
      <div className="tile is-child box">
        <article className="media">
          <div className="media-content">
            <div className="field">
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="Your note"
                  onChange={this.onTextAreaChange}
                  value={this.state.textAreaContent}
                />
              </div>
              <div className="field is-grouped">
                <div className="control">
                  <a className="button" onClick={this.onSave}>
                    <span className="icon">
                      <i className="fa fa-save"></i>
                    </span>
                    <span>Save</span>
                  </a>
                </div>
                <div className="file control">
                  <label className="file-label">
                    <input
                      className="file-input"
                      type="file"
                      name="resume"
                      value={this.state.fileInputValue}
                      onChange={this.onUpload}
                      onClick={this.onFileInputClick}
                    />
                    <span className="file-cta">
                      <span className="file-icon">
                        <i className="fa fa-upload"></i>
                      </span>
                      <span className="file-label">
                        Import
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    );
  }

  // called each time textAreaContent changes
  onTextAreaChange(e) {
    this.setState({ textAreaContent: e.target.value });
  }

  // called to save a new note
  onSave() {
    this.props.onSave({ content: this.state.textAreaContent });
    this.setState({ textAreaContent: '' });
  }

  // called to upload to database a previously downloaded note
  onUpload(e) {
    let file = e.target.files.item(0);
    if (file == null) {
      return;
    }
    let id = null;
    let reader = new FileReader();
    reader.onloadend = (e) => {
      try {
        // convert content to utf8 string
        let encryptedContent = new Uint8Array(reader.result);
        this.props.onImport({ encryptedContent, dataPepsId: id });
      }
      catch (e) {
        console.log("ERROR: on importing a note: ", e);
      }
    };
    reader.onerror = (e) => {
      console.log("ERROR: on reading an uploaded note: ", e);
    }
    try {
      let name = file.name;
      if (!name.endsWith(fileNameExtension)) {
        throw new Error('Bad filename format');
      }
      id = name.substring(0, name.length - fileNameExtension.length);
      reader.readAsArrayBuffer(file);
    }
    catch (e) {
      console.log("ERROR: on uploading a note: ", e);
    }
  }

  onFileInputClick() {
    this.setState({ fileInputValue: '' });
  }
}

// represents the user's note (saved or imported)
const Note = ({ note, onExpand, onCollapse, onDelete, onDownload, onShare }) => {
  return (
    <div className="tile is-child box">
      <article className="media">
        <div className="media-content">
          <div>ID: {note.id}</div>
          {note.content != null ? <div>{note.content}</div> : null}
        </div>
        <div className="media-right">
          {note.content == null ?
            <i className="fa fa-expand" onClick={onExpand} /> :
            <i className="fa fa-compress" onClick={onCollapse} />
          }
          <i className="fa fa-download" onClick={onDownload} />
          <i className="fa fa-share" onClick={onShare} />
          <i className="fa fa-trash" onClick={onDelete} />
        </div>
      </article>
    </div>
  );
};

// A modal to share a note
class ShareNote extends Component {

  constructor(props) {
    super(props);

    this.state = {
      // Login of the user with whom the note is shared
      login: '',
    }
    this.onLoginChange = this.onLoginChange.bind(this);
    this.onShare = this.onShare.bind(this);
  }

  render() {
    if (this.props.note == null) {
      return null;
    }
    return (
      <div className="modal is-active">
        <div className="modal-background"></div>
        <div className="modal-content">
          <div className="box">
            <h1>Share note {this.props.note.id}</h1>
            <div className="field">
              <div className="control has-icons-left">
                <input
                  className="input"
                  type="text"
                  value={this.state.login}
                  placeholder="Account id"
                  onChange={this.onLoginChange}
                />
                <span className="icon is-small is-left">
                  <i className="fa fa-user"></i>
                </span>
              </div>
            </div>
            <div className="field is-grouped">
              <div className="control">
                <button className="button" onClick={this.onShare}>
                  Share the note
                </button>
              </div>
            </div>
          </div>
        </div>
        <button className="modal-close is-large" aria-label="close" onClick={this.props.onClose} />
      </div>
    );
  }

  // Called each time the value in the sharer login field changes
  onLoginChange(e) {
    this.setState({ login: e.target.value });
  }

  // Called when the share button is clicked
  async onShare() {
    if (this.state.login === '') {
      return;
    }
    // Add the sharerLogin to the sharing group of the resource
    await this.props.session.Resource.extendSharingGroup(
      this.props.note.dataPepsId,
      [this.state.login]
    );
    this.props.onClose();
  }
};

export default Notes;