import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3001";

export const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: false,
});

export const connectSocket = (token) => {
    socket.auth = { token };
    socket.connect();
};

export const connectGuest = () => {
    socket.auth = { token: 'GUEST' };
    socket.connect();
};
