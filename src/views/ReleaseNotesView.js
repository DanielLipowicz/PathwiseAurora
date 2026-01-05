/**
 * Release Notes View
 * Displays release notes and changelog for PathwiseAurora
 */

export class ReleaseNotesView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
  }

  /**
   * Render the release notes page
   */
  render() {
    const container = this.dom.get('releaseNotesContainer');
    if (!container) {
      console.warn('ReleaseNotesView: Container not found');
      return;
    }

    const html = `
      <div class="help-page">
        <div class="help-header">
          <h1>Release Notes</h1>
          <p class="help-subtitle">History of changes and improvements to PathwiseAurora</p>
        </div>

        <div class="help-content">
          <section class="help-section">
            <h3>2026-01-05</h3>
            <ul>
              <li>Added Import dropdown menu in header navigation</li>
              <li>Added "Extend Existing Process" feature to merge imported nodes into existing process</li>
              <li>Automatic ID reassignment prevents conflicts when extending processes</li>
              <li>All choice references are automatically translated to maintain flow integrity</li>
              <li>Moved "Import JSON" from standalone button to Import dropdown menu</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2026-01-04</h3>
            <ul>
              <li>Added success button style</li>
              <li>Separated Help and Release Notes into independent pages</li>
              <li>Added "More" dropdown menu to navigation bar</li>
              <li>Moved Help and Release Notes under "More" dropdown menu</li>
              <li>Added link list for nodes for quick navigation</li>
              <li>Added Task Clarification framework</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2025-12-03</h3>
            <ul>
              <li>Added incoming reference creation from Node View</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2025-12-02</h3>
            <ul>
              <li>Added selected path tracking to email summary</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2025-11-30</h3>
            <ul>
              <li>Added Confluence export functionality</li>
              <li>Added navigation links to nodes in Nodes View and Node List View</li>
              <li>Improved input fields to expand to content height on focus</li>
              <li>Added search and filter functionality to NODES page</li>
              <li>Updated readme file</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2025-11-27</h3>
            <ul>
              <li>Added auto-focus and navigation for newly created child nodes</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2025-11-24</h3>
            <ul>
              <li>Added comprehensive help page with user guide</li>
              <li>Added email summary generator for session exports</li>
              <li>Added Knowledge Gaps page for quality assurance and content review</li>
              <li>Added tags/notes support to history entries</li>
              <li>Modularized codebase with build system and UI enhancements</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2025-11-22</h3>
            <ul>
              <li>Added new session button</li>
            </ul>
          </section>

          <section class="help-section">
            <h3>2025-11-21</h3>
            <ul>
              <li>Initial release: Added PathwiseAurora - interactive decision flow and playbook editor</li>
              <li>Initial commit</li>
            </ul>
          </section>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}
