import React from 'react';
import { useSocket } from '../contexts/SocketContext';
import './OnlineUsers.css';

const OnlineUsers: React.FC = () => {
  const { onlineUsers, isConnected } = useSocket();

  if (!isConnected) {
    return (
      <div className="online-users">
        <div className="online-users-header">
          <div className="status-indicator offline"></div>
          <span>Offline</span>
        </div>
      </div>
    );
  }

  return (
    <div className="online-users">
      <div className="online-users-header">
        <div className="status-indicator online"></div>
        <span>Online ({onlineUsers.length})</span>
      </div>
      {onlineUsers.length > 0 && (
        <div className="online-users-list">
          {onlineUsers.map(user => (
            <div key={user.id} className="online-user">
              <div className="user-avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <span className="user-name">{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;