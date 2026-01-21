# 🎨 Collaborative Canvas

A real-time multi-user drawing application where multiple people can draw simultaneously on the same canvas with WebSocket synchronization.

![Collaborative Canvas](https://img.shields.io/badge/status-active-success.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)

## ✨ Features

### Core Functionality
- **Real-time Drawing Synchronization** - See other users' drawings as they draw (not after they finish)
- **Multiple Drawing Tools** - Brush and eraser with customizable colors and stroke widths
- **Global Undo/Redo** - Undo and redo operations work across all users
- **User Cursor Tracking** - See where other users are currently drawing
- **User Management** - View all online users with unique color assignments
- **Conflict Resolution** - Handles overlapping drawings from multiple users
- **Mobile Touch Support** - Works on touch devices

### Technical Features
- Raw Canvas API implementation (no drawing libraries)
- Efficient WebSocket communication with Socket.io
- Operation-based state management for consistency
- Optimized event throttling for performance
- Smooth drawing with path optimization
- Responsive design for different screen sizes

## 🚀 Quick Start

### Prerequisites
- Node.js >= 14.0.0
- npm (comes with Node.js)

### Installation & Running

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The application will be available at **http://localhost:3000**

## 🧪 Testing with Multiple Users

### Method 1: Multiple Browser Tabs
1. Open http://localhost:3000 in your browser
2. Open 2-3 more tabs with the same URL
3. Start drawing in different tabs
4. Observe real-time synchronization

### Method 2: Multiple Browsers
1. Open http://localhost:3000 in Chrome
2. Open the same URL in Firefox, Safari, etc.
3. Test drawing from different browsers

### Method 3: Multiple Devices
1. Find your local IP address:
   - Mac/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
2. Open http://YOUR_IP:3000 on other devices on the same network
3. Draw from different devices

## 🎮 Usage Guide

### Drawing Tools
- **Brush Tool** - Click the brush button or it's selected by default
- **Eraser Tool** - Click the eraser button to switch to eraser mode
- **Color Picker** - Click the color input to choose your drawing color
- **Brush Size** - Use the slider to adjust stroke width (1-50px)

### Canvas Controls
- **Undo** - Click the undo button or press `Ctrl+Z` (Cmd+Z on Mac)
- **Redo** - Click the redo button or press `Ctrl+Y` or `Ctrl+Shift+Z`
- **Clear Canvas** - Click the clear button (affects all users, shows confirmation)

### User Interface
- **Connection Status** - Green dot indicates connected to server
- **Users Online** - Shows the count of active users
- **Active Users Panel** - Lists all connected users with their assigned colors
- **Cursor Indicators** - See other users' cursor positions when they move

## 🏗️ Project Structure

```
collaborative-canvas/
├── client/                 # Frontend files
│   ├── index.html         # Main HTML structure
│   ├── style.css          # Modern styling with glassmorphism
│   ├── canvas.js          # Canvas drawing engine
│   ├── websocket.js       # WebSocket client manager
│   └── main.js            # Application controller
├── server/                # Backend files
│   ├── server.js          # Express + Socket.io server
│   ├── rooms.js           # Room and user management
│   └── drawing-state.js   # Drawing state and undo/redo logic
├── package.json           # Project dependencies
├── README.md              # This file
└── ARCHITECTURE.md        # Technical architecture documentation
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Real-time**: Socket.io (WebSocket library)
- **Canvas**: Raw HTML5 Canvas API

## 🐛 Known Limitations

1. **Canvas State Persistence** - Canvas state is not saved to a database. When the server restarts, all drawings are lost.
2. **Single Room** - Currently supports only one global room (multi-room support is architecturally ready but not exposed in UI)
3. **No Authentication** - No user login system; users are identified by socket ID
4. **Large Operation History** - Very long drawing sessions may accumulate large operation history (could add periodic snapshots)
5. **Network Latency** - Drawing synchronization quality depends on network latency
6. **Browser Compatibility** - Tested on modern browsers (Chrome, Firefox, Safari). May not work on older browsers.

## ⚡ Performance Considerations

- **Event Throttling** - Cursor movement events are throttled to 50ms intervals
- **Efficient Redrawing** - Undo/redo redraws entire canvas from operation history
- **Canvas Optimization** - Uses `lineCap: 'round'` and `lineJoin: 'round'` for smooth lines
- **Memory Management** - Operation history grows unbounded (consider limits for production)

## 📊 Time Spent

**Total Development Time**: ~4-5 hours

Breakdown:
- Architecture & Planning: 1 hour
- Backend Implementation: 1 hour
- Frontend Canvas Engine: 1.5 hours
- UI/UX & Styling: 1 hour
- Testing & Debugging: 0.5 hours

## 🔮 Future Enhancements

- [ ] Canvas persistence (save to database/file)
- [ ] Multiple room support with UI
- [ ] User authentication and profiles
- [ ] Drawing shapes (rectangle, circle, line)
- [ ] Text tool
- [ ] Image upload and paste
- [ ] Export canvas as image
- [ ] Canvas snapshots for performance
- [ ] Draw history timeline view
- [ ] Collaborative permissions (view-only mode)
- [ ] Mobile app version

## 📝 License

MIT License - feel free to use this project for learning or building upon it.

## 🤝 Contributing

This is a technical assessment project, but suggestions and feedback are welcome!

---

**Built with ❤️ for collaborative creativity**
