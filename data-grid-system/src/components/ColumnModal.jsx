import React, { useState } from "react";
import "../assets/css/modal.css";

const ColumnModal = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [dataType, setDataType] = useState("String");
  const [options, setOptions] = useState("");
  const [regexPattern, setRegexPattern] = useState("");

  const columnTypes = [
    "String",
    "Numeric",
    "Email",
    "Regexp validated",
    "External collection",
    "Single-select",
    "Multi-select",
  ];

  const handleSave = () => {
    const columnData = { name, dataType };
    if (dataType === "Single-select" || dataType === "Multi-select") {
      columnData.options = options.split(",").map((opt) => opt.trim());
    }
    if (dataType === "Regexp validated") {
      columnData.regexPattern = regexPattern;
    }
    onSave(columnData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Column</h2>
        <label>Column Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Data Type:</label>
        <select value={dataType} onChange={(e) => setDataType(e.target.value)}>
          {columnTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        {(dataType === "Single-select" || dataType === "Multi-select") && (
          <>
            <label>Options (comma-separated):</label>
            <input
              type="text"
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              placeholder="Option1, Option2, Option3"
              required
            />
          </>
        )}

        {dataType === "Regexp validated" && (
          <>
            <label>Regular Expression:</label>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="Enter regex pattern"
              required
            />
          </>
        )}

        <button className="save-button" onClick={handleSave}>Save</button>
        <button className="close-button" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default ColumnModal;
