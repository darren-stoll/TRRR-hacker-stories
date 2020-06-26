/*
import React from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React For
        </a>
      </header>
    </div>
  );
}

export default App;
*/

import React from 'react';

const list = [
  {
    title: "React",
    url: "https://reactjs.org/"
  },
  {
    title: "Redux",
    url: "https://redux.js.org"
  }
]

function App() {

  return (
    <div>
      {list.map((item) => {
        return <div>{item.title}</div>;
      })}
    </div>
  );
}

export default App;