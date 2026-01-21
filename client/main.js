/**
 * Main Application Controller
 * Coordinates canvas engine, websocket, and UI
 */

// Global instances
let canvas;
let wsManager;
let users = new Map();
let cursors = new Map();

// DOM Elements
const elements = {
    // Tools
    brushTool: document.getElementById('brushTool'),
    eraserTool: document.getElementById('eraserTool'),
    colorPicker: document.getElementById('colorPicker'),
    colorDisplay: document.getElementById('colorDisplay'),
    strokeWidth: document.getElementById('strokeWidth'),
    strokeValue: document.getElementById('strokeValue'),

    // Controls
    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    clearBtn: document.getElementById('clearBtn'),

    // Status
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    userCount: document.getElementById('userCount'),
    usersList: document.getElementById('usersList'),

    // Cursors
    cursorsLayer: document.getElementById('cursors')
};

/**
 * Initialize application
 */
function init() {
    console.log('Initializing Collaborative Canvas...');

    // Initialize canvas engine
    canvas = new CanvasEngine('drawingCanvas');

    // Initialize WebSocket manager
    wsManager = new WebSocketManager();

    // Setup UI event listeners
    setupUIListeners();

    // Setup canvas callbacks
    canvas.onDrawOperation = (data) => {
        wsManager.sendDraw(data);
    };

    canvas.onCursorMove = (x, y) => {
        wsManager.sendCursorMove(x, y);
    };

    // Setup WebSocket callbacks
    setupWebSocketCallbacks();

    // Connect to server
    wsManager.connect();

    console.log('Application initialized');
}

/**
 * Setup UI event listeners
 */
function setupUIListeners() {
    // Tool selection
    elements.brushTool.addEventListener('click', () => {
        selectTool('brush');
    });

    elements.eraserTool.addEventListener('click', () => {
        selectTool('eraser');
    });

    // Color picker
    elements.colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        canvas.setColor(color);
        elements.colorDisplay.style.background = color;
    });

    // Initialize color display
    elements.colorDisplay.style.background = elements.colorPicker.value;

    // Stroke width
    elements.strokeWidth.addEventListener('input', (e) => {
        const width = e.target.value;
        canvas.setWidth(parseInt(width));
        elements.strokeValue.textContent = width;
    });

    // Undo button
    elements.undoBtn.addEventListener('click', () => {
        wsManager.sendUndo();
    });

    // Redo button
    elements.redoBtn.addEventListener('click', () => {
        wsManager.sendRedo();
    });

    // Clear button
    elements.clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the canvas for all users?')) {
            wsManager.sendClear();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl+Z or Cmd+Z for undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            wsManager.sendUndo();
        }

        // Ctrl+Y or Cmd+Y or Ctrl+Shift+Z for redo
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            wsManager.sendRedo();
        }
    });
}

/**
 * Select drawing tool
 */
function selectTool(tool) {
    // Update UI
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    if (tool === 'brush') {
        elements.brushTool.classList.add('active');
    } else if (tool === 'eraser') {
        elements.eraserTool.classList.add('active');
    }

    // Update canvas
    canvas.setTool(tool);
}

/**
 * Setup WebSocket event callbacks
 */
function setupWebSocketCallbacks() {
    // Initial state
    wsManager.onInit = (data) => {
        console.log('Init data received:', data);

        // Set user color
        if (data.userData && data.userData.color) {
            elements.colorPicker.value = data.userData.color;
            elements.colorDisplay.style.background = data.userData.color;
            canvas.setColor(data.userData.color);
        }

        // Redraw canvas from operations
        if (data.operations && data.operations.length > 0) {
            canvas.redrawFromOperations(data.operations);
        }

        // Update user list
        updateUserList(data.users);
    };

    // Draw event from remote user
    wsManager.onDraw = (data) => {
        canvas.drawRemote(data);
    };

    // Undo event
    wsManager.onUndo = (data) => {
        canvas.redrawFromOperations(data.operations);
    };

    // Redo event
    wsManager.onRedo = (data) => {
        canvas.redrawFromOperations(data.operations);
    };

    // Clear event
    wsManager.onClear = () => {
        canvas.clear();
    };

    // User joined
    wsManager.onUserJoined = (data) => {
        updateUserList(data.users);
    };

    // User left
    wsManager.onUserLeft = (data) => {
        updateUserList(data.users);
        removeCursor(data.userId);
    };

    // Cursor movement
    wsManager.onCursorMove = (data) => {
        updateCursor(data.userId, data.x, data.y, data.username, data.userColor);
    };

    // Connection status
    wsManager.onConnectionChange = (connected) => {
        if (connected) {
            elements.statusDot.classList.add('connected');
            elements.statusText.textContent = 'Connected';
        } else {
            elements.statusDot.classList.remove('connected');
            elements.statusText.textContent = 'Disconnected';
        }
    };
}

/**
 * Update user list UI
 */
function updateUserList(userList) {
    users.clear();
    elements.usersList.innerHTML = '';

    userList.forEach(user => {
        users.set(user.id, user);

        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
      <div class="user-color-indicator" style="background: ${user.color}"></div>
      <div class="user-info">
        <div class="user-name">${user.username}</div>
        <div class="user-status">● Online</div>
      </div>
    `;

        elements.usersList.appendChild(userItem);
    });

    // Update user count
    elements.userCount.textContent = userList.length;
}

/**
 * Update cursor position for a user
 */
function updateCursor(userId, x, y, username, color) {
    // Skip own cursor
    if (userId === wsManager.userId) return;

    let cursorElement = cursors.get(userId);

    // Create cursor if doesn't exist
    if (!cursorElement) {
        cursorElement = document.createElement('div');
        cursorElement.className = 'user-cursor';
        cursorElement.innerHTML = `
      <div class="user-cursor-dot" style="background: ${color}"></div>
      <div class="user-cursor-label">${username}</div>
    `;
        elements.cursorsLayer.appendChild(cursorElement);
        cursors.set(userId, cursorElement);
    }

    // Update position
    cursorElement.style.left = `${x}px`;
    cursorElement.style.top = `${y}px`;

    // Reset hide timer
    if (cursorElement.hideTimer) {
        clearTimeout(cursorElement.hideTimer);
    }

    cursorElement.style.opacity = '1';

    // Hide cursor after 2 seconds of inactivity
    cursorElement.hideTimer = setTimeout(() => {
        cursorElement.style.opacity = '0';
    }, 2000);
}

/**
 * Remove cursor for disconnected user
 */
function removeCursor(userId) {
    const cursorElement = cursors.get(userId);
    if (cursorElement) {
        cursorElement.remove();
        cursors.delete(userId);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
