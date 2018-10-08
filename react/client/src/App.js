import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {
    files: []
  };

  componentDidMount() {
    this.callApi()
      .then(res => this.setState({ files: res.files }))
      .catch(err => console.log(err));
  }

  callApi = async () => {
    const response = await fetch('/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: '/Users/e/Pictures/X-T1/Seattle 2018'})
    });
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  render() {
    return (
      <div className="App">
        <header className="App-header">
           {this.state.files.slice(0, 8).map(file => (
             <img className="App-img" src={'/static/' + file} alt=''/>
           ))}
        </header>
      </div>
    );
  }
}

export default App;
