import React from 'react';
import {ReactComponent as Check} from './check.svg';

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

export default List;

export { Item };