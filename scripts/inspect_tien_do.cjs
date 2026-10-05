const fs = require('fs');
const XLSX = require('xlsx');

const workbook = XLSX.readFile('./docs/KHGV HK1 2026-2027 KHOA CNTT_5-09-2026.xls');

console.log('=== ANALYZING ALL SHEETS ===');

for (const sName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sName];
  if (!sheet) continue;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  console.log(`\n\n======================================================`);
  console.log(`SHEET: ${sName} (${rows.length} rows)`);
  console.log(`======================================================`);
  
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    // Check if row has any content
    const hasData = row.some(cell => cell !== null && cell !== '');
    if (!hasData) continue;

    const rowSummary = [
      row[0] !== null ? `STT:${row[0]}` : '',
      row[1] !== null ? `Col1:${row[1]}` : '',
      row[2] !== null ? `Col2:${row[2]}` : '',
      row[4] !== null ? `LT:${row[4]}` : '',
      row[5] !== null ? `TH:${row[5]}` : '',
      row[6] !== null ? `Lop:${row[6]}` : '',
      row[7] !== null ? `Phong:${row[7]}` : '',
      row[8] !== null ? `Nhom:${row[8]}` : '',
      row[9] !== null ? `SiSo:${row[9]}` : '',
      row[40] !== null && row[40] !== undefined ? `Note1:${row[40]}` : '',
      row[41] !== null && row[41] !== undefined ? `Note2:${row[41]}` : '',
      row[42] !== null && row[42] !== undefined ? `Note3:${row[42]}` : '',
      row[43] !== null && row[43] !== undefined ? `Note4:${row[43]}` : '',
    ].filter(Boolean).join(' | ');

    if (rowSummary) {
      console.log(`R${r.toString().padStart(3, '0')}: ${rowSummary}`);
    }
  }
}
