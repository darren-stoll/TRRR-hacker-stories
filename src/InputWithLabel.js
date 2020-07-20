import React from 'react';

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

export default InputWithLabel;