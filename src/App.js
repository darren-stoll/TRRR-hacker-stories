import React from 'react';
import axios from 'axios';
import {ReactComponent as Check} from './check.svg';
import { sortBy } from 'lodash';

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
        data: 
          action.payload.list === 0
            ? action.payload.list
            : state.data.concat(action.payload.list),
        page: action.payload.page
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

// API definitions for pulling data from hacker stories site
const API_BASE = "https://hn.algolia.com/api/v1";
const API_SEARCH = '/search';
const PARAM_SEARCH = 'query='
const PARAM_PAGE = 'page='

// Function that holds the url search
const getUrl = (searchTerm, page) => `${API_BASE}${API_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}`;

// URL is too long to have in a button, so replace with an empty string
const extractSearchTerm = url => url.substring(url.lastIndexOf('?') + 1, url.lastIndexOf('&')).replace(PARAM_SEARCH, '');

// Get the last 5 searches to be shown as buttons
const getLastSearches = urls => 
  urls.reduce((result, url, index) => {
    const searchTerm = extractSearchTerm(url);
    if (index === 0) {
      return result.concat(searchTerm);
    }

    const previousSearchTerm = result[result.length - 1];

    if (searchTerm === previousSearchTerm) {
      return result;
    } else {
      return result.concat(searchTerm);
    }
  }, [])
  .slice(-6)
  .slice(0, -1);


/* APPLICATION START */
const App = () => {

  // Define searchTerm var and setSearchTerm func based on custom hook above.
  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'React');

  // Create new urls var and setUrls func that's based on the url and query strings in the address bar, or the API that we are using.
  const [urls, setUrls] = React.useState([getUrl(searchTerm, 0)]);

  // Define stories var and dispatchStories func in useReducer hook. Uses storiesReducer defined above + initializes values.
  const [stories, dispatchStories] = React.useReducer(
    storiesReducer, 
    { data: [], page: 0, isLoading: false, isError: false}
  );

  // Returns memoized (only changes if dependencies change) callback for searching stories. Async done to do things in proper order.
  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });
    try {
      // The other urls besides lastUrl will be used as indicators for previous searches
      const lastUrl = urls[urls.length - 1];
      const result = await axios.get(lastUrl);

      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: {
          list: result.data.hits,
          page: result.data.page
        }
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE'});
    }
  }, [urls]);

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
    handleSearch(searchTerm, 0);

    // Prevents browser from reloading when search is submitted
    event.preventDefault();
  }

  // Function that handles the most recent search made
  const handleLastSearch = searchTerm => {
    setSearchTerm(searchTerm);

    handleSearch(searchTerm, 0);
  };

  // Consolidated function for setting urls in urls state var
  const handleSearch = (searchTerm, page) => {
    const url = getUrl(searchTerm, page);
    setUrls(urls.concat(url));
  }

  // Get the last 5 searches made and store in an array variable
  const lastSearches = getLastSearches(urls);

  // Method to handle incrementing a page
  const handleMore = () => {
    const lastUrl = urls[urls.length - 1];
    const searchTerm = extractSearchTerm(lastUrl);
    handleSearch(searchTerm, stories.page + 1);
  };

  // Return code that will be used in index.js
  return (
    <div className="container">
      <h1 className="headline-primary">My Hacker Stories</h1>

      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />

      <LastSearches lastSearches={lastSearches} onLastSearch={handleLastSearch} />

      {stories.isError && <p>Something went wrong ...</p>}

      <List list={stories.data} onRemoveItem={handleRemoveStory} />

      {stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        <button type="button" onClick={handleMore}> {/* Button that allows you to generate more stories at the bottom */}
          More
        </button>  
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

// Dictionary object that handles the sorting options for List by state
const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENT: list => sortBy(list, 'num_comments').reverse(),
  POINT: list => sortBy(list, 'points').reverse()
}

// List component that contains the query of items from the search
const List = ({ list, onRemoveItem }) => {
  const [sort, setSort] = React.useState({
    sortKey: 'NONE',
    isReverse: false
  });

  // Take the state and apply it to a new sortFunction before generating the new sortedList to be mapped over
  const handleSort = (sortKey) => {
    // Check to see if current sortKey is equal to passed sortKey AND if sort is not already false. If both pass, then isReverse is true, and the list should be sorted in reverse
    const isReverse = sort.sortKey === sortKey && !sort.isReverse;
    setSort({sortKey, isReverse});
  }

  const sortFunction = SORTS[sort.sortKey];
  // If isReverse is true, sort the list in reverse; else sort the list normally.
  const sortedList = sort.isReverse
    ? sortFunction(list).reverse()
    : sortFunction(list);

  return (
    <div>
      <div style={{display: 'flex'}}>
        <span style={{width:'40%'}}>
          <button id="TITLE" type="button" onClick={() => handleSort('TITLE')}>Title</button>
        </span>
        <span style={{width:'30%'}}>
          <button id="AUTHOR" type="button" onClick={() => handleSort('AUTHOR')}>Author</button>
        </span>
        <span style={{width:'10%'}}>
          <button id="COMMENT" type="button" onClick={() => handleSort('COMMENT')}>Comments</button>
        </span>
        <span style={{width:'10%'}}>
          <button id="POINT" type="button" onClick={() => handleSort('POINT')}>Points</button>
        </span>
        <span style={{width:'10%'}}>Actions</span>
      </div>
      {sortedList.map((item) => (<Item key={item.objectID} item= {item} onRemoveItem={onRemoveItem} />))};
    </div>
  )
};

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

const LastSearches = ({ lastSearches, onLastSearch }) => (
  <>
    {/* Give the searchTerm an index so that reused searches won't break it */}
    {lastSearches.map((searchTerm, index) => (
      <button key={searchTerm + index} type="button" onClick={() => onLastSearch(searchTerm)}>
        {searchTerm}
      </button>
    ))}
  </>
)
/* APPLICATION END */

// Export the App to the page that is importing it for use. In this case, it is index.js
export default App;

// Export components for testing
export { storiesReducer, SearchForm, InputWithLabel, List, Item };