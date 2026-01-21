# 🏗️ Architecture Documentation

This document explains the technical architecture, design decisions, and implementation details of the Collaborative Canvas application.

## 📐 System Overview

The Collaborative Canvas is a **client-server application** using WebSocket technology for real-time bidirectional communication. The architecture follows a centralized state management approach where the server maintains the authoritative state and broadcasts changes to all connected clients.

### High-Level Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│                 │ ◄────────────────────────► │                 │
│  Client A       │                            │                 │
│  (Browser)      │                            │                 │
└─────────────────┘                            │                 │
                                               │   Server        │
┌─────────────────┐         WebSocket          │   (Node.js)     │
│                 │ ◄────────────────────────► │                 │
│  Client B       │                            │  - Express      │
│  (Browser)      │                            │  - Socket.io    │
└─────────────────┘                            │  - State Mgmt   │
                                               │                 │
┌─────────────────┐         WebSocket          │                 │
│                 │ ◄────────────────────────► │                 │
│  Client C       │                            │                 │
│  (Browser)      │                            │                 │
└─────────────────┘                            └─────────────────┘
```

## 🔄 Data Flow Diagram

### Drawing Event Flow

```
User draws on canvas
       │
       ▼
┌─────────────────────────────────────────────┐
│ Canvas Engine (canvas.js)                   │
│ - Captures mouse/touch events               │
│ - Draws locally for instant feedback        │
│ - Generates drawing operation               │
└──────────────┬──────────────────────────────┘
               │
               │ Draw Operation Object
               │ { fromX, fromY, toX, toY, color, width, tool }
               ▼
┌─────────────────────────────────────────────┐
│ WebSocket Manager (websocket.js)            │
│ - Emits 'draw' event to server              │
└──────────────┬──────────────────────────────┘
               │
               │ Socket.io Event
               ▼
┌─────────────────────────────────────────────┐
│ Server (server.js)                          │
│ - Receives draw event                       │
│ - Adds user metadata (userId, color, etc)   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Drawing State Manager (drawing-state.js)    │
│ - Adds operation to global history          │
│ - Assigns operation ID and timestamp        │
│ - Clears undo stack                         │
└──────────────┬──────────────────────────────┘
               │
               │ Saved Operation
               ▼
┌─────────────────────────────────────────────┐
│ Server Broadcast                            │
│ - Broadcasts to all OTHER users in room     │
│ - (Not back to sender - already drawn)      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Other Clients                               │
│ - Receive draw event                        │
│ - Canvas engine renders the line            │
└─────────────────────────────────────────────┘
```

### Undo/Redo Flow

```
User clicks undo
       │
       ▼
┌─────────────────────────────────────────────┐
│ Client - Main App (main.js)                 │
│ - Sends 'undo' event to server              │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ Server - Drawing State Manager              │
│ - Pops last operation from history          │
│ - Pushes to undo stack                      │
│ - Returns remaining operations              │
└──────────────┬──────────────────────────────┘
               │
               │ All Operations Array
               ▼
