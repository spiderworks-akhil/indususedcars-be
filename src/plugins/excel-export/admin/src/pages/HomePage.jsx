import {
  Main,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  DatePicker,
  Flex,
  Box,
  Pagination,
  Typography,
  Loader,
  Alert,
} from '@strapi/design-system';
import { useIntl } from 'react-intl';
import { useEffect, useState } from 'react';
import { getTranslation } from '../utils/getTranslation';
import axios from '../../../node_modules/axios/index';
import * as XLSX from 'xlsx';
import { Check, Cross, Download } from '@strapi/icons';


const HomePage = () => {
  const { formatMessage } = useIntl();
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [leads, setLeads] = useState([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [leadLoading, setLeadLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const pageSize = 10;
  let BACKEND_URL=process.env.BACKEND_URL;



 

  useEffect(() => {
    const fetchLeads = async () => {
      setLeadLoading(true);
      console.log({url:window.location.href});
      
      try {
        
        const response = await axios.get(`http://localhost:1337/api/leads?pagination[page]=${page}&pagination[pageSize]=${pageSize}`);
        console.log(response.data,BACKEND_URL);
        
        setLeads(response.data?.data);
        setPageCount(response.data?.meta?.pagination?.pageCount || 1);
      } catch (error) {
        console.log(error);
      } finally {
        setLeadLoading(false);
      }
    };
    fetchLeads();
  }, [page]);

  const handleExport = async () => {
    console.log('Exporting from:', fromDate, 'to:', toDate);
    setExportLoading(true);
    try {
      // Convert dates to ISO format
      const isoFromDate = fromDate ? new Date(fromDate).toISOString() : null;
      const isoToDate = toDate ? new Date(toDate).toISOString() : null;
      

      // Build URL with proper date formatting
      let url = `http://localhost:1337/api/leads?pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
      if (isoFromDate || isoToDate) {
        url += `&filters[createdAt][$gte]=${isoFromDate}&filters[createdAt][$lte]=${isoToDate}`;
      }

      const response = await axios.get(url);
      const filteredLeads = response.data?.data || [];
  
      console.log(filteredLeads);
      

      // Check if there are any leads to export
      if (filteredLeads.length === 0) {
        setToast({
          type: 'error',
          message: 'No data found for the selected date range!',
          icon: <Cross />
        });
        return;
      }

      setLeads(filteredLeads);

      // Prepare data for Excel export
      const worksheetData = filteredLeads.map(lead => ({
        'Customer Name': lead.CustomerName,
        'Customer Email': lead.CustomerEmail,
        'Mobile Number': lead.MobileNumber,
        'Lead Type': lead.Lead_Type,
        'Notes': lead.Notes,
        'Date': lead.Date,
        'City': lead.City,
        'Created At': new Date(lead.createdAt).toLocaleDateString()
      }));
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads');
      
      // Apply bold styling to headers
      const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C }); // First row (0), column C
        if (!worksheet[cellAddress]) continue;
        
        // Apply bold style
        worksheet[cellAddress].s = {
          font: { bold: true },
        };
      }
      
      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true, // Ensure styles are included
      });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const urlLink = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = urlLink;
      link.setAttribute('download', 'leads.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Show success toast
      setToast({
        type: 'success',
        message: 'Download successful!',
        icon: <Check />
      });

    } catch (error) {
      console.log(error);
      // Show error toast
      setToast({
        type: 'error',
        message: 'Download failed! Please try again.',
        icon: <Cross />
      });
    } finally {
      setExportLoading(false);
      // Clear toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <Main>
      {toast && (
        <Box position="fixed" bottom={4} right={4} zIndex={1000}>
          <Alert
            variant={toast.type === 'success' ? 'success' : 'danger'}
            title={toast.message}
            onClose={() => setToast(null)}
            closeLabel="Close"
          >
            {/* <Flex gap={2} alignItems="center">
              {toast.icon}
              {toast.message}
            </Flex> */}
          </Alert>
        </Box>
      )}
      <Main padding={8}>
        <Typography variant="alpha" as="h1">Excel Export Leads</Typography>
        <Typography variant="epsilon" as="p" style={{ fontSize: '16px', color: '#6c757d' }}>Manage and export your leads data</Typography>
      </Main>
      <Main>
        <Box padding={8} background="neutral100">
          <Flex gap={4} marginBottom={6}>
            <Box>
              <Typography variant="pi" fontWeight="bold" marginBottom={2}>From Date</Typography>
              <DatePicker
                selectedDate={fromDate}
                onChange={setFromDate}
                clearLabel="Clear"
                onClear={()=>setFromDate(null)}
              />
            </Box>
            <Box>
              <Typography variant="pi" fontWeight="bold" marginBottom={2}>To Date</Typography>
              <DatePicker
                selectedDate={toDate}
                onChange={setToDate}
                clearLabel="Clear"
                onClear={()=>setToDate(null)}
              />
            </Box>
            <Box>
              <Typography variant="pi" fontWeight="bold" marginBottom={2}></Typography> <br/>
            <Button onClick={handleExport} disabled={exportLoading} startIcon={<Download />}>
              {exportLoading ? <Loader small /> : 'Export to Excel'}
            </Button>
            </Box>
          </Flex>

          {leadLoading ? (
            <Flex justifyContent="center">
              <Loader>Loading leads...</Loader>
            </Flex>
          ) : (
            <Table colCount={7} rowCount={leads?.length}>
              <Thead>
                <Tr>
                <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>Sl No</Th>
                  <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>Customer Name</Th>
                  <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>Customer Email</Th>
                  <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>Mobile Number</Th>
                  <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>Lead Type</Th>
                  <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>Date</Th>
                  <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>City</Th>
                  <Th style={{ fontSize: '18px', fontWeight: 'bold' }}>Created At</Th>
                </Tr>
              </Thead>
              <Tbody>
                {leads?.map((lead,index) => (
                  <Tr key={index}>
                    <Td style={{ fontSize: '16px' }}>{index + 1}</Td>
                    <Td style={{ fontSize: '16px' }}>{lead?.CustomerName}</Td>
                    <Td style={{ fontSize: '16px' }}>{lead?.CustomerEmail}</Td>
                    <Td style={{ fontSize: '16px' }}>{lead?.MobileNumber}</Td>
                    <Td style={{ fontSize: '16px' }}>{lead?.Lead_Type}</Td>
                    <Td style={{ fontSize: '16px' }}>{lead?.Date}</Td>
                    <Td style={{ fontSize: '16px' }}>{lead?.City}</Td>
                    <Td style={{ fontSize: '16px' }}>{new Date(lead?.createdAt).toLocaleDateString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}

          <Box paddingTop={4}>
            <Pagination
              activePage={page}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </Box>
        </Box>
      </Main>
    </Main>
  );
};

export { HomePage };
