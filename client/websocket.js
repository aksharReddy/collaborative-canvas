/**
 * WebSocket Client Manager
 * Handles Socket.io connection and event synchronization
 */

class WebSocketManager {
    constructor() {
        this.socket = null;
        this.userId = null;
        this.userData = null;
        this.connected = false;

        // Throttling for cursor movement
        this.lastCursorSend = 0;
        this.cursorThrottle = 50; // ms

        // Event callbacks
        this.onInit = null;
        this.onDraw = null;
        this.onUndo = null;
        this.onRedo = null;
        this.onClear = null;
        this.onUserJoined = null;
        this.onUserLeft = null;
        this.onCursorMove = null;
        this.onConnectionChange = null;
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
        // Connect to server
        this.socket = io();

        // Connection event
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
            this.userId = this.socket.id;

            if (this.onConnectionChange) {
                this.onConnectionChange(true);
            }
        });

        // Disconnect event
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;

            if (this.onConnectionChange) {
                this.onConnectionChange(false);
            }
        });

        // Initial state received
        this.socket.on('init', (data) => {
            console.log('Received initial state', data);
            this.userId = data.userId;
            this.userData = data.userData;

            if (this.onInit) {
                this.onInit(data);
            }
        });

        // Drawing event from other users
        this.socket.on('draw', (data) => {
            if (this.onDraw) {
                this.onDraw(data);
            }
        });

        // Undo event
        this.socket.on('undo', (data) => {
            console.log('Undo received', data);
            if (this.onUndo) {
                this.onUndo(data);
            }
        });

        // Redo event
        this.socket.on('redo', (data) => {
            console.log('Redo received', data);
            if (this.onRedo) {
                this.onRedo(data);
            }
        });

        // Clear event
        this.socket.on('clear', () => {
            console.log('Clear received');
            if (this.onClear) {
                this.onClear();
            }
        });

        // User joined
        this.socket.on('user-joined', (data) => {
            console.log('User joined', data);
            if (this.onUserJoined) {
                this.onUserJoined(data);
            }
        });

        // User left
        this.socket.on('user-left', (data) => {
            console.log('User left', data);
            if (this.onUserLeft) {
                this.onUserLeft(data);
            }
        });

        // Cursor movement
        this.socket.on('cursor-move', (data) => {
            if (this.onCursorMove) {
                this.onCursorMove(data);
            }
        });

        // Error handling
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
        });
    }

    /**
     * Send draw operation to server
     */
    sendDraw(drawData) {
        if (this.socket && this.connected) {
            this.socket.emit('draw', drawData);
        }
    }

    /**
     * Send cursor position (throttled)
     */
    sendCursorMove(x, y) {
        const now = Date.now();

        if (now - this.lastCursorSend < this.cursorThrottle) {
            return;
        }

        this.lastCursorSend = now;

        if (this.socket && this.connected) {
            this.socket.emit('cursor-move', { x, y });
        }
    }

    /**
     * Send undo request
     */
    sendUndo() {
        if (this.socket && this.connected) {
            this.socket.emit('undo');
        }
    }

    /**
     * Send redo request
     */
    sendRedo() {
        if (this.socket && this.connected) {
            this.socket.emit('redo');
        }
    }

    /**
     * Send clear canvas request
     */
    sendClear() {
        if (this.socket && this.connected) {
            this.socket.emit('clear');
        }
    }

    /**
     * Disconnect from server
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Export for use in other scripts
window.WebSocketManager = WebSocketManager;
