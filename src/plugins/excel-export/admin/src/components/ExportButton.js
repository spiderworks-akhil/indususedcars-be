// import React, { useState } from 'react';
// import { Button, DatePicker } from '@strapi/design-system';
// import { request } from '@strapi/helper-plugin';

// const ExportButton = () => {
//   const [from, setFrom] = useState(null);
//   const [to, setTo] = useState(null);
  
//   const handleExport = async () => {
//     try {
//       const response = await request(`/excel-export?from=${from}&to=${to}`, { method: 'GET' });
//       const url = window.URL.createObjectURL(new Blob([response]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', 'leads.xlsx');
//       document.body.appendChild(link);
//       link.click();
//     } catch (error) {
//       console.error('Export failed:', error);
//     }
//   };

//   return (
//     <>
//       <DatePicker 
//         onChange={setFrom} 
//         label="From" 
//         selectedDate={from}
//         clearLabel="Clear"
//         onClear={() => setFrom(null)}
//       />
//       <DatePicker 
//         onChange={setTo} 
//         label="To" 
//         selectedDate={to}
//         clearLabel="Clear"
//         onClear={() => setTo(null)}
//       />
//       <Button onClick={handleExport}>Export to Excel</Button>
//     </>
//   );
// };

// export default ExportButton;