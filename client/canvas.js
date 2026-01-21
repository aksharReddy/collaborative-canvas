/**
 * Canvas Drawing Engine
 * Handles all canvas operations, drawing tools, and rendering
 */

class CanvasEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Drawing state
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#FF6B6B';
        this.currentWidth = 5;

        // Path tracking for smooth drawing
        this.currentPath = [];
        this.lastX = 0;
        this.lastY = 0;

        // Initialize canvas size
        this.resizeCanvas();

        // Setup event listeners
        this.setupEventListeners();

        // Operation callback
        this.onDrawOperation = null;
        this.onCursorMove = null;
    }

    /**
     * Resize canvas to fit container
     */
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();

        // Store current canvas data if exists
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // Set canvas size
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        // Restore canvas data
        this.ctx.putImageData(imageData, 0, 0);

        // Set canvas defaults
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
    }

    /**
     * Setup mouse and touch event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseout', () => this.stopDrawing());

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    /**
     * Get mouse position relative to canvas
     */
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    /**
     * Start drawing
     */
    startDrawing(e) {
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        this.currentPath = [pos];
    }

    /**
     * Draw on canvas
     */
    draw(e) {
        const pos = this.getMousePos(e);

        // Send cursor position for tracking
        if (this.onCursorMove) {
            this.onCursorMove(pos.x, pos.y);
        }

        if (!this.isDrawing) return;

        // Add to current path
        this.currentPath.push(pos);

        // Draw locally
        this.drawLine(this.lastX, this.lastY, pos.x, pos.y, this.currentColor, this.currentWidth, this.currentTool);

        // Send draw event (throttled)
        if (this.onDrawOperation) {
            this.onDrawOperation({
                fromX: this.lastX,
                fromY: this.lastY,
                toX: pos.x,
                toY: pos.y,
                color: this.currentColor,
                width: this.currentWidth,
                tool: this.currentTool
            });
        }

        this.lastX = pos.x;
        this.lastY = pos.y;
    }

    /**
     * Stop drawing
     */
    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.currentPath = [];
        }
    }

    /**
     * Draw a line on the canvas
     */
    drawLine(x1, y1, x2, y2, color, width, tool = 'brush') {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);

        if (tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = 'rgba(0,0,0,1)';
            this.ctx.lineWidth = width * 2; // Eraser is wider
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = width;
        }

        this.ctx.stroke();
        this.ctx.closePath();
    }

    /**
     * Draw from remote user
     */
    drawRemote(data) {
        this.drawLine(data.fromX, data.fromY, data.toX, data.toY, data.color, data.width, data.tool);
    }

    /**
     * Clear the entire canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Redraw canvas from operation list
     */
    redrawFromOperations(operations) {
        this.clear();

        operations.forEach(op => {
            if (op.type === 'draw') {
                this.drawLine(op.fromX, op.fromY, op.toX, op.toY, op.color, op.width, op.tool);
            }
        });
    }

    /**
     * Set current tool
     */
    setTool(tool) {
        this.currentTool = tool;
    }

    /**
     * Set current color
     */
    setColor(color) {
        this.currentColor = color;
    }

    /**
     * Set stroke width
     */
    setWidth(width) {
        this.currentWidth = width;
    }

    /**
     * Get canvas as data URL
     */
    toDataURL() {
        return this.canvas.toDataURL();
    }
}

// Export for use in other scripts
window.CanvasEngine = CanvasEngine;
