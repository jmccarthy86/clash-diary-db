export const headers = ["DAY", "DATE", "P", "VENUE", "TITLE OF SHOW", "PRODUCER", "PRESS CONTACT", "DATE BKD"];
// /config.js

export const formHeaders = [
    { 
      name: "DAY", 
      type: "text", 
      className: "form-input", 
      placeholder: "Enter day", 
      label: "Day", 
      instruction: "Enter the day of the week", 
      attributes: { onChange: (e) => console.log('Day changed:', e.target.value) }
    },
    { 
      name: "DATE", 
      type: "text", 
      className: "form-input", 
      placeholder: "Enter date", 
      label: "Date", 
      instruction: "Enter the date in DD/MM/YYYY format", 
      attributes: { onBlur: (e) => console.log('Date blurred:', e.target.value) }
    },
    { 
      name: "P", 
      type: "checkbox", 
      className: "form-checkbox", 
      label: "Pencil Booking", 
      instruction: "Check if this is a pencil booking", 
      attributes: { onChange: (e) => console.log('Pencil booking changed:', e.target.checked) }
    },
    { 
      name: "VENUE", 
      type: "select", 
      className: "form-select", 
      options: ["WATERMILL", "Venue 1", "Venue 2", "Venue 3", "Venue 4"], 
      placeholder: "Select a venue", 
      label: "Venue", 
      instruction: "Select the venue", 
      attributes: { onChange: (e) => console.log('Venue changed:', e) }
    },
    { 
      name: "TITLE OF SHOW", 
      type: "text", 
      className: "form-input", 
      placeholder: "Enter title of show", 
      label: "Title of Show", 
      instruction: "Enter the title of the show", 
      attributes: { onChange: (e) => console.log('Title of show changed:', e.target.value) }
    },
    { 
      name: "PRODUCER", 
      type: "text", 
      className: "form-input", 
      placeholder: "Enter producer", 
      label: "Producer", 
      instruction: "Enter the producer's name", 
      attributes: { onChange: (e) => console.log('Producer changed:', e.target.value) }
    },
    { 
      name: "PRESS CONTACT", 
      type: "text", 
      className: "form-input", 
      placeholder: "Enter press contact", 
      label: "Press Contact", 
      instruction: "Enter the press contact details", 
      attributes: { onChange: (e) => console.log('Press contact changed:', e.target.value) }
    },
    { 
      name: "DATE BKD", 
      type: "text", 
      className: "form-input", 
      placeholder: "Enter date booked", 
      label: "Date Booked", 
      instruction: "Enter the date booked", 
      attributes: { onChange: (e) => console.log('Date booked changed:', e.target.value) }
    },
    { 
      name: "isPencil", 
      type: "checkbox", 
      className: "form-checkbox", 
      label: "Pencil Booking", 
      instruction: "Check if this is a pencil booking", 
      attributes: { onChange: (e) => console.log('Pencil booking changed:', e.target.checked) }
    },
    { 
      name: "isSeasonGala", 
      type: "checkbox", 
      className: "form-checkbox", 
      label: "Season Gala", 
      instruction: "Check if this is a season gala", 
      attributes: { onChange: (e) => console.log('Season gala changed:', e.target.checked) }
    },
    { 
      name: "isOperaDance", 
      type: "checkbox", 
      className: "form-checkbox", 
      label: "Opera/Dance", 
      instruction: "Check if this is an opera or dance event", 
      attributes: { onChange: (e) => console.log('Opera/Dance changed:', e.target.checked) }
    },
  ];
  