/**
 * Drawing State Management
 * Handles global operation history, undo/redo, and state synchronization
 */

class DrawingState {
    constructor() {
        // Global operation history (ordered by timestamp)
        this.operations = [];

        // Undo stack (operations that have been undone)
        this.undoStack = [];

        // Operation ID counter
        this.operationId = 0;
    }

    /**
     * Add a new drawing operation to the history
     * @param {Object} operation - Drawing operation data
     * @returns {Object} The operation with assigned ID
     */
    addOperation(operation) {
        const op = {
            ...operation,
            id: this.operationId++,
            timestamp: Date.now()
        };

        this.operations.push(op);

        // Clear undo stack when new operation is added
        this.undoStack = [];

        return op;
    }

    /**
     * Undo the last operation
     * @returns {Object|null} The undone operation or null if nothing to undo
     */
    undo() {
        if (this.operations.length === 0) {
            return null;
        }

        const operation = this.operations.pop();
        this.undoStack.push(operation);

        return {
            type: 'undo',
            operation,
            remainingOperations: this.operations
        };
    }

    /**
     * Redo the last undone operation
     * @returns {Object|null} The redone operation or null if nothing to redo
     */
    redo() {
        if (this.undoStack.length === 0) {
            return null;
        }

        const operation = this.undoStack.pop();
        this.operations.push(operation);

        return {
            type: 'redo',
            operation,
            remainingOperations: this.operations
        };
    }

    /**
     * Get all current operations (for new user sync)
     * @returns {Array} All current operations
     */
    getAllOperations() {
        return this.operations;
    }

    /**
     * Clear all operations
     */
    clear() {
        this.operations = [];
        this.undoStack = [];
    }

    /**
     * Get the current state summary
     */
    getStateSummary() {
        return {
            totalOperations: this.operations.length,
            undoStackSize: this.undoStack.length,
            lastOperationId: this.operationId - 1
        };
    }
}

module.exports = DrawingState;
