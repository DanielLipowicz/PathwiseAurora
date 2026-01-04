# Release Notes

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
