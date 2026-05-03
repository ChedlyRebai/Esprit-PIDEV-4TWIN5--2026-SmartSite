# 🔧 Consumption History & Export - Complete Fix

## Problem Summary
The consumption history feature was not working because:
1. Frontend was calling the wrong API endpoint
2. Frontend was using incorrect parameter names
3. Backend export endpoint didn't exist in the consumption history controller

## Root Causes Identified

### 1. Wrong API Endpoint
- **Frontend was calling**: `/api/materials/consumption-history`
- **Correct endpoint**: `/api/consumption-history`
- **Reason**: The consumption history has its own dedicated controller at `/consumption-history`, not under `/materials`

### 2. Wrong Parameter Names
- **Frontend was using**: `type` parameter
- **Backend expects**: `flowType` parameter
- **Response format mismatch**: Frontend expected `data.entries`, backend returns `data.data`

### 3. Missing Export Endpoint
- The consumption history controller didn't have an export endpoint
- The materials controller had one, but it was using the wrong model

## Changes Made

### 1. Frontend: `apps/frontend/src/app/pages/materials/ConsumptionHistory.tsx`

#### Fixed `loadHistory()` function:
```typescript
// BEFORE
const { data } = await axios.get('/api/materials/consumption-history', { params });
if (data && data.entries) {
  setEntries(data.entries);
}

// AFTER
const { data } = await axios.get('/api/consumption-history', { params });
if (data && data.data) {
  setEntries(data.data);
}
```

**Changes:**
- ✅ Corrected endpoint to `/api/consumption-history`
- ✅ Updated response parsing to use `data.data` (matches backend response)
- ✅ Fixed parameter name from `type` to `flowType`

#### Fixed `handleExport()` function:
```typescript
// BEFORE
const response = await axios.get('/api/materials/consumption-history/export', {
  params,
  responseType: 'blob'
});

// AFTER
const response = await axios.get('/api/consumption-history/export', {
  params,
  responseType: 'blob'
});
```

**Changes:**
- ✅ Corrected endpoint to `/api/consumption-history/export`
- ✅ Fixed parameter name from `type` to `flowType`
- ✅ Added detailed logging for debugging

### 2. Backend: `apps/backend/materials-service/src/materials/controllers/consumption-history.controller.ts`

#### Added imports:
```typescript
import { Res } from '@nestjs/common';
import { Response } from 'express';
```

