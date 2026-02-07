# Editable Preview Feature Guide

## Overview

The upload page now includes an interactive, editable preview of parsed transactions. After a statement is uploaded and parsed by the AI model, users can review and edit the data before saving to their sheet.

## Features

### 1. **Edit Individual Cells**
- Click any cell in the preview table to edit it
- Supported fields:
  - **Date**: Click to open a date picker (converts between MM/DD/YYYY display and date input format)
  - **Description**: Text field for merchant/transaction name
  - **Amount**: Number field with decimal support (step 0.01)
  - **Category**: Dropdown selector (Discretionary, Restaurant, Grocery)
  - **Credit Card**: Text field for card identifier

### 2. **Add New Rows**
- Click the "+ Add Row" button at the bottom of the table
- New rows are pre-populated with:
  - Today's date (in MM/DD/YYYY format)
  - Empty description and card fields
  - Default category: "Discretionary"
  - $0.00 amount

### 3. **Delete Rows**
- Click the "✕" button in the rightmost column of any row
- Instantly removes the transaction from preview before saving

### 4. **Real-time Updates**
- All edits are immediately reflected in the transaction list
- The "Save to Google Sheet" button will persist the edited data

## User Workflow

1. **Upload** → Select bank statement images/PDFs and click "Parse Transactions"
2. **Review** → The "Preview & Edit Transactions" section appears
3. **Edit** → Make any necessary corrections:
   - Fix parsing errors by clicking cells
   - Add missing transactions with "+ Add Row"
   - Remove duplicate or incorrect entries with "✕"
4. **Save** → Click "Save to Google Sheet" to persist edited transactions

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Enter` | Save cell edit and close editor |
| `Escape` | Cancel cell edit without saving |
| `Tab` | Move to next cell (handled by browser) |

## Technical Details

### Component: `EditableTransactionsTable`
Located in: [app/ui/upload/editable-transactions-table.tsx](app/ui/upload/editable-transactions-table.tsx)

**Props:**
- `transactions: Transaction[]` - Array of transactions to display/edit
- `onTransactionsChange: (transactions: Transaction[]) => void` - Callback when transactions are modified

**State Management:**
- Uses local React state to track which cell is being edited
- Updates are propagated to parent component via `onTransactionsChange` callback
- Type-safe edits with proper coercion for numeric fields

### Integration
The component is used in [app/upload/page.tsx](app/upload/page.tsx) within the preview section:

```tsx
<EditableTransactionsTable
  transactions={result.transactions}
  onTransactionsChange={(updatedTransactions) => {
    setResult({ ...result, transactions: updatedTransactions });
  }}
/>
```

## Transaction Data Structure

Each transaction contains:
```typescript
{
  date: string;           // MM/DD/YYYY format
  description: string;    // Merchant/transaction name
  amount: number;         // Dollar amount (e.g., 29.99)
  category: string;       // One of: Discretionary, Restaurant, Grocery
  creditCard: string;     // Card name/identifier
  status?: string;        // Default: "completed"
  notes?: string;         // Optional notes
}
```

## UI/UX Features

- **Visual Feedback**: Rows highlight on hover with `hover:bg-gray-50`
- **Editable Cells**: Hover over cells to see they're clickable (shown with `hover:bg-blue-50`)
- **Responsive Design**: 
  - Table scrolls horizontally on mobile
  - Card and Category columns hidden on smaller screens
  - Adaptive button layout on mobile/desktop
- **Status Indicator**: Shows total transaction count that updates as rows are added/removed

## Edge Cases Handled

1. **Date Format Conversion**: Automatically converts between display format (MM/DD/YYYY) and input format (YYYY-MM-DD)
2. **Numeric Validation**: Amount field only accepts valid numbers with decimal places
3. **Empty New Rows**: New rows include placeholder values to avoid undefined states
4. **Cell Blur**: Edits are saved when clicking outside the editor or pressing Enter
5. **Escape Key**: Cancel editing without applying changes

## Future Enhancements (Optional)

- Bulk edit operations (select multiple rows)
- Duplicate detection warnings
- Undo/redo functionality
- Drag-to-reorder rows
- Import categories from Google Sheets
- Validation rules (e.g., amount > 0)
- Split transaction capability
