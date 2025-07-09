import {
  Alert,
  Button,
  Field,
  Modal,
  DatePicker
} from "@strapi/design-system";
import React, { useState } from "react";
import { unstable_useContentManagerContext as useContentManagerContext } from "@strapi/strapi/admin";
import { Download } from "@strapi/icons";
import axios from "axios";

const DownloadExcel = () => {
  const { model } = useContentManagerContext();
  console.log({ model });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState(null); // null by default
  const [endDate, setEndDate] = useState(null); // null by default

  const handleExportLeads = async () => {
    try {
      setIsLoading(true);
      if (!startDate || !endDate) {
        setError("Please select both start and end dates");
        return;
      }
      if (startDate > endDate) {
        setError("Start date cannot be after end date");
        return;
      }

      const response = await axios.post("/api/leads/export", {

        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }, {
        responseType: "blob", // <-- important to treat as binary
      });

      console.log({ response: response?.data });


      if (response.data) {
        setSuccess("Leads exported successfully");
        // Create download link for the Excel file
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `leads_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();


        setTimeout(() => {
          setSuccess("");
          setIsOpen(false);
        }, 3000);
      } else {
        setError("Failed to export leads");
      }
    } catch (error) {
      console.log({ error });

      setError(error?.response?.data?.message || error?.message || "An error occurred");
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  if (model !== "api::lead.lead") return null;

  return (
    <>
      <Modal.Root open={isOpen} defaultOpen={false} onOpenChange={() => setIsOpen(!isOpen)}>
        <Modal.Trigger onClick={() => setIsOpen(true)}>
          <Button startIcon={<Download />}>Export Leads</Button>
        </Modal.Trigger>
        <Modal.Content style={{ height: "300px" }}>
          <Modal.Header>
            <Modal.Title>Export Leads</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Field.Root style={{ flex: 1 }} name="startDate" required>
                <Field.Label>Start Date</Field.Label>
                <DatePicker
                  selectedDate={startDate}
                  onChange={setStartDate}
                  onClear={() => setStartDate(null)}
                  size="M"
                  locale="en-GB"
                />
              </Field.Root>
              <Field.Root style={{ flex: 1 }} name="endDate" required>
                <Field.Label>End Date</Field.Label>
                <DatePicker
                  selectedDate={endDate}
                  onChange={setEndDate}
                  onClear={() => setEndDate(null)}
                  size="M"
                  locale="en-GB"
                />
              </Field.Root>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </Modal.Close>
            <Button
              onClick={handleExportLeads}
              disabled={isLoading || !startDate || !endDate || startDate > endDate}
            >
              {isLoading ? "Exporting..." : "Export"}
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>

      {error && (
        <Alert
          style={{ position: "fixed", top: "5px", right: "5px" }}
          closeLabel="Close"
          title="Error"
          variant="danger"
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          style={{ position: "fixed", top: "5px", right: "5px" }}
          closeLabel="Close"
          title="Success"
          variant="success"
        >
          {success}
        </Alert>
      )}
    </>
  );
};

export default DownloadExcel;
