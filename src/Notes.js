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
  }

  render() {
    return (
      <div className="container">
        <div className="tile is-ancestor is-vertical">
          <div className="tile is-child box account-id">
            <span className="icon is-small is-left">
              <i className="fa fa-user" />{this.props.login}
            </span>
          </div>
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
    await this.props.store.save(note);
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
      link.download = note.id + fileNameExtension;
      link.href = url;
      document.body.appendChild(link);

      // activate a download link
      link.click();
      document.body.removeChild(link);
    };
    await this.props.store.getContent(note);
    reader.readAsDataURL(new Blob([note.content]));
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
        let content = new TextDecoder().decode(new Uint8Array(reader.result));
        this.props.onImport({ content, id });
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
const Note = ({ note, onExpand, onCollapse, onDelete, onDownload }) => {
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
          <i className="fa fa-trash" onClick={onDelete} />
        </div>
      </article>
    </div>
  );
};

export default Notes;