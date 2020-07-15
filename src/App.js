import React from 'react';
import axios from 'axios';
import styled from 'styled-components';
import {ReactComponent as Check} from './check.svg';

//import styles from './App.module.css';

/* START STYLE DEFINITIONS (CSS-in-JS) */
const StyledContainer = styled.div`
  height: 100vw;
  padding: 20px;

  background: #83a4d4;
  background: linear-gradient(to left, #b6fbff, #83a4d4);

  color: #171212;
`;

const StyledHeadlinePrimary = styled.h1`
  font-size: 48px;
  font-weight: 300;
  letter-spacing: 2px;
`;

const StyledItem = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 5px;
`;

const StyledColumn = styled.span`
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  a {
    color: inherit;
  } 
  /* width is defined as a property of the style's component */
  width: ${props => props.width};
`;

const StyledButton = styled.button`
  background: transparent;
  border: 1px solid #171212;
  padding: 5px;
  cursor: pointer;

  transition: all 0.1s ease-in;

  /* Selects the current element with the & CSS operator */
  &:hover {
    background: #171212;
    color: #ffffff;
  }

  &:hover > svg > g {
    fill: #ffffff;
    stroke: #ffffff;
  }
`;

// styled(CSS Component) receives all the base styles from the previously defined component
const StyledButtonSmall = styled(StyledButton)`
  padding: 5px;
`;

const StyledButtonLarge = styled(StyledButton) `
  padding: 10px;
`;

const StyledSearchForm = styled.form`
  padding: 10px 0 20px 0;
  display: flex;
  align-items: baseline;
`;

const StyledLabel = styled.label`
  border-top: 1px solid #171212;
  border-left: 1px solid #171212;
  padding-left: 5px;
  font-size: 24px;
`;

const StyledInput = styled.input`
  border: none;
  border-bottom: 1px solid #171212;
  background-color: transparent;

  font-size: 24px;
`;

/* END STYLE DEFINITIONS */

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

  // Component definition for SearchForm to be used in return statement
  const SearchForm = ({ searchTerm, onSearchInput, onSearchSubmit }) => (
    <StyledSearchForm onSubmit={onSearchSubmit}>
      <InputWithLabel id="search" value={searchTerm} isFocused onInputChange={onSearchInput}>
        <strong>Search:</strong>
      </InputWithLabel>

      <StyledButtonLarge type="submit" disabled={!searchTerm}>Submit</StyledButtonLarge>
    </StyledSearchForm>
  );

  // Return code that will be used in index.js
  return (  
    <StyledContainer>
      <StyledHeadlinePrimary>My Hacker Stories</StyledHeadlinePrimary>

      <SearchForm searchTerm={searchTerm} onSearchInput={handleSearchInput} onSearchSubmit={handleSearchSubmit} />
      
      {/* If an error is present in the stories state, return error message */}
      {stories.isError && <p>Something went wrong ... </p>}
      {/* Else if stories state is in loading, return loading message */}
      {stories.isLoading ? (
        <p>Loading ...</p>
      ) : (
        // Else return actual List component with stories data
        <List list={stories.data} onRemoveItem={handleRemoveStory} />
      )}
      
    </StyledContainer>
  
  );
};

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
      <StyledLabel htmlFor={id}>{children}</StyledLabel>&nbsp;
      {/* Pass the ref object into the ref attribute of the input tag */}
      <StyledInput ref={inputRef} id={id} type={type} value={value} onChange={onInputChange} />
    </>
  )  
}

// List component that contains the query of items from the search
const List = ({ list, onRemoveItem }) => 
  list.map((item) => <Item key={item.objectID} item= {item} onRemoveItem={onRemoveItem} />);

// Item component that shows a story's details of the title, author, number of comments, and points, along with a Dismiss button to remove from the query
const Item = ( { item, onRemoveItem } ) => {
  return (
    <StyledItem>
      <StyledColumn width='40%'>
        <a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a> {/* noopener and noreferrer prevents hacking when target is blank */}
      </StyledColumn>
      <StyledColumn width='30%'>{item.author}</StyledColumn>
      <StyledColumn width='10%'>{item.num_comments} </StyledColumn>
      <StyledColumn width='10%'>{item.points}</StyledColumn>
      <StyledColumn width='10%'>
        <StyledButtonSmall type="button" onClick={() => onRemoveItem(item)}>
          <Check height="18px" width="18px" />
        </StyledButtonSmall>
      </StyledColumn>
    </StyledItem>
  );
}
/* APPLICATION END */

// Export the App to the page that is importing it for use. In this case, it is index.js
export default App;