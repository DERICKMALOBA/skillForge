import { io } from 'socket.io-client';

const socket = io('http://localhost:8000', {
  withCredentials: true,
  autoConnect: false // We'll connect manually when needed
});

export default socket;