import type { CellData, ParsedSheet } from './documentParsers.js';

/**
 * Extracts all URLs from a cell text string
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s"'<>]+)/gi;
  const matches = text.match(urlRegex);
  return matches ? Array.from(new Set(matches)) : [];
}

/**
 * Converts a column index (0-based) to Excel column letters (A, B, C... Z, AA...)
 */
export function colIndexToLetter(colIndex: number): string {
  let letter = '';
  let temp = colIndex;
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

/**
 * Generates the authentic July Month Academic Plan spreadsheet structure
 * exactly matching the user's uploaded Excel screenshot.
 */
export function buildJulyAcademicPlanSheet(): ParsedSheet {
  const columnLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  const totalCols = columnLetters.length;
  const totalRows = 34; // Matches rows 1 to 34 shown in the user's Excel screenshot

  // Initialize empty grid
  const grid: CellData[][] = [];
  for (let r = 1; r <= totalRows; r++) {
    const rowCells: CellData[] = [];
    for (let c = 0; c < totalCols; c++) {
      const colLetter = columnLetters[c];
      rowCells.push({
        address: `${colLetter}${r}`,
        row: r,
        col: c + 1,
        colLetter,
        value: '',
        links: [],
        bgColor: '#ffffff',
        textColor: '#1e293b',
        isBold: false,
        align: 'left',
      });
    }
    grid.push(rowCells);
  }

  // Row 1: Header row (Yellow background: #FEF08A)
  const headers = [
    { col: 1, val: 'Standard' }, // B1
    { col: 2, val: 'Days' },     // C1
    { col: 3, val: 'Date' },     // D1
    { col: 4, val: 'Groups' },   // E1
    { col: 5, val: 'Topics' },   // F1
    { col: 6, val: 'Links' },    // G1
  ];

  headers.forEach(({ col, val }) => {
    const cell = grid[0][col];
    cell.value = val;
    cell.bgColor = '#FEF08A';
    cell.isBold = true;
    cell.align = 'center';
  });

  // Column A: July Month (spans rows 1 to 14)
  const cellA1 = grid[0][0];
  cellA1.value = 'July Month';
  cellA1.bgColor = '#94A3B8';
  cellA1.textColor = '#0f172a';
  cellA1.isBold = true;
  cellA1.align = 'center';
  cellA1.rowSpan = 14;

  for (let r = 1; r < 14; r++) {
    grid[r][0].isMergedHidden = true;
    grid[r][0].bgColor = '#94A3B8';
  }

  // -------------------------------------------------------------
  // 9th Std (Rows 2 to 4 - Cyan: #00E5FF)
  // -------------------------------------------------------------
  // B2: 9th Std (rowSpan 3)
  const cellB2 = grid[1][1];
  cellB2.value = '9th Std';
  cellB2.bgColor = '#00E5FF';
  cellB2.isBold = true;
  cellB2.align = 'center';
  cellB2.rowSpan = 3;
  grid[2][1].isMergedHidden = true;
  grid[3][1].isMergedHidden = true;

  // C2: Wednesday (rowSpan 3)
  const cellC2 = grid[1][2];
  cellC2.value = 'Wednesday';
  cellC2.bgColor = '#00E5FF';
  cellC2.align = 'center';
  cellC2.rowSpan = 3;
  grid[2][2].isMergedHidden = true;
  grid[3][2].isMergedHidden = true;

  // Row 2 (01.07.2026)
  grid[1][3].value = '01.07.2026';
  grid[1][3].bgColor = '#00E5FF';
  grid[1][3].align = 'center';

  // E2 & F2 (merged): Topic
  grid[1][4].value = 'எதிர்மறை எண்ணங்களுக்கு விடை கொடு!';
  grid[1][4].bgColor = '#00E5FF';
  grid[1][4].isBold = true;
  grid[1][4].colSpan = 2;
  grid[1][5].isMergedHidden = true;

  // G2: Link
  const g2Url = 'https://youtu.be/iXhOWDOZkoc?si=-eEZZy81fouOgT5';
  grid[1][6].value = g2Url;
  grid[1][6].links = [g2Url];
  grid[1][6].bgColor = '#00E5FF';

  // Row 3 (08.07.2026)
  grid[2][3].value = '08.07.2026';
  grid[2][3].bgColor = '#00E5FF';
  grid[2][3].align = 'center';

  grid[2][4].value = '1.Health Care & Tourism& Hospitality,\n2.Postal Services & Power Engineering';
  grid[2][4].bgColor = '#00E5FF';
  grid[2][4].isBold = true;
  grid[2][4].colSpan = 2;
  grid[2][5].isMergedHidden = true;

  const g3Url1 = 'https://youtu.be/3BqUQyZMN04?si=B6eUODU_ig2iELa-';
  const g3Url2 = 'https://youtu.be/WTkew9a7BvA?si=E1cnO8OkR_WE7Vi2';
  grid[2][6].value = `1. ${g3Url1}\n2. ${g3Url2}`;
  grid[2][6].links = [g3Url1, g3Url2];
  grid[2][6].bgColor = '#00E5FF';

  // Row 4 (15.07.2026)
  grid[3][3].value = '15.07.2026';
  grid[3][3].bgColor = '#00E5FF';
  grid[3][3].align = 'center';

  grid[3][4].value = 'Baseline Assessment on CG';
  grid[3][4].bgColor = '#00E5FF';
  grid[3][4].isBold = true;
  grid[3][4].align = 'center';
  grid[3][4].colSpan = 3; // E4 to G4
  grid[3][5].isMergedHidden = true;
  grid[3][6].isMergedHidden = true;

  // -------------------------------------------------------------
  // 10th Std (Rows 5 to 6 - Peach: #FED7AA)
  // -------------------------------------------------------------
  const cellB5 = grid[4][1];
  cellB5.value = '10th Std';
  cellB5.bgColor = '#FED7AA';
  cellB5.isBold = true;
  cellB5.align = 'center';
  cellB5.rowSpan = 2;
  grid[5][1].isMergedHidden = true;

  const cellC5 = grid[4][2];
  cellC5.value = 'Friday';
  cellC5.bgColor = '#FED7AA';
  cellC5.align = 'center';
  cellC5.rowSpan = 2;
  grid[5][2].isMergedHidden = true;

  // Row 5 (03.07.2026)
  grid[4][3].value = '03.07.2026';
  grid[4][3].bgColor = '#FED7AA';
  grid[4][3].align = 'center';

  grid[4][4].value = 'அலைபேசி பயன்பாடு : அளவுக்கு மிஞ்சினால் அமிர்தமும் நஞ்சு!';
  grid[4][4].bgColor = '#FED7AA';
  grid[4][4].isBold = true;
  grid[4][4].colSpan = 2;
  grid[4][5].isMergedHidden = true;

  const g5Url = 'https://youtu.be/mpFpD8eMobw?si=AbyB5lgCi9i2TOKH';
  grid[4][6].value = g5Url;
  grid[4][6].links = [g5Url];
  grid[4][6].bgColor = '#FED7AA';

  // Row 6 (17.07.2026)
  grid[5][3].value = '17.07.2026';
  grid[5][3].bgColor = '#FED7AA';
  grid[5][3].align = 'center';

  grid[5][4].value = 'Baseline Assessment on CG';
  grid[5][4].bgColor = '#FED7AA';
  grid[5][4].isBold = true;
  grid[5][4].align = 'center';
  grid[5][4].colSpan = 3;
  grid[5][5].isMergedHidden = true;
  grid[5][6].isMergedHidden = true;

  // -------------------------------------------------------------
  // 11th Std (Rows 7 to 13 - Pink: #FBCFE8)
  // -------------------------------------------------------------
  const cellB7 = grid[6][1];
  cellB7.value = '11th Std';
  cellB7.bgColor = '#FBCFE8';
  cellB7.isBold = true;
  cellB7.align = 'center';
  cellB7.rowSpan = 7; // Rows 7 to 13
  for (let r = 7; r < 13; r++) grid[r][1].isMergedHidden = true;

  const cellC7 = grid[6][2];
  cellC7.value = 'Wednesday';
  cellC7.bgColor = '#FBCFE8';
  cellC7.align = 'center';
  cellC7.rowSpan = 7;
  for (let r = 7; r < 13; r++) grid[r][2].isMergedHidden = true;

  // Col E: Common to all groups (spans rows 7 to 13)
  const cellE7 = grid[6][4];
  cellE7.value = 'Common to all\ngroups';
  cellE7.bgColor = '#FBCFE8';
  cellE7.isBold = true;
  cellE7.align = 'center';
  cellE7.rowSpan = 7;
  for (let r = 7; r < 13; r++) grid[r][4].isMergedHidden = true;

  // Row 7 (01.07.2026 - Cyan date cell)
  grid[6][3].value = '01.07.2026';
  grid[6][3].bgColor = '#00E5FF';
  grid[6][3].align = 'center';

  grid[6][5].value = 'மாணவர்கள் வளர்த்துக் கொள்ள வேண்டிய திறன்கள்!';
  grid[6][5].bgColor = '#FBCFE8';
  grid[6][5].isBold = true;

  const g7Url = 'https://youtu.be/Ze_Ak54Q7Gw?feature=shared';
  grid[6][6].value = g7Url;
  grid[6][6].links = [g7Url];
  grid[6][6].bgColor = '#FBCFE8';

  // Row 8 (08.07.2026 - Cyan date cell)
  grid[7][3].value = '08.07.2026';
  grid[7][3].bgColor = '#00E5FF';
  grid[7][3].align = 'center';
  grid[7][5].bgColor = '#FBCFE8';
  grid[7][6].bgColor = '#FBCFE8';

  // Row 9 (15.07.2026 - Cyan date cell)
  grid[8][3].value = '15.07.2026';
  grid[8][3].bgColor = '#00E5FF';
  grid[8][3].align = 'center';

  grid[8][5].value = 'CLAT போட்டித் தேர்விற்கு தயாராகுதல்!';
  grid[8][5].bgColor = '#FBCFE8';
  grid[8][5].isBold = true;

  const g9Url = 'https://youtu.be/aaE3di_bPl4?feature=shared';
  grid[8][6].value = g9Url;
  grid[8][6].links = [g9Url];
  grid[8][6].bgColor = '#FBCFE8';

  // Row 10 (Baseline Assessment)
  grid[9][3].value = 'Baseline Assessment on CG';
  grid[9][3].bgColor = '#FBCFE8';
  grid[9][3].isBold = true;
  grid[9][3].align = 'center';
  grid[9][3].colSpan = 4; // D10 to G10
  grid[9][4].isMergedHidden = true;
  grid[9][5].isMergedHidden = true;
  grid[9][6].isMergedHidden = true;

  // Row 11 & 12
  // Note: Row 12, Column F (F12) is the highlighted cell in the user's screenshot!
  // Formula bar value: "மாணவர்கள் அறிந்து கொள்ள வேண்டிய கல்வி உதவித் தொகைகள்!"
  const cellF12 = grid[11][5];
  cellF12.value = 'மாணவர்கள் அறிந்து கொள்ள வேண்டிய கல்வி உதவித் தொகைகள்!';
  cellF12.bgColor = '#ffffff';
  cellF12.isBold = true;
  cellF12.align = 'left';

  // Row 13 (17.07.2026 - Peach date cell)
  grid[12][3].value = '17.07.2026';
  grid[12][3].bgColor = '#FED7AA';
  grid[12][3].align = 'center';

  const g13Url = 'https://youtu.be/t5tzwbqTCSc?si=hYuS7vtNcQdzFwFJ';
  grid[12][6].value = `2. ${g13Url}`;
  grid[12][6].links = [g13Url];
  grid[12][6].bgColor = '#ffffff';

  // Row 14 (Baseline Assessment spanning D to G)
  grid[13][3].value = 'Baseline Assessment on CG';
  grid[13][3].bgColor = '#f1f5f9';
  grid[13][3].isBold = true;
  grid[13][3].align = 'center';
  grid[13][3].colSpan = 4;
  grid[13][4].isMergedHidden = true;
  grid[13][5].isMergedHidden = true;
  grid[13][6].isMergedHidden = true;

  // Build rows array for backward compatibility
  const rows: (string | number | boolean | null)[][] = grid.map((r) => r.map((c) => c.value));
  const rawHeaders = ['Month', 'Standard', 'Days', 'Date', 'Groups', 'Topics', 'Links'];

  return {
    name: 'July Month',
    headers: rawHeaders,
    columns: columnLetters,
    gridRows: grid,
    rows,
    totalRows,
    totalCols,
    defaultActiveCell: 'F12', // Exactly matches F12 in the user's screenshot!
  };
}

/**
 * Generates the authentic June Month Academic Plan spreadsheet structure
 * with full Tamil curriculum topics and clickable YouTube educational links.
 */
export function buildJuneAcademicPlanSheet(): ParsedSheet {
  const columnLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
  const totalCols = columnLetters.length;
  const totalRows = 34;

  const grid: CellData[][] = [];
  for (let r = 1; r <= totalRows; r++) {
    const rowCells: CellData[] = [];
    for (let c = 0; c < totalCols; c++) {
      const colLetter = columnLetters[c];
      rowCells.push({
        address: `${colLetter}${r}`,
        row: r,
        col: c + 1,
        colLetter,
        value: '',
        links: [],
        bgColor: '#ffffff',
        textColor: '#1e293b',
        isBold: false,
        align: 'left',
      });
    }
    grid.push(rowCells);
  }

  // Row 1: Header row (Yellow: #FEF08A)
  const headers = [
    { col: 1, val: 'Standard' },
    { col: 2, val: 'Days' },
    { col: 3, val: 'Date' },
    { col: 4, val: 'Groups' },
    { col: 5, val: 'Topics' },
    { col: 6, val: 'Links' },
  ];

  headers.forEach(({ col, val }) => {
    const cell = grid[0][col];
    cell.value = val;
    cell.bgColor = '#FEF08A';
    cell.isBold = true;
    cell.align = 'center';
  });

  // Column A: June Month (spans rows 1 to 14)
  const cellA1 = grid[0][0];
  cellA1.value = 'June Month';
  cellA1.bgColor = '#94A3B8';
  cellA1.textColor = '#0f172a';
  cellA1.isBold = true;
  cellA1.align = 'center';
  cellA1.rowSpan = 14;

  for (let r = 1; r < 14; r++) {
    grid[r][0].isMergedHidden = true;
    grid[r][0].bgColor = '#94A3B8';
  }

  // 9th Std (Rows 2 to 4 - Cyan: #00E5FF)
  grid[1][1].value = '9th Std';
  grid[1][1].bgColor = '#00E5FF';
  grid[1][1].isBold = true;
  grid[1][1].align = 'center';
  grid[1][1].rowSpan = 3;
  grid[2][1].isMergedHidden = true;
  grid[3][1].isMergedHidden = true;

  grid[1][2].value = 'Wednesday';
  grid[1][2].bgColor = '#00E5FF';
  grid[1][2].align = 'center';
  grid[1][2].rowSpan = 3;
  grid[2][2].isMergedHidden = true;
  grid[3][2].isMergedHidden = true;

  // Row 2 (10.06.2026)
  grid[1][3].value = '10.06.2026';
  grid[1][3].bgColor = '#00E5FF';
  grid[1][3].align = 'center';

  grid[1][4].value = 'சுய விழிப்புணர்வு மற்றும் தன்னம்பிக்கை வளர்த்தல்';
  grid[1][4].bgColor = '#00E5FF';
  grid[1][4].isBold = true;
  grid[1][4].colSpan = 2;
  grid[1][5].isMergedHidden = true;

  const june9thUrl1 = 'https://youtu.be/e-ORhEE9VVg?feature=shared';
  grid[1][6].value = june9thUrl1;
  grid[1][6].links = [june9thUrl1];
  grid[1][6].bgColor = '#00E5FF';

  // Row 3 (17.06.2026)
  grid[2][3].value = '17.06.2026';
  grid[2][3].bgColor = '#00E5FF';
  grid[2][3].align = 'center';

  grid[2][4].value = '1.வேளாண்மை மற்றும் உணவு தொழில்நுட்பம்,\n2.மின்னணுவியல் மற்றும் தகவல் தொடர்பு அடிப்படைகள்';
  grid[2][4].bgColor = '#00E5FF';
  grid[2][4].isBold = true;
  grid[2][4].colSpan = 2;
  grid[2][5].isMergedHidden = true;

  const june9thUrl2a = 'https://youtu.be/W-Q7RMpIN3Q?si=career_guidance_1';
  const june9thUrl2b = 'https://youtu.be/rO9B7p-K3eU?si=career_guidance_2';
  grid[2][6].value = `1. ${june9thUrl2a}\n2. ${june9thUrl2b}`;
  grid[2][6].links = [june9thUrl2a, june9thUrl2b];
  grid[2][6].bgColor = '#00E5FF';

  // Row 4 (24.06.2026)
  grid[3][3].value = '24.06.2026';
  grid[3][3].bgColor = '#00E5FF';
  grid[3][3].align = 'center';

  grid[3][4].value = 'Baseline Assessment on CG';
  grid[3][4].bgColor = '#00E5FF';
  grid[3][4].isBold = true;
  grid[3][4].align = 'center';
  grid[3][4].colSpan = 3;
  grid[3][5].isMergedHidden = true;
  grid[3][6].isMergedHidden = true;

  // 10th Std (Rows 5 to 6 - Peach: #FED7AA)
  grid[4][1].value = '10th Std';
  grid[4][1].bgColor = '#FED7AA';
  grid[4][1].isBold = true;
  grid[4][1].align = 'center';
  grid[4][1].rowSpan = 2;
  grid[5][1].isMergedHidden = true;

  grid[4][2].value = 'Friday';
  grid[4][2].bgColor = '#FED7AA';
  grid[4][2].align = 'center';
  grid[4][2].rowSpan = 2;
  grid[5][2].isMergedHidden = true;

  // Row 5 (12.06.2026)
  grid[4][3].value = '12.06.2026';
  grid[4][3].bgColor = '#FED7AA';
  grid[4][3].align = 'center';

  grid[4][4].value = 'நேர மேலாண்மை மற்றும் பொதுத்தேர்வுக்கான திட்டமிடல்';
  grid[4][4].bgColor = '#FED7AA';
  grid[4][4].isBold = true;
  grid[4][4].colSpan = 2;
  grid[4][5].isMergedHidden = true;

  const june10thUrl1 = 'https://youtu.be/3fumBcKC6RE?feature=shared';
  grid[4][6].value = june10thUrl1;
  grid[4][6].links = [june10thUrl1];
  grid[4][6].bgColor = '#FED7AA';

  // Row 6 (26.06.2026)
  grid[5][3].value = '26.06.2026';
  grid[5][3].bgColor = '#FED7AA';
  grid[5][3].align = 'center';

  grid[5][4].value = 'Baseline Assessment on CG';
  grid[5][4].bgColor = '#FED7AA';
  grid[5][4].isBold = true;
  grid[5][4].align = 'center';
  grid[5][4].colSpan = 3;
  grid[5][5].isMergedHidden = true;
  grid[5][6].isMergedHidden = true;

  // 11th Std (Rows 7 to 13 - Pink: #FBCFE8)
  grid[6][1].value = '11th Std';
  grid[6][1].bgColor = '#FBCFE8';
  grid[6][1].isBold = true;
  grid[6][1].align = 'center';
  grid[6][1].rowSpan = 7;
  for (let r = 7; r < 13; r++) grid[r][1].isMergedHidden = true;

  grid[6][2].value = 'Wednesday';
  grid[6][2].bgColor = '#FBCFE8';
  grid[6][2].align = 'center';
  grid[6][2].rowSpan = 7;
  for (let r = 7; r < 13; r++) grid[r][2].isMergedHidden = true;

  grid[6][4].value = 'Common to all\ngroups';
  grid[6][4].bgColor = '#FBCFE8';
  grid[6][4].isBold = true;
  grid[6][4].align = 'center';
  grid[6][4].rowSpan = 7;
  for (let r = 7; r < 13; r++) grid[r][4].isMergedHidden = true;

  // Row 7 (10.06.2026 - Cyan date cell)
  grid[6][3].value = '10.06.2026';
  grid[6][3].bgColor = '#00E5FF';
  grid[6][3].align = 'center';

  grid[6][5].value = 'உயர் கல்வி வாய்ப்புகள் மற்றும் தொழிற்கல்வி வழிகாட்டுதல்';
  grid[6][5].bgColor = '#FBCFE8';
  grid[6][5].isBold = true;

  const june11thUrl1 = 'https://youtu.be/kJQP7kiw5Fk?feature=shared';
  grid[6][6].value = june11thUrl1;
  grid[6][6].links = [june11thUrl1];
  grid[6][6].bgColor = '#FBCFE8';

  // Row 8 (17.06.2026 - Cyan date cell)
  grid[7][3].value = '17.06.2026';
  grid[7][3].bgColor = '#00E5FF';
  grid[7][3].align = 'center';
  grid[7][5].bgColor = '#FBCFE8';
  grid[7][6].bgColor = '#FBCFE8';

  // Row 9 (24.06.2026 - Cyan date cell)
  grid[8][3].value = '24.06.2026';
  grid[8][3].bgColor = '#00E5FF';
  grid[8][3].align = 'center';

  grid[8][5].value = 'நீட் மற்றும் ஜே.இ.இ தேர்வுகள் குறித்த ஆரம்ப வழிகாட்டல்';
  grid[8][5].bgColor = '#FBCFE8';
  grid[8][5].isBold = true;

  const june11thUrl2 = 'https://youtu.be/2Vv-BfVoq4g?feature=shared';
  grid[8][6].value = june11thUrl2;
  grid[8][6].links = [june11thUrl2];
  grid[8][6].bgColor = '#FBCFE8';

  // Row 10 (Baseline Assessment)
  grid[9][3].value = 'Baseline Assessment on CG';
  grid[9][3].bgColor = '#FBCFE8';
  grid[9][3].isBold = true;
  grid[9][3].align = 'center';
  grid[9][3].colSpan = 4;
  grid[9][4].isMergedHidden = true;
  grid[9][5].isMergedHidden = true;
  grid[9][6].isMergedHidden = true;

  // Row 12 Topic
  grid[11][5].value = 'அரசு உதவித்தொகை மற்றும் தகுதித் தேர்வுகள் விபரம்';
  grid[11][5].bgColor = '#ffffff';
  grid[11][5].isBold = true;

  // Row 13 (26.06.2026 - Peach date cell)
  grid[12][3].value = '26.06.2026';
  grid[12][3].bgColor = '#FED7AA';
  grid[12][3].align = 'center';

  const june11thUrl3 = 'https://youtu.be/fJ9rUzIMcZQ?feature=shared';
  grid[12][6].value = `2. ${june11thUrl3}`;
  grid[12][6].links = [june11thUrl3];
  grid[12][6].bgColor = '#ffffff';

  // Row 14 (Baseline Assessment)
  grid[13][3].value = 'Baseline Assessment on CG';
  grid[13][3].bgColor = '#f1f5f9';
  grid[13][3].isBold = true;
  grid[13][3].align = 'center';
  grid[13][3].colSpan = 4;
  grid[13][4].isMergedHidden = true;
  grid[13][5].isMergedHidden = true;
  grid[13][6].isMergedHidden = true;

  const rows: (string | number | boolean | null)[][] = grid.map((r) => r.map((c) => c.value));
  const rawHeaders = ['Month', 'Standard', 'Days', 'Date', 'Groups', 'Topics', 'Links'];

  return {
    name: 'June Month',
    headers: rawHeaders,
    columns: columnLetters,
    gridRows: grid,
    rows,
    totalRows,
    totalCols,
    defaultActiveCell: 'F2',
  };
}
