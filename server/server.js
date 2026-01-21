/**
 * Collaborative Canvas Server
 * Express + Socket.io server for real-time drawing synchronization
 */

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const DrawingState = require('./drawing-state');
const RoomManager = require('./rooms');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Initialize managers
const drawingState = new DrawingState();
const roomManager = new RoomManager();
const DEFAULT_ROOM = 'main';

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    let currentRoom = DEFAULT_ROOM;
    let userData = null;

    // Join default room
    socket.join(currentRoom);

    // Add user to room manager
    userData = roomManager.addUser(currentRoom, socket.id, `User ${socket.id.substring(0, 4)}`);

    console.log(`${userData.username} joined room ${currentRoom} with color ${userData.color}`);

    // Send initial state to new user
    socket.emit('init', {
        userId: socket.id,
        userData: userData,
        operations: drawingState.getAllOperations(),
        users: roomManager.getRoomUsers(currentRoom)
    });

    // Broadcast new user to others in room
    socket.to(currentRoom).emit('user-joined', {
        user: userData,
        users: roomManager.getRoomUsers(currentRoom)
    });

    // Handle drawing events
    socket.on('draw', (data) => {
        // Add user info and save to state
        const operation = {
            type: 'draw',
            userId: socket.id,
            username: userData.username,
            userColor: userData.color,
            ...data
        };

        const savedOp = drawingState.addOperation(operation);

        // Broadcast to all other users in room
        socket.to(currentRoom).emit('draw', savedOp);
    });

    // Handle cursor movement
    socket.on('cursor-move', (data) => {
        // Broadcast cursor position to others
        socket.to(currentRoom).emit('cursor-move', {
            userId: socket.id,
            username: userData.username,
            userColor: userData.color,
            ...data
        });
    });

    // Handle undo operation
    socket.on('undo', () => {
        const result = drawingState.undo();

        if (result) {
            // Broadcast undo to all users (including sender)
            io.to(currentRoom).emit('undo', {
                operation: result.operation,
                operations: result.remainingOperations
            });

            console.log(`Undo performed. Remaining operations: ${result.remainingOperations.length}`);
        }
    });

    // Handle redo operation
    socket.on('redo', () => {
        const result = drawingState.redo();

        if (result) {
            // Broadcast redo to all users (including sender)
            io.to(currentRoom).emit('redo', {
                operation: result.operation,
                operations: result.remainingOperations
            });

            console.log(`Redo performed. Total operations: ${result.remainingOperations.length}`);
        }
    });

    // Handle clear canvas
    socket.on('clear', () => {
        drawingState.clear();

        // Broadcast clear to all users
        io.to(currentRoom).emit('clear');

        console.log('Canvas cleared');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Remove user from room
        roomManager.removeUser(currentRoom, socket.id);

        // Notify others
        socket.to(currentRoom).emit('user-left', {
            userId: socket.id,
            users: roomManager.getRoomUsers(currentRoom)
        });
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`🎨 Collaborative Canvas Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
