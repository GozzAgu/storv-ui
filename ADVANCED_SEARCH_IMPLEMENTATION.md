# Advanced Search Implementation

## Overview
A comprehensive global search system has been implemented that allows users to search across all entities in the application with advanced filtering and saved search capabilities.

## Features Implemented

### 1. Global Search
- **Search across all entities**: Receipts, Inventory (folders & items), Customers, Departments, and Staff
- **Real-time search**: Debounced search with 300ms delay for optimal performance
- **Keyboard shortcuts**: 
  - `Cmd/Ctrl + K` to open search
  - `Esc` to close
  - `Arrow Up/Down` to navigate results
  - `Enter` to select result

### 2. Advanced Filters
- **Entity type filtering**: Filter by specific entity types (Receipts, Inventory, Customers, etc.)
- **Date range filtering**: Filter results by date range
- **Status filtering**: Filter receipts by status (Completed, Pending, Refunded)
- **Quick filter buttons**: Easy access to common filters

### 3. Saved Searches
- **Save searches**: Save frequently used searches with custom names
- **Load saved searches**: Quickly load previously saved searches
- **Manage saved searches**: View, load, and delete saved searches
- **Persistent storage**: Saved searches are stored in Firestore and persist across sessions

### 4. Search Results
- **Categorized results**: Results are grouped by entity type with color-coded badges
- **Rich metadata**: Each result shows relevant information (dates, totals, status, etc.)
- **Direct navigation**: Click any result to navigate directly to the relevant page
- **Result count**: Shows total number of results found

## Files Created

### Stores
- `stores/search.ts` - Main search store managing search state, filters, and saved searches

### Components
- `components/search/GlobalSearch.vue` - Main global search component with modal interface
- `components/search/SavedSearchesModal.vue` - Modal for managing saved searches

## Integration

### Dashboard Layout
The global search has been integrated into the dashboard layout:
- **Search button** in the header (replaces the old search input)
- **Keyboard shortcut** support (Cmd/Ctrl+K)
- **Mobile-friendly** search button for smaller screens

## Usage

### Opening Search
1. Click the search button in the header
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)

### Performing a Search
1. Type your search query in the input field
2. Results will appear automatically as you type (debounced)
3. Use filters to narrow down results by entity type, date range, or status

### Saving a Search
1. Perform your search with desired filters
2. Click "Save Current" button in the saved searches section
3. Enter a name for your search
4. Click "Save"

### Loading a Saved Search
1. Open the search modal
2. Scroll to "Saved Searches" section
3. Click on a saved search to load it
4. Or click "Manage" to open the saved searches modal

### Using Filters
1. Click on entity type buttons to filter by specific types
2. Click "Advanced Filters" to expand date range and status filters
3. Click "Clear Filters" to reset all filters

## Search Capabilities

### Receipts
- Search by receipt number
- Search by customer name or email
- Search by item names in receipts
- Filter by date range
- Filter by status (completed, pending, refunded)

### Inventory
- Search folders by name or description
- Search items by any field value (name, serial number, SKU, etc.)
- Results show folder context for items

### Customers
- Search by name, email, phone, or address
- Filter by last order date range
- Shows order count and total spent

### Departments
- Search by name or description

### Staff
- Search by full name, email, or phone
- Shows department and role information

## Technical Details

### Search Store (`stores/search.ts`)
- Manages search query and filters
- Performs search across all entity types
- Handles saved searches CRUD operations
- Integrates with Firestore for persistence

### Performance Optimizations
- Debounced search input (300ms delay)
- Lazy loading of entity data (only fetches when needed)
- Efficient filtering and sorting
- Results sorted by relevance (exact matches first)

### Firestore Collections
- `savedSearches` - Stores user's saved searches
  - Fields: `name`, `query`, `filters`, `createdBy`, `createdAt`, `updatedAt`

## Future Enhancements

Potential improvements that could be added:
1. **Search history**: Track recent searches
2. **Search suggestions**: Autocomplete suggestions based on previous searches
3. **Export results**: Export search results to CSV/Excel
4. **Advanced query syntax**: Support for operators like `AND`, `OR`, `NOT`
5. **Full-text search**: More sophisticated text matching
6. **Search analytics**: Track popular searches
7. **Shared searches**: Share saved searches with team members

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open/close search |
| `Esc` | Close search |
| `Arrow Up/Down` | Navigate results |
| `Enter` | Select result |
| `/` | Save current search (planned) |

## Notes

- Search is case-insensitive
- Partial matches are supported
- Search works across all user's data (respects permissions)
- Saved searches are user-specific (staff searches are linked to their super admin)
