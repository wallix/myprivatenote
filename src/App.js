import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Login from './Login'
import Notes from './Notes'

import 'bulma/css/bulma.css';
import 'font-awesome/css/font-awesome.css';
import Store from './Store';

export default class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      store: null,
      login: null,
    };
    this.onLogin = this.onLogin.bind(this);
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">MyPrivateNote</h1>
        </header>
        <div className="App-intro">
          {
            this.state.store == null ?
              <Login onLogin={this.onLogin} /> :
              <Notes
                store={this.state.store}
                login={this.state.login}
              />
          }
        </div>
      </div>
    );
  }

  // Called when a user logs in
  async onLogin(login) {
    let store = new Store(login);
    await store.init();
    this.setState({ store, login })
  }
}