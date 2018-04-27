import React, { Component } from 'react';


export default class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      login: "",
      isLoading: false,
    };
    this.onLoginChange = this.onLoginChange.bind(this);
    this.onLoginClick = this.onLoginClick.bind(this);
  }

  render() {
    return (
      <div className="container login">
        <input
          className="input"
          type="text"
          value={this.state.login}
          placeholder="Login"
          onChange={this.onLoginChange}
        />
        <input
          className={"button" + (this.state.isLoading ? " is-loading" : "")}
          type="button"
          value="Sign In"
          onClick={this.onLoginClick}
          disabled={this.state.loginButtonDisabled}
        />
      </div>
    );
  }

  // Called each time the content of the login field changes
  async onLoginChange(e) {
    this.setState({ login: e.target.value });
  }

  // Called 
  async onLoginClick() {
    this.setState({isLoading: true});
    await this.props.onLogin(this.state.login);
  }
}