┌─────────────────────────────────────────────┐
│ Server Broadcast to ALL users (including    │
│ sender) - 'undo' event with operations      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│ All Clients                                 │
│ - Clear canvas                              │
│ - Redraw from operation history             │
│ - Consistent state across all users         │
└─────────────────────────────────────────────┘
```

## 🔌 WebSocket Protocol

### Message Types

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `draw` | `{ fromX, fromY, toX, toY, color, width, tool }` | Drawing line segment |
| `cursor-move` | `{ x, y }` | User cursor position update |
| `undo` | (none) | Request to undo last operation |
| `redo` | (none) | Request to redo undone operation |
| `clear` | (none) | Request to clear entire canvas |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `init` | `{ userId, userData, operations[], users[] }` | Initial state on connection |
| `draw` | `{ id, fromX, fromY, toX, toY, color, width, tool, userId, username, userColor, timestamp }` | Drawing from another user |
| `cursor-move` | `{ userId, username, userColor, x, y }` | Cursor position from another user |
| `undo` | `{ operation, operations[] }` | Undo performed, new operation list |
| `redo` | `{ operation, operations[] }` | Redo performed, new operation list |
| `clear` | (none) | Canvas cleared by a user |
| `user-joined` | `{ user, users[] }` | New user joined the room |
| `user-left` | `{ userId, users[] }` | User disconnected |

### Event Payload Examples

**draw event:**
```json
{
  "fromX": 150.5,
  "fromY": 200.3,
  "toX": 152.1,
  "toY": 201.8,
  "color": "#FF6B6B",
  "width": 5,
  "tool": "brush",
  "userId": "socket-id-123",
  "username": "User abc1",
  "userColor": "#FF6B6B",
  "timestamp": 1642345678901,
  "id": 42
}
```

**init event:**
```json
{
  "userId": "socket-id-456",
  "userData": {
    "id": "socket-id-456",
    "username": "User def4",
    "color": "#4ECDC4",
    "joinedAt": 1642345678901
  },
  "operations": [
    { /* operation 1 */ },
    { /* operation 2 */ }
  ],
  "users": [
    {
      "id": "socket-id-123",
      "username": "User abc1",
      "color": "#FF6B6B",
      "joinedAt": 1642345600000
    },
    {
      "id": "socket-id-456",
      "username": "User def4",
      "color": "#4ECDC4",
      "joinedAt": 1642345678901
    }
  ]
}
```

## 🔄 Global Undo/Redo Strategy

### Challenge
Traditional undo/redo is per-user, but we need **global undo/redo** where any user can undo any operation by any user.

### Solution: Operation History Approach

**Core Concept**: Maintain a single, ordered, global list of all drawing operations. Undo/redo manipulates this list, and clients redraw the entire canvas from the operation list.

**Data Structures:**
```javascript
// Server-side (drawing-state.js)
{
  operations: [op1, op2, op3, ...],  // Current canvas state
  undoStack: [op10, op9, ...],       // Undone operations (for redo)
  operationId: 99                     // Auto-incrementing ID
}
```

**Undo Process:**
1. User A clicks undo
2. Server pops last operation from `operations` array
3. Server pushes it to `undoStack`
4. Server broadcasts `operations` array to ALL clients
5. All clients clear canvas and redraw from `operations` list

**Redo Process:**
1. User B clicks redo
2. Server pops last operation from `undoStack`
3. Server pushes it back to `operations` array
4. Server broadcasts `operations` array to ALL clients
5. All clients redraw

**Advantages:**
- ✅ Perfect consistency - all clients see exact same canvas
- ✅ Simple to implement
- ✅ No complex conflict resolution needed
- ✅ Easy to debug - single source of truth

**Disadvantages:**
- ❌ Performance degrades with many operations (full redraw on each undo/redo)
- ❌ Memory grows unbounded (could optimize with snapshots)

**Optimization Opportunities:**
- Canvas snapshots every N operations
- Operation batching/merging
- Differential updates instead of full redraw

## ⚔️ Conflict Resolution

### Types of Conflicts

**1. Simultaneous Drawing (Overlapping Strokes)**

**Strategy**: Last-write-wins with timestamp ordering

```javascript
// Each operation has timestamp
operation = {
  ...drawData,
  timestamp: Date.now(),
  id: autoIncrementId++
}

// Operations are applied in order received by server
// Server assigns sequential IDs ensuring deterministic ordering
```

**Result**: All clients render strokes in the same order, ensuring identical canvas state.

**2. Race Condition (Network Latency)**

**Problem**: User A draws, User B draws, both events reach server at nearly same time.

**Solution**: 
- Server processes events sequentially (Node.js single-threaded event loop)
- Each operation gets sequential ID
- ID determines rendering order
- All clients render in same order = consistent state

**3. Undo Conflicts**

**Scenario**: User A is drawing, User B clicks undo

**Handling**:
- Undo takes effect immediately
- User A's current drawing continues on the new state
- New operations are added after undo
- Undo stack is cleared when new operations arrive
- No partial undo issues because everyone redraws from operation list

### Why This Approach Works

**Eventual Consistency**: All clients eventually converge to the same state because:
1. Server is single source of truth
2. Operations are totally ordered (by ID)
3. Same operation list → same canvas rendering

## 🚀 Performance Optimizations

### 1. Event Throttling

**Cursor Movement:**
```javascript
// websocket.js
cursorThrottle = 50; // ms

// Only send cursor updates every 50ms
if (now - lastCursorSend < cursorThrottle) {
  return; // Skip this update
}
```

**Why**: Mouse movement can fire 100+ events/second. Throttling reduces network traffic without noticeable UX impact.

### 2. Local Drawing Prediction

**Client-Side Prediction:**
```javascript
// User draws → immediately render locally
canvas.drawLine(...);

// Then send to server for sync
socket.emit('draw', ...);
```

**Why**: Provides instant visual feedback. Without this, drawing would feel laggy waiting for server round-trip.

### 3. Canvas Optimization

**Line Rendering:**
```javascript
ctx.lineCap = 'round';    // Smooth line endings
ctx.lineJoin = 'round';   // Smooth line corners
```

**Why**: Round caps and joins look smoother and are GPU-accelerated in most browsers.

### 4. Efficient Redrawing

**Batch Operations:**
```javascript
// Redraw entire canvas from operations
operations.forEach(op => {
  drawLine(op.fromX, op.fromY, op.toX, op.toY, ...);
});
```

**Alternative Considered**: Differential updates (only redraw changed regions)
- Not implemented due to complexity
- Full redraw is fast enough for moderate operation counts (<10,000)

## 🎯 State Synchronization

### New User Joining

```
1. User connects to server
   │
   ▼