#### Added export endpoint:
```typescript
@Get('export')
@HttpCode(HttpStatus.OK)
async exportHistory(
  @Query() filters: HistoryFiltersDto,
  @Res() res: Response,
) {
  try {
    this.logger.log(
      `GET /consumption-history/export - Filtres: ${JSON.stringify(filters)}`,
    );

    const result = await this.historyService.exportToExcel(filters);
    
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=consumption_history_${Date.now()}.xlsx`,
    );
    res.send(result);
  } catch (error) {
    this.logger.error(`❌ Export failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
}
```

**Changes:**
- ✅ Added `@Get('export')` route before `@Get()` to avoid route conflicts
- ✅ Accepts `HistoryFiltersDto` for filtering
- ✅ Returns Excel file with proper headers
- ✅ Error handling with proper HTTP status codes

### 3. Backend: `apps/backend/materials-service/src/materials/services/consumption-history.service.ts`

#### Added `exportToExcel()` method:
```typescript
async exportToExcel(filters: HistoryFiltersDto): Promise<Buffer> {
  try {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historique Consommation');

    // Build query from filters
    const query: any = {};
    // ... filter logic ...

    // Fetch data
    const entries = await this.historyModel
      .find(query)
      .sort({ date: -1 })
      .limit(10000)
      .lean()
      .exec();

    // Configure columns
    worksheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Matériau', key: 'materialName', width: 30 },
      { header: 'Code', key: 'materialCode', width: 15 },
      { header: 'Catégorie', key: 'materialCategory', width: 20 },
      { header: 'Site', key: 'siteName', width: 25 },
      { header: 'Type', key: 'flowType', width: 15 },
      { header: 'Quantité', key: 'quantity', width: 12 },
      { header: 'Unité', key: 'materialUnit', width: 10 },
      { header: 'Stock Avant', key: 'stockBefore', width: 12 },
      { header: 'Stock Après', key: 'stockAfter', width: 12 },
      { header: 'Anomalie', key: 'anomalyType', width: 15 },
      { header: 'Score Anomalie', key: 'anomalyScore', width: 15 },
      { header: 'Sévérité', key: 'anomalySeverity', width: 12 },
      { header: 'Raison', key: 'reason', width: 30 },
      { header: 'Enregistré par', key: 'recordedBy', width: 20 },
    ];

    // Add data rows
    entries.forEach((entry: any) => {
      worksheet.addRow({
        date: new Date(entry.date || entry.createdAt).toLocaleString('fr-FR'),
        materialName: entry.materialName,
        // ... other fields ...
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    this.logger.log(`✅ Export Excel généré: ${entries.length} entrées`);
    return buffer;
  } catch (error) {
    this.logger.error(`❌ Erreur export Excel: ${error.message}`);
    throw error;
  }
}
```

**Features:**
- ✅ Supports all filter types: materialId, siteId, date range, flowType, anomalyType, etc.
- ✅ Exports up to 10,000 records
- ✅ Includes 15 columns with relevant data
- ✅ Formatted Excel file with styled header
- ✅ Proper error handling and logging

## API Endpoints

### Get Consumption History
- **Route**: `GET /api/consumption-history`
- **Parameters**:
  - `materialId` (optional) - Filter by material
  - `siteId` (optional) - Filter by site
  - `startDate` (optional) - Start date for range
  - `endDate` (optional) - End date for range
  - `flowType` (optional) - Filter by flow type (IN, OUT, ADJUSTMENT, etc.)
  - `anomalyType` (optional) - Filter by anomaly type
  - `anomalySeverity` (optional) - Filter by severity
  - `page` (optional, default: 1) - Page number
  - `limit` (optional, default: 50) - Records per page
  - `sortBy` (optional, default: 'date') - Sort field
  - `sortOrder` (optional, default: 'desc') - Sort order
- **Response**: 
  ```json
  {
    "data": [...],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 50,
      "totalPages": 2,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "appliedFilters": {...}
  }
  ```

### Export Consumption History
- **Route**: `GET /api/consumption-history/export`
- **Parameters**: Same as above
- **Response**: Excel file (.xlsx) with columns:
  - Date
  - Material Name
  - Code
  - Category
  - Site
  - Type (IN, OUT, ADJUSTMENT, etc.)
  - Quantity
  - Unit
  - Stock Before
  - Stock After
  - Anomaly Type
  - Anomaly Score
  - Severity
  - Reason
  - Recorded By

## Testing Instructions

### Test 1: Load Consumption History
1. Navigate to Materials → Site Consumption Tracking
2. Select a site from the dropdown
3. Click the "History" tab
4. Verify that consumption records load without errors
5. Check browser console for logs starting with "📤 Loading consumption history"

### Test 2: Filter History
1. In the History tab, click "Filters"
2. Set date range (e.g., last 7 days)
3. Select a flow type (e.g., "Out")
4. Click "Refresh"
5. Verify filtered results display correctly

### Test 3: Export History
1. In the History tab, click "Export" button
2. Browser should download `consumption_history_[timestamp].xlsx`
3. Open the Excel file and verify:
   - Header row is formatted (blue background, white text)
   - All columns are present
   - Data is correctly populated
   - Dates are formatted in French locale

### Test 4: Export with Filters
1. Set filters (date range, flow type, etc.)
2. Click "Export"
3. Verify exported file contains only filtered records

## Verification Checklist
- ✅ Frontend compiles without errors
- ✅ Backend compiles without errors
- ✅ Correct API endpoint paths
- ✅ Correct parameter names (flowType, not type)
- ✅ Correct response format parsing
- ✅ Export endpoint implemented
- ✅ Excel file generation working
- ✅ Error handling implemented
- ✅ Logging added for debugging

## Files Modified
1. `apps/frontend/src/app/pages/materials/ConsumptionHistory.tsx`
2. `apps/backend/materials-service/src/materials/controllers/consumption-history.controller.ts`
3. `apps/backend/materials-service/src/materials/services/consumption-history.service.ts`

## Status
✅ **COMPLETE** - Consumption history loading and export functionality is now fully working.

## Next Steps (Optional)
- Add more export formats (CSV, PDF)
- Add email export functionality
- Add scheduled exports
- Add export history tracking
