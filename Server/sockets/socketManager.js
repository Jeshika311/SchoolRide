import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const userSockets = new Map();
let ioInstance = null;

const parseCookieHeader = (cookieHeader = '') => {
  return cookieHeader.split(';').reduce((accumulator, pair) => {
    const [rawKey, ...rawValue] = pair.split('=');
    if (!rawKey || rawValue.length === 0) {
      return accumulator;
    }

    const key = rawKey.trim();
    const value = rawValue.join('=').trim();
    accumulator[key] = decodeURIComponent(value);
    return accumulator;
  }, {});
};

export const initializeSockets = (io) => {
  ioInstance = io;

  io.use((socket, next) => {
    try {
      let token = null;

      if (socket.handshake.headers.cookie) {
        const cookies = parseCookieHeader(socket.handshake.headers.cookie);
        token = cookies.token || null;
      }

      if (!token) {
        const authHeader = socket.handshake.headers.authorization || socket.handshake.auth?.token;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        } else if (socket.handshake.query?.token) {
          token = socket.handshake.query.token;
        }
      }

      if (!token) {
        logger.warn('Socket connection rejected: Token missing');
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error.message);
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;
    const normalizedUserId = String(userId);

    logger.info(`Socket connected: ${socket.id} (User: ${normalizedUserId}, Role: ${role})`);

    if (!userSockets.has(normalizedUserId)) {
      userSockets.set(normalizedUserId, new Set());
    }
    userSockets.get(normalizedUserId).add(socket.id);

    socket.join(`user:${normalizedUserId}`);
    socket.join(`role:${role}`);

    socket.on('join_trip', ({ tripId }) => {
      if (tripId) {
        socket.join(`trip:${tripId}`);
      }
    });

    socket.on('leave_trip', ({ tripId }) => {
      if (tripId) {
        socket.leave(`trip:${tripId}`);
      }
    });

    socket.on('driver_location_update', ({ tripId, latitude, longitude, speed, heading }) => {
      if (role !== 'driver' && role !== 'admin') {
        return socket.emit('error_message', { message: 'Unauthorized broadcast action' });
      }

      socket.to(`trip:${tripId}`).emit('cab_location_broadcast', {
        tripId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date()
      });
    });

    socket.on('sos_triggered', ({ tripId, location, description }) => {
      const payload = {
        tripId,
        location,
        description: description || 'Driver triggered breakdown / SOS alert',
        senderId: normalizedUserId,
        timestamp: new Date()
      };

      io.to('role:admin').emit('sos_broadcast', payload);
      socket.to(`trip:${tripId}`).emit('sos_broadcast', payload);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id} (User: ${normalizedUserId})`);
      const activeSockets = userSockets.get(normalizedUserId);
      if (activeSockets) {
        activeSockets.delete(socket.id);
        if (activeSockets.size === 0) {
          userSockets.delete(normalizedUserId);
        }
      }
    });
  });
};

export const emitToUser = (userId, event, data) => {
  if (!ioInstance) {
    return false;
  }

  ioInstance.to(`user:${userId}`).emit(event, data);
  return true;
};

export const emitToRole = (role, event, data) => {
  if (!ioInstance) {
    return false;
  }

  ioInstance.to(`role:${role}`).emit(event, data);
  return true;
};

export const emitToTrip = (tripId, event, data) => {
  if (!ioInstance) {
    return false;
  }

  ioInstance.to(`trip:${tripId}`).emit(event, data);
  return true;
};

export default {
  initializeSockets,
  emitToUser,
  emitToRole,
  emitToTrip
};
