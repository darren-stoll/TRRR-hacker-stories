import React from 'react';
import axios from 'axios';
import {ReactComponent as Check} from './check.svg';

import './App.css';

// Custom hook to manage state yet synchronize with local storage, hence semi persistent.
const useSemiPersistentState = (key, initialState) => {
  // Define the value variable and setValue function from a useState hook. If a value already exists, set it to that. Otherwise, go to initialState
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  // Side-effect where item is set in local storage based on key provided in argument to value.
  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  // Return the new value (based on key) var and the setValue func defined in useState.
  return [value, setValue];
}

// Reducer variable to handle different state cases for stories; will be used later in useReducer hook
const storiesReducer = (state, action) => {
  switch (action.type) {
    // Initial stories state, where it is loading w/o error.
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false
      };
    // Successful stories state, where it's neither loading nor has an error. Also returns data.
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload
      };
    // Failed stories state. Returns an error.
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true
      };
    // Delete a story from the query. Returns data based on removed item.
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        )
      }
    default:
      throw new Error();
  }
}

// API endpoint for pulling data from hacker stories site
const API_ENDPOINT = "https://hn.algolia.com/api/v1/search?query=";

/* APPLICATION START */
const App = () => {

  // Define searchTerm var and setSearchTerm func based on custom hook above.
  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React');

  // Create new url var and setUrl func that's based on the url and query strings in the address bar, or the API that we are using.
  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  // Define stories var and dispatchStories func in useReducer hook. Uses storiesReducer defined above + initializes values.
  const [stories, dispatchStories] = React.useReducer(
    storiesReducer, 
    { data: [], isLoading: false, isError: false}
  );

  // Returns memoized (only changes if dependencies change) callback for searching stories. Async done to do things in proper order.
  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });
    try {
      const result = await axios.get(url);

      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE'});
    }
  }, [url]);

  // Side-effect that calls handleFetchStories() if handleFetchStories isn't already populated?
  React.useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  // Function for handling deleted story from query
  const handleRemoveStory = (item) => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item
    });
  }

  // Function that handles the search input in the text box and sets the search term in the state
  const handleSearchInput = (event) => {
    setSearchTerm(event.target.value);
  };

  // Function that handles the submission of the form for the search. Sets the url in the state.
  const handleSearchSubmit = (event) => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);

    // Prevents browser from reloading when search is submitted
    event.preventDefault();
  }

  // Return code that will be used in index.js
  return (
    <div className="container">
      <h1 className="headline-primary">My Hacker Stories</h1>

      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      {stories.isError && <p>Something went wrong ...</p>}

      {stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
      )}
    </div>
  );
};

// Component definition for SearchForm to be used in return statement
const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) => (
  
  <form onSubmit={onSearchSubmit} className="search-form">
    <InputWithLabel
      id="search"
      value={searchTerm}
      isFocused
      onInputChange={onSearchInput}
    >
      <strong>Search:</strong>
    </InputWithLabel>

    <button
      type="submit"
      disabled={!searchTerm}
      className="button button_large"
    >
      Submit
    </button>
  </form>
);

// Component definition for InputWithLabel to be used in return statement.
const InputWithLabel = ({ id, type="text", value, onInputChange, isFocused, children }) => {
  // Declare a mutable ref object that can be used to access the DOM. current property of ref can be changed
  const inputRef = React.useRef();

  // Side-effect hook that puts the cursor in the input field (text box) when the browser page loads
  React.useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused])

  return(
    <>
      <label htmlFor={id} className="label">
        {children}
      </label>
      &nbsp;
      {/* Pass the ref object into the ref attribute of the input tag */}
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={onInputChange}
        className="input"
      />
    </>
  )  
}

// List component that contains the query of items from the search
const List = ({ list, onRemoveItem }) => 
  list.map((item) => <Item key={item.objectID} item= {item} onRemoveItem={onRemoveItem} />);

// Item component that shows a story's details of the title, author, number of comments, and points, along with a Dismiss button to remove from the query
const Item = ( { item, onRemoveItem } ) => {
  return (
    <div className="item">
      <span style={{ width: '40%' }}>
        <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a> {/* noopener and noreferrer prevents hacking when target is blank */}
      </span>
      <span style={{ width: '30%' }}>{item.author}</span>
      <span style={{ width: '10%' }}>{item.num_comments}</span>
      <span style={{ width: '10%' }}>{item.points}</span>
      <span style={{ width: '10%' }}>
        <button
          type="button"
          onClick={() => onRemoveItem(item)}
          className="button button_small"
        >
          <Check height="18px" width="18px" />
        </button>
      </span>
    </div>
  );
}
/* APPLICATION END */

// Export the App to the page that is importing it for use. In this case, it is index.js
export default App;

// Export components for testing
export { storiesReducer, SearchForm, InputWithLabel, List, Item };