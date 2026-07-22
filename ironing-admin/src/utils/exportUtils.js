import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Universal utility for exporting table data to Excel/CSV format
 * 
 * @param {string} filename The name of the file to download (without extension)
 * @param {Array} rows The data rows to export (array of objects or array of arrays)
 */
export const exportToExcel = (filename, rows) => {
  try {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.csv`);
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    alert("Failed to export Excel file. See console for details.");
  }
};

/**
 * Universal utility for exporting table data to a beautifully formatted PDF Report
 * 
 * @param {string} title The title to display at the top of the PDF
 * @param {string} filename The name of the file to download (without extension)
 * @param {Array<string>} headers The table header row (e.g. ['ID', 'Name', 'Amount'])
 * @param {Array<Array>} data The table rows (array of arrays containing the row values)
 */
export const exportToPDF = (title, filename, headers, data) => {
  try {
    const doc = new jsPDF();
    
    // Add custom font and styling to the header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title, 14, 22);
    
    // Add Generation Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // AutoTable to generate the grid
    autoTable(doc, {
      startY: 35,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246], // blue-500
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        textColor: [51, 65, 85], // slate-700
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // slate-50
      },
      margin: { top: 35 },
    });
    
    doc.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    alert("Failed to export PDF file. See console for details.");
  }
};
