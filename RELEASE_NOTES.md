# Release Notes

## 2026-01-05 - Import Dropdown and Process Extension Feature

### Added
- **Import dropdown menu**: Added "Import" dropdown in header navigation, similar to "More" dropdown
- **Extend Existing Process**: New import option to merge imported nodes into existing process without replacing current data
- **ID reassignment logic**: Automatic ID translation system that prevents conflicts when extending processes
- **Relation translation**: All choice references are automatically updated to maintain flow integrity when extending

### Changed
- **Import functionality reorganization**: Moved "Import JSON" from standalone button to "Import" dropdown menu
- **Import behavior**: "Import JSON" now replaces entire graph (existing behavior), while "Extend Existing Process" merges with existing graph

### Technical Details
- Added `extendExistingProcess()` method to ImportExportService with comprehensive ID mapping
- Implemented hierarchical ID reassignment preserving node structure (e.g., `1.2.3` → `10.2.3`)
- Added validation step using ValidationService before extending process
- Enhanced dropdown menu system to support multiple dropdowns in navigation
- All imported node IDs are automatically reassigned starting from next available root ID
- Choice targets are translated to maintain all internal references within imported flow

## 2026-01-04 - UI Improvements and Help Page Enhancement

### Added
- **Success button style**: New `success` CSS class for green primary action buttons
- **Help page tabs**: Added tabbed interface to Help page with "User Guide" and "Release Notes" tabs
- **Release Notes section**: Added comprehensive release notes history accessible from Help page

### Changed
- **New Node button styling**: Changed "New Node" buttons in header and Nodes page to use green `success` style instead of blue `primary` style for better visual distinction
- **Navigation reorganization**: Moved Help and Release Notes pages under "More" dropdown menu to simplify navigation bar

### Technical Details
- Introduced reusable `button.success` CSS class with green gradient styling
- Enhanced HelpView with tab switching functionality and release notes generation
- Improved visual consistency by using semantic button classes
- Added dropdown menu component with click-outside-to-close functionality
- Separated Help and Release Notes into independent page views
