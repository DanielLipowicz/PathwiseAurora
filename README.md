# PathwiseAurora

**PathwiseAurora** turns complex decision processes and "what if?" scenarios into clear, guided paths your team can actually follow.  
Instead of scattered knowledge in people's heads, Slack threads, or static docs, you get a single interactive playbook for decisions and actions.

## How to Start

1. **Download repository** – Clone or download this repository to your local machine.
2. **Open `index.html`** – Simply open the `index.html` file in your web browser (no server setup required).
3. **Enjoy** – Start creating your decision flows and interactive playbooks right away!
4. **Save your work** – Use the **Export JSON** button to save your work and share it with others.

## What can you use it for?

### Designing decision flows and playbooks

- **Define process steps** – each node represents a concrete step, question, or state  
  (e.g. “Customer reports an issue”, “Payment rejected”, “Decision: discount or escalation?”).
- **Add choices** – every step can offer multiple options that lead further  
  (e.g. “VIP customer” → one path, “new customer” → another).
- **Create hierarchical structures** – build main flows and smaller sub-scenarios  
  (e.g. “Handling complaints” → “Physical product” → “Damaged in transit”).
- **Keep things consistent** – the app helps you avoid “dangling” steps, empty fields, or dead ends.

### Two ways to view your process

- **List view** – great when you want to refine wording, update steps, and quickly edit content.
- **Tile view** – a more visual map of your process, perfect for workshops, reviews, and onboarding.

### Interactive runner – like a guided scenario

- **Simulate the journey** – walk through the process the same way a customer, agent, analyst, or engineer would.
- **Step-by-step decisions** – pick options and see exactly where they lead, like an interactive story.
- **Session history** – move back a step or jump directly to a specific point in the flow at any time.
- **Share specific points** – easily start a discussion from a particular step instead of "somewhere in the middle".
- **Add comments and tags** – annotate each step in your session with comments and tags (e.g., "needs clarification", "customer reacted strongly", "requires SME review") for better documentation and follow-up.
- **New session** – start fresh sessions while preserving your graph structure.

### Finding the right step fast

- **Search and filter** – quickly find a node by ID, title, or content  
  (e.g. "chargeback", "escalation", "VIP").
- **Get back to the big picture** – clear the filter with a single shortcut and see the full process again.
- **Dedicated Nodes page** – comprehensive node management interface with its own search functionality to find nodes by ID, title, content, or choice labels.
- **Navigation links** – click on node references in incoming connections to quickly jump to related nodes in both the main view and Nodes page.
- **Auto-focus on new nodes** – when creating child nodes, the app automatically navigates to and focuses on the newly created node for immediate editing.

### Working with shared knowledge

- **Automatic saving** – your changes are stored in the browser as you work, so you don't lose progress.
- **Import** – load existing flows prepared by you or another team (e.g. incident response runbooks, sales playbooks).
- **Export** – save your flow to a file so you can:
  - share it with other teams,
  - commit it to a repository,
  - archive different process versions,
  - reuse it in other tools.
- **Export to Confluence** – generate Confluence markup format from your decision graph for easy integration into Confluence documentation.
- **Email summary** – generate session summaries in text or HTML format from your session history, perfect for sharing via email or documentation.
- **Save session flow** – export the specific path taken during a session to a JSON file for analysis and reporting.

### User experience

- **Clear split layout** – "design" panel on one side, "run the scenario" panel on the other.
- **Editable flow title** – name your process in business language  
  (e.g. "B2B Complaints Handling Path").
- **Live status indicator** – see at a glance whether the process is complete or still has gaps.
- **Workshop-friendly** – adjust steps in real time while walking through the flow together in a meeting.
- **Expandable input fields** – input fields and textareas automatically expand to fit content height when focused, making it easier to view and edit longer text.
- **Knowledge Gaps page** – dedicated quality assurance page that automatically detects and helps you fix:
  - Broken links (choices pointing to non-existing nodes)
  - Dead ends (nodes without choices that aren't referenced)
  - Empty titles, descriptions, or choice labels
- **Comprehensive help page** – built-in user guide with step-by-step instructions, button descriptions, keyboard shortcuts, and best practices.
- **Release Notes page** – dedicated page displaying the history of changes and improvements to PathwiseAurora.
- **Multiple navigation pages** – switch between Main view, dedicated Nodes management page, Knowledge Gaps analysis, Help documentation, and Release Notes.

## For Developers

### Updating Release Notes

When adding new release notes, you need to update **both** files:

1. **`RELEASE_NOTES.md`** – Markdown file with detailed release notes (formatted for documentation)
2. **`src/views/ReleaseNotesView.js`** – JavaScript view file that displays release notes in the application's Release Notes page

Both files should contain the same release information to keep the documentation and application in sync. The `RELEASE_NOTES.md` file provides detailed formatted documentation, while `ReleaseNotesView.js` renders the release notes in the application's UI.

