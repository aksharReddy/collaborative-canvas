/**
 * Room Management
 * Handles user sessions, room state, and user color assignment
 */

class RoomManager {
    constructor() {
        // Map of roomId -> room data
        this.rooms = new Map();

        // Default room for single-room setup
        this.defaultRoomId = 'main';

        // Predefined colors for users
        this.userColors = [
            '#FF6B6B', // Red
            '#4ECDC4', // Teal
            '#45B7D1', // Blue
            '#FFA07A', // Light Salmon
            '#98D8C8', // Mint
            '#F7DC6F', // Yellow
            '#BB8FCE', // Purple
            '#85C1E2', // Sky Blue
            '#F8B500', // Orange
            '#52C41A'  // Green
        ];
    }

    /**
     * Get or create a room
     * @param {string} roomId - Room identifier
     * @returns {Object} Room data
     */
    getRoom(roomId = this.defaultRoomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                users: new Map(),
                colorIndex: 0
            });
        }
        return this.rooms.get(roomId);
    }

    /**
     * Add a user to a room
     * @param {string} roomId - Room identifier
     * @param {string} userId - User socket ID
     * @param {string} username - User display name
     * @returns {Object} User data with assigned color
     */
    addUser(roomId, userId, username) {
        const room = this.getRoom(roomId);

        // Assign color to user
        const color = this.userColors[room.colorIndex % this.userColors.length];
        room.colorIndex++;

        const userData = {
            id: userId,
            username: username || `User ${room.users.size + 1}`,
            color: color,
            joinedAt: Date.now()
        };

        room.users.set(userId, userData);

        return userData;
    }

    /**
     * Remove a user from a room
     * @param {string} roomId - Room identifier
     * @param {string} userId - User socket ID
     * @returns {boolean} Success status
     */
    removeUser(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return false;

        const result = room.users.delete(userId);

        // Clean up empty rooms (except default)
        if (room.users.size === 0 && roomId !== this.defaultRoomId) {
            this.rooms.delete(roomId);
        }

        return result;
    }

    /**
     * Get all users in a room
     * @param {string} roomId - Room identifier
     * @returns {Array} Array of user data
     */
    getRoomUsers(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return [];

        return Array.from(room.users.values());
    }

    /**
     * Get user data
     * @param {string} roomId - Room identifier
     * @param {string} userId - User socket ID
     * @returns {Object|null} User data or null
     */
    getUser(roomId, userId) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return room.users.get(userId) || null;
    }

    /**
     * Get total user count across all rooms
     * @returns {number} Total user count
     */
    getTotalUsers() {
        let total = 0;
        for (const room of this.rooms.values()) {
            total += room.users.size;
        }
        return total;
    }
}

module.exports = RoomManager;
