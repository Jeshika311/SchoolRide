/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { fetchApi } from '../api';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

const parseUser = () => {
  try {
    return JSON.parse(localStorage.getItem('authUser') || '{}');
  } catch {
    return {};
  }
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [activeTripId, setActiveTripId] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [sosAlert, setSosAlert] = useState(null);
  const socketRef = useRef(null);

  const refreshNotifications = async () => {
    const authUser = parseUser();
    if (!authUser._id && !authUser.id) {
      return;
    }

    const [listRes, statsRes] = await Promise.all([
      fetchApi('/notification?limit=50'),
      fetchApi('/notification/stats')
    ]);

    if (listRes.status === 200 && listRes.data?.success) {
      setNotifications(listRes.data.data || []);
    }

    if (statsRes.status === 200 && statsRes.data?.success) {
      setUnreadCount(statsRes.data.data?.unread || 0);
    }
  };

  useEffect(() => {
    refreshNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    const authUser = parseUser();
    if (!authUser._id && !authUser.id) {
      return undefined;
    }

    const socketHost = window.location.origin.includes('localhost')
      ? 'http://localhost:5000'
      : window.location.origin;

    const connection = io(socketHost, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current = connection;
    setSocket(connection);

    connection.on('connect', () => {
      if (activeTripId) {
        connection.emit('join_trip', { tripId: activeTripId });
      }
    });

    connection.on('new_notification', (data) => {
      const notification = {
        _id: data.id || `${Date.now()}-${Math.random()}`,
        title: data.title,
        message: data.message,
        type: data.type || 'general',
        read: false,
        createdAt: new Date().toISOString(),
        data: data.data || {}
      };

      setNotifications((previous) => [notification, ...previous]);
      setUnreadCount((previous) => previous + 1);
      toast.info(data.title || 'New notification received');
    });

    connection.on('cab_location_broadcast', (payload) => {
      setLiveLocation(payload);
    });

    connection.on('transport_event_broadcast', (payload) => {
      setLiveLocation((previous) => ({
        ...previous,
        lastEvent: payload
      }));
    });

    connection.on('sos_broadcast', (payload) => {
      setSosAlert(payload);
      toast.error(payload.description || 'Emergency alert received');
    });

    return () => {
      connection.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [activeTripId]);

  const markAsRead = async (notificationId) => {
    await fetchApi(`/notification/${notificationId}/read`, {
      method: 'PATCH'
    });

    setNotifications((previous) => previous.map((notification) => (
      notification._id === notificationId
        ? { ...notification, read: true, readAt: new Date().toISOString() }
        : notification
    )));

    setUnreadCount((previous) => Math.max(previous - 1, 0));
  };

  const markAllAsRead = async () => {
    await fetchApi('/notification/read-all', {
      method: 'PATCH'
    });

    setNotifications((previous) => previous.map((notification) => ({
      ...notification,
      read: true,
      readAt: notification.readAt || new Date().toISOString()
    })));
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId) => {
    await fetchApi(`/notification/${notificationId}`, {
      method: 'DELETE'
    });

    setNotifications((previous) => previous.filter((notification) => notification._id !== notificationId));
  };

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications]
  );

  const value = {
    notifications,
    unreadNotifications,
    unreadCount,
    socket,
    activeTripId,
    setActiveTripId,
    liveLocation,
    sosAlert,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export default NotificationContext;