2. Server assigns userId, color, creates userData
   │
   ▼
3. Server sends 'init' event with:
   - userData (user's assigned color, ID)
   - operations[] (entire operation history)
   - users[] (all currently connected users)
   │
   ▼
4. Client receives init:
   - Sets tool color to assigned color
   - Redraws canvas from operations[]
   - Populates user list
   │
   ▼
5. Server broadcasts 'user-joined' to OTHER users
   - They update their user list
```

### User Disconnecting

```
1. User closes tab/loses connection
   │
   ▼
2. Server's 'disconnect' event fires
   │
   ▼
3. Server removes user from room
   │
   ▼
4. Server broadcasts 'user-left' to remaining users
   - They update their user list
   - They remove cursor indicator
```

**Note**: Operations persist after user disconnects. This is intentional - drawings remain even after artist leaves.

## 🏛️ Architecture Decisions

### Why Socket.io over Native WebSockets?

**Chosen**: Socket.io

**Reasons**:
- ✅ Auto-reconnection with exponential backoff
- ✅ Room support built-in
- ✅ Fallback to long-polling for restrictive networks
- ✅ Event-based API simpler than raw WebSocket messages
- ✅ Binary data support if needed later

**Trade-off**: Slightly larger bundle size (~200KB vs ~30KB)

### Why Centralized State (Server Authority)?

**Alternative**: P2P with CRDT (Conflict-free Replicated Data Types)

**Chosen**: Centralized server

**Reasons**:
- ✅ Simpler implementation
- ✅ Single source of truth = easier debugging
- ✅ Total ordering of operations guaranteed
- ✅ Easy to add features (permissions, history, replay)

**Trade-off**: Server is bottleneck/single point of failure

### Why Operation-Based History?

**Alternative**: State-based (periodic full canvas snapshots)

**Chosen**: Operation-based with full redraw

**Reasons**:
- ✅ Perfect accuracy - pixel-perfect consistency
- ✅ Undo/redo trivial to implement
- ✅ Can replay entire drawing session
- ✅ Easy debugging - can log operation sequence

**Trade-off**: Performance degrades with large operation count

## 📊 Scalability Considerations

### Current Limitations

**Single Server Instance**: No horizontal scaling
- Socket.io requires sticky sessions
- Room state is in-memory

**Unbounded Memory Growth**: 
- Operation history grows forever
- No garbage collection of old operations

### Scaling to 1000 Concurrent Users

**Proposed Architecture Changes:**

**1. Redis Adapter for Socket.io**
```javascript
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'localhost', port: 6379 }));
```
- Enables multiple server instances
- Shared pub/sub for events

**2. Operation History Management**
```javascript
// Periodic snapshots
if (operations.length > 1000) {
  snapshot = canvas.toDataURL();
  operations = []; // Clear and start fresh
}
```

**3. Database Persistence**
- Store operations in database (MongoDB, PostgreSQL)
- Load recent operations on server start
- Archive old operations

**4. Load Balancing**
```
Users → Load Balancer → Server Instance 1
                      → Server Instance 2
                      → Server Instance 3
                         ↓
                      Redis (shared state)
                         ↓
                      Database (persistence)
```

**5. Rate Limiting**
```javascript
// Limit draw events per user
const rateLimit = require('express-rate-limit');
```

**6. Canvas Chunking**
- Split large canvases into tiles
- Only sync visible tiles
- Reduces bandwidth and memory

## 🔍 Testing Strategy

### Unit Testing (Future Enhancement)
- DrawingState operations
- RoomManager user management
- Canvas engine drawing functions

### Integration Testing
- Multiple browser tabs
- Network latency simulation (Chrome DevTools)
- Disconnection/reconnection scenarios

### Performance Testing
- Rapidly draw 1000+ operations
- Monitor FPS and memory usage
- Test with 10+ concurrent users

## 📚 Code Organization Principles

**Separation of Concerns:**
- `canvas.js` - Pure canvas rendering logic
- `websocket.js` - Pure WebSocket communication
- `main.js` - Coordination and UI event handling

**Single Responsibility:**
- `drawing-state.js` - ONLY manages operation history
- `rooms.js` - ONLY manages users and rooms
- `server.js` - ONLY handles HTTP and WebSocket routing

**Loose Coupling:**
- Canvas engine doesn't know about WebSockets
- WebSocket manager doesn't know about Canvas
- Communication via callbacks and events

---

**This architecture prioritizes simplicity and correctness over premature optimization, making it easy to understand, debug, and extend.**
