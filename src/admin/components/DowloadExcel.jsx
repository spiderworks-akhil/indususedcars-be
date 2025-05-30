import { Button, Field, Modal } from "@strapi/design-system";
import React, { useState } from "react";
import { useNotification } from "@strapi/helper-plugin";
import axios from "axios";

const DownloadExcel = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toggleNotification = useNotification();

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toggleNotification({
        type: "warning",
        message: "Please select both start and end dates",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get("/cars/export-excel", {
        params: { startDate, endDate },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `cars_${startDate}_to_${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toggleNotification({
        type: "success",
        message: "Excel exported successfully",
      });
    } catch (error) {
      toggleNotification({
        type: "error",
        message: "Failed to export Excel",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsVisible(false);
    }
  };

  return (
    <>
      <Modal.Root>
        <Modal.Trigger>
          <Button>Export Excel</Button>
        </Modal.Trigger>
        <Modal.Content>
          <Modal.Header>
            <Modal.Title>Export Cars Data</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Field.Root>
              <Field.Label>Start Date</Field.Label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </Field.Root>
            <Field.Root style={{ marginTop: "1rem" }}>
              <Field.Label>End Date</Field.Label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </Field.Root>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Close>
              <Button variant="tertiary">Cancel</Button>
            </Modal.Close>
            <Button
              onClick={handleExport}
              loading={isLoading}
              disabled={isLoading}
            >
              Export
            </Button>
          </Modal.Footer>
        </Modal.Content>
      </Modal.Root>
    </>
  );
};

export default DownloadExcel;
