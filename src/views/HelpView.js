/**
 * Help View
 * Displays step-by-step instructions for using PathwiseAurora
 */

import { escapeHtml } from '../utils/HtmlUtils.js';

export class HelpView {
  constructor(stateManager, eventBus, domRegistry) {
    this.state = stateManager;
    this.events = eventBus;
    this.dom = domRegistry;
  }

  /**
   * Render the help page
   */
  render() {
    const container = this.dom.get('helpContainer');
    if (!container) {
      console.warn('HelpView: Container not found');
      return;
    }

    const html = `
      <div class="help-page">
        <div class="help-header">
          <h1>PathwiseAurora User Guide</h1>
          <p class="help-subtitle">Step-by-step guide to using the problem-solving tool</p>
        </div>

        <div class="help-content">
          <!-- Introduction -->
          <section class="help-section">
            <h2>1. Introduction</h2>
            <p>PathwiseAurora is a tool for creating and navigating decision graphs. It allows you to:</p>
            <ul>
              <li>Create nodes representing problems or steps</li>
              <li>Define choices leading to subsequent nodes</li>
              <li>Track problem-solving sessions</li>
              <li>Add comments and tags to steps</li>
              <li>Export and import graphs</li>
            </ul>
          </section>

          <!-- Basic steps -->
          <section class="help-section">
            <h2>2. Getting Started</h2>
            
            <h3>2.1. Starting a Session</h3>
            <ol>
              <li>In the right panel (Runner), select a starting node from the <strong>Start</strong> dropdown</li>
              <li>Click the <strong>Start</strong> button (blue button)</li>
              <li>Alternatively, enter a node ID (e.g., "1" or "1.1") in the <strong>Current Node</strong> field and click <strong>Go</strong></li>
            </ol>

            <h3>2.2. Navigating Through Problems</h3>
            <ol>
              <li>After starting a session, you'll see the problem/step description in the right panel</li>
              <li>Read the problem description in the <strong>Body</strong> section</li>
              <li>Below you'll find choice buttons - each button leads to a different node</li>
              <li>Click the button that matches your situation</li>
              <li>The application will automatically navigate to the next node</li>
            </ol>

            <h3>2.3. Solving Problems Step by Step</h3>
            <ol>
              <li><strong>Read the title and description</strong> - Each node contains a title (short summary) and description (detailed information about the problem/step)</li>
              <li><strong>Analyze available choices</strong> - Each button represents a possible solution path</li>
              <li><strong>Select the appropriate option</strong> - Click the button that best describes your situation</li>
              <li><strong>Continue navigation</strong> - Repeat the process until you reach a solution (a node without choices indicates the end of a path)</li>
              <li><strong>Add comments</strong> - In the "Step Comment" section, you can add notes to each step</li>
              <li><strong>Add tags</strong> - In the "Tags / Notes" section, you can tag steps (e.g., "needs clarification", "customer reacted strongly", "requires SME review")</li>
            </ol>
          </section>

          <!-- Buttons and their functions -->
          <section class="help-section">
            <h2>3. Button Descriptions and Functions</h2>

            <h3>3.1. Navigation Buttons (Top Bar)</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example nav-button active">Main</button>
                <div class="help-button-desc">
                  <strong>Main</strong> - Switches to the main view with node list and Runner panel
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example nav-button">Nodes</button>
                <div class="help-button-desc">
                  <strong>Nodes</strong> - Switches to the node management page (editing, creating, deleting)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example nav-button">Gaps</button>
                <div class="help-button-desc">
                  <strong>Gaps</strong> - Switches to the knowledge gaps analysis page (detects incomplete nodes, broken connections)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example nav-button">Help</button>
                <div class="help-button-desc">
                  <strong>Help</strong> - Opens this help page with instructions
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Import JSON</button>
                <div class="help-button-desc">
                  <strong>Import JSON</strong> - Imports a graph from a JSON file
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example primary">Export JSON</button>
                <div class="help-button-desc">
                  <strong>Export JSON</strong> - Exports the current graph to a JSON file
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Save Session Flow</button>
                <div class="help-button-desc">
                  <strong>Save Session Flow</strong> - Saves the session history (the path taken) to a JSON file
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Email Summary</button>
                <div class="help-button-desc">
                  <strong>Email Summary</strong> - Generates a session summary in text or HTML format for copying
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">New Node</button>
                <div class="help-button-desc">
                  <strong>New Node</strong> - Creates a new node in the graph
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example danger">New Session</button>
                <div class="help-button-desc">
                  <strong>New Session</strong> - Starts a new session (clears history, preserves graph)
                </div>
              </div>
            </div>

            <h3>3.2. Runner Panel Buttons (Right Panel)</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example primary">Start</button>
                <div class="help-button-desc">
                  <strong>Start</strong> - Starts a session from the selected node in the dropdown
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Go</button>
                <div class="help-button-desc">
                  <strong>Go</strong> - Navigates to the node with the ID entered in the "Current Node" field
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example ghost">Back</button>
                <div class="help-button-desc">
                  <strong>Back</strong> - Returns to the previous node in history (keyboard shortcut: ←)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example warn">Reset</button>
                <div class="help-button-desc">
                  <strong>Reset</strong> - Resets the session (clears history, sets current node to null)
                </div>
              </div>
            </div>

            <h3>3.3. Node List View Buttons (Left Panel)</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example view-switcher active">List</button>
                <div class="help-button-desc">
                  <strong>List</strong> - Switches to list view of nodes
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example view-switcher">Tiles</button>
                <div class="help-button-desc">
                  <strong>Tiles</strong> - Switches to tiles view with connection visualization
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example ghost">Clear</button>
                <div class="help-button-desc">
                  <strong>Clear</strong> - Clears the search filter (keyboard shortcut: Esc)
                </div>
              </div>
            </div>

            <h3>3.4. Node Editor Buttons</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <button class="help-button-example">Add Choice</button>
                <div class="help-button-desc">
                  <strong>Add Choice</strong> - Adds a new choice to the node. Each choice has:
                  <ul>
                    <li><strong>Label</strong> - Choice label (e.g., "positive", "negative")</li>
                    <li><strong>To #</strong> - Target node ID (e.g., "1.1", "2")</li>
                  </ul>
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Add Child</button>
                <div class="help-button-desc">
                  <strong>Add Child</strong> - Creates a new child node (e.g., if node has ID "1", creates "1.1")
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Clone</button>
                <div class="help-button-desc">
                  <strong>Clone</strong> - Clones the node (creates a copy with a new ID)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example danger">Delete</button>
                <div class="help-button-desc">
                  <strong>Delete</strong> - Deletes the node (warning: also removes all references)
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example">Remove</button>
                <div class="help-button-desc">
                  <strong>Remove</strong> - Removes a choice from the node
                </div>
              </div>
            </div>

            <h3>3.5. Runner Panel Buttons During Navigation</h3>
            <div class="help-button-list">
              <div class="help-button-item">
                <div class="help-button-desc">
                  <strong>Choice Buttons</strong> - Each node can have buttons representing different solution paths. 
                  Clicking a button navigates to the target node. The button is grayed out if the target node doesn't exist.
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example ghost">← #1.1</button>
                <div class="help-button-desc">
                  <strong>Sibling Navigation</strong> - If a node has siblings, buttons appear to navigate between them
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example primary">Add</button>
                <div class="help-button-desc">
                  <strong>Add (in Tags section)</strong> - Adds a tag to the current step
                </div>
              </div>
              <div class="help-button-item">
                <button class="help-button-example primary">Add</button>
                <div class="help-button-desc">
                  <strong>Add (in Add Decision Option section)</strong> - Adds a new choice to the current node during a session
                </div>
              </div>
            </div>
          </section>

          <!-- Keyboard shortcuts -->
          <section class="help-section">
            <h2>4. Keyboard Shortcuts</h2>
            <ul>
              <li><strong>Esc</strong> - Clears the search filter</li>
              <li><strong>←</strong> (Left Arrow) - Goes back to the previous node</li>
              <li><strong>→</strong> (Right Arrow) - Advances to the first choice of the current node</li>
              <li><strong>Ctrl + ←</strong> - Navigates to the previous sibling node</li>
              <li><strong>Ctrl + →</strong> - Navigates to the next sibling node</li>
            </ul>
          </section>

          <!-- Problem solving -->
          <section class="help-section">
            <h2>5. How to Solve Problem Descriptions</h2>
            
            <h3>5.1. Node Structure</h3>
            <p>Each node consists of:</p>
            <ul>
              <li><strong>Title</strong> - Short summary of the problem/step</li>
              <li><strong>Body/Content</strong> - Detailed description of the situation, problem, or step to take</li>
              <li><strong>Choices</strong> - List of possible solution paths</li>
            </ul>

            <h3>5.2. Problem-Solving Process</h3>
            <ol>
              <li><strong>Read the title and description</strong> - Understand the problem context</li>
              <li><strong>Analyze available choices</strong> - Each button represents a different path</li>
              <li><strong>Select the appropriate option</strong> - Click the button that best describes your situation</li>
              <li><strong>Continue</strong> - Repeat the process until you reach a solution</li>
              <li><strong>Add notes</strong> - In the "Step Comment" section, you can record your thoughts</li>
              <li><strong>Tag important steps</strong> - Use tags to mark steps that require attention</li>
            </ol>

            <h3>5.3. Usage Example</h3>
            <div class="help-example">
              <p><strong>Step 1:</strong> Start a session by clicking "Start" at node "1"</p>
              <p><strong>Step 2:</strong> Read the problem description: "Production users report random 500 responses..."</p>
              <p><strong>Step 3:</strong> You'll see two choices:
                <ul>
                  <li>"Assess incident scope & impact" → leads to node 1.1</li>
                  <li>"Apply immediate mitigation" → leads to node 1.2</li>
                </ul>
              </p>
              <p><strong>Step 4:</strong> Select the appropriate option depending on your situation</p>
              <p><strong>Step 5:</strong> Continue navigation until you reach a solution (node without choices)</p>
            </div>
          </section>

          <!-- Node management -->
          <section class="help-section">
            <h2>6. Node Management</h2>
            
            <h3>6.1. Creating a Node</h3>
            <ol>
              <li>Click the <strong>New Node</strong> button in the top bar</li>
              <li>Or go to the <strong>Nodes</strong> page and use the node creation option</li>
              <li>Fill in the title and description</li>
              <li>Add choices if needed</li>
            </ol>

            <h3>6.2. Editing a Node</h3>
            <ol>
              <li>In the <strong>List</strong> view, find the node in the left panel</li>
              <li>Click in the <strong>Title</strong> or <strong>Content</strong> field and edit</li>
              <li>Changes are saved automatically</li>
              <li>You can add/remove choices using the <strong>Add Choice</strong> and <strong>Remove</strong> buttons</li>
            </ol>

            <h3>6.3. Hierarchical Structure</h3>
            <p>Nodes can be nested:</p>
            <ul>
              <li>Node "1" - main node</li>
              <li>Node "1.1" - child of node "1"</li>
              <li>Node "1.1.1" - child of node "1.1"</li>
            </ul>
            <p>Use the <strong>Add Child</strong> button to create a child node.</p>
          </section>

          <!-- Session history -->
          <section class="help-section">
            <h2>7. Session History</h2>
            <p>In the bottom Runner panel, you'll see the history of all visited nodes:</p>
            <ul>
              <li>Each node in history can be clicked to return to it</li>
              <li>You can add a comment to each step</li>
              <li>You can tag steps</li>
              <li>History is saved automatically</li>
            </ul>
          </section>

          <!-- Export and import -->
          <section class="help-section">
            <h2>8. Export and Import</h2>
            
            <h3>8.1. Export JSON</h3>
            <p>Exports the entire graph (all nodes) to a JSON file. Use this to:</p>
            <ul>
              <li>Save a backup</li>
              <li>Share the graph with other users</li>
              <li>Transfer the graph to another application instance</li>
            </ul>

            <h3>8.2. Save Session Flow</h3>
            <p>Saves only the session history (the path taken) to a JSON file. Useful for:</p>
            <ul>
              <li>Documenting a specific problem solution</li>
              <li>Analyzing chosen paths</li>
              <li>Reporting</li>
            </ul>

            <h3>8.3. Email Summary</h3>
            <p>Generates a session summary in text or HTML format. You can:</p>
            <ul>
              <li>Copy text to clipboard</li>
              <li>Paste into email</li>
              <li>Save as document</li>
            </ul>

            <h3>8.4. Import JSON</h3>
            <p>Imports a graph from a JSON file. Warning: import replaces the current graph!</p>
          </section>

          <!-- Knowledge gaps analysis -->
          <section class="help-section">
            <h2>9. Knowledge Gaps Page</h2>
            <p>The <strong>Gaps</strong> page analyzes the graph and detects:</p>
            <ul>
              <li><strong>Broken Links</strong> - Choices pointing to non-existing nodes</li>
              <li><strong>Dead Ends</strong> - Nodes without choices that are not used</li>
              <li><strong>Empty Titles</strong> - Nodes without a title</li>
              <li><strong>Empty Descriptions</strong> - Nodes without a description</li>
              <li><strong>Empty Choice Labels</strong> - Choices without a label</li>
            </ul>
            <p>Click <strong>Go to Node</strong> next to each issue to navigate to the node and fix it.</p>
          </section>

          <!-- Tips -->
          <section class="help-section">
            <h2>10. Tips and Best Practices</h2>
            <ul>
              <li>Always fill in the node title and description - this makes navigation easier</li>
              <li>Use meaningful labels for choices (e.g., "positive", "negative", "needs clarification")</li>
              <li>Regularly check the <strong>Gaps</strong> page to find incomplete parts of the graph</li>
              <li>Add comments to important steps during sessions</li>
              <li>Use tags to categorize steps (e.g., "critical", "needs review")</li>
              <li>Export the graph regularly as a backup</li>
              <li>Use the <strong>Tiles</strong> view to see a visualization of connections between nodes</li>
            </ul>
          </section>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }
}
