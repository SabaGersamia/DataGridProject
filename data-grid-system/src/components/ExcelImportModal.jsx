import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button, Modal, Box, Typography, CircularProgress } from '@mui/material';
import { createBatchRows } from '../services/DataGridService';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ExcelImportModal = ({ gridId, open, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState([]);

  const handleFileChange = (e) => {
    setError(null);
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    if (!['xlsx', 'xls', 'csv'].some(ext => selectedFile.name.endsWith(`.${ext}`))) {
      setError('Please upload a valid Excel file (.xlsx, .xls, .csv)');
      return;
    }

    setFile(selectedFile);
    previewExcel(selectedFile);
  };

  const previewExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Show first 5 rows for preview
        setPreviewData(jsonData.slice(0, 5));
      } catch (err) {
        setError('Failed to parse Excel file');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (!file || !gridId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          const rowsToImport = jsonData.map(row => {
            const values = {};
            Object.entries(row).forEach(([key, value]) => {
              values[key] = value !== null && value !== undefined ? value.toString() : '';
            });
            
            return {
              values,
              status: "ToDo"
            };
          });

          await createBatchRows(gridId, rowsToImport);
          
          onImportSuccess();
          onClose();
        } catch (err) {
          setError(`Import failed: ${err.message}`);
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError(`Import failed: ${err.message}`);
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Typography variant="h6" gutterBottom>
          Import from Excel
        </Typography>
        
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          style={{ margin: '16px 0' }}
        />
        
        {previewData.length > 0 && (
          <div style={{ margin: '16px 0', maxHeight: '200px', overflow: 'auto' }}>
            <Typography variant="subtitle2">Preview:</Typography>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i}>
                    {Array.isArray(row) ? (
                      row.map((cell, j) => (
                        <td key={j} style={{ border: '1px solid #ddd', padding: '4px' }}>
                          {cell}
                        </td>
                      ))
                    ) : (
                      Object.values(row).map((value, j) => (
                        <td key={j} style={{ border: '1px solid #ddd', padding: '4px' }}>
                          {value}
                        </td>
                      ))
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {error && (
          <Typography color="error" style={{ margin: '8px 0' }}>
            {error}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!file || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Importing...' : 'Import'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default ExcelImportModal;