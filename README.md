# StreamFit - WebRTC Video Chat Application

A real-time video chat application built with React, Node.js, and MediaSoup.

## Features

- Real-time video/audio communication
- Multiple room support
- WebRTC-based peer-to-peer connections
- MediaSoup SFU server for scalability
- Error handling and reconnection logic

## Environment Setup

### Frontend (React + Vite)

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your configuration:
   ```env
   VITE_SOCKET_URL=http://localhost:3000
   ```

### Backend (Node.js + MediaSoup)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

3. Update the backend `.env` file:
   ```env
   PORT=3000
   BACKEND_PORT=3000
   CORS_ORIGIN=*
   NUM_WORKERS=1
   LISTEN_IP=0.0.0.0
   ANNOUNCED_IP=your-server-ip-or-domain.com
   ```

## Installation

### Frontend Dependencies
```bash
npm install
```

### Backend Dependencies
```bash
cd backend
npm install
```

## Development

### Start Backend Server
```bash
cd backend
npm start
```

### Start Frontend Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and `http://localhost:3000` (backend).

## Production Deployment

### Environment Variables for Production

**Frontend (.env):**
```env
VITE_SOCKET_URL=https://your-backend-domain.com
```

**Backend (.env):**
```env
PORT=3000
BACKEND_PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
NUM_WORKERS=2
LISTEN_IP=0.0.0.0
ANNOUNCED_IP=your-production-domain.com
```

### Build for Production

**Frontend:**
```bash
npm run build
```

**Backend:**
The backend is ready for production as-is.

### Deployment Platforms

- **Frontend:** Vercel, Netlify, or any static hosting service
- **Backend:** Railway, Render, Heroku, or any Node.js hosting service

## Configuration

### MediaSoup Settings

The backend uses MediaSoup for WebRTC functionality. Key configuration options:

- `NUM_WORKERS`: Number of MediaSoup workers (default: number of CPU cores)
- `CORS_ORIGIN`: Allowed origins for CORS (default: `*`)
- `PORT`: Server port (default: 3000)
- `LISTEN_IP`: IP address to bind to (default: `127.0.0.1`)
- `ANNOUNCED_IP`: Public IP or domain for WebRTC connections (default: same as LISTEN_IP)

#### Hosting Configuration Examples:

**Local Development:**
```env
LISTEN_IP=127.0.0.1
ANNOUNCED_IP=127.0.0.1
```

**Railway/Heroku:**
```env
LISTEN_IP=0.0.0.0
ANNOUNCED_IP=your-app-name.railway.app
```

**DigitalOcean/AWS:**
```env
LISTEN_IP=0.0.0.0
ANNOUNCED_IP=your-server-ip
```

**Docker:**
```env
LISTEN_IP=0.0.0.0
ANNOUNCED_IP=your-domain.com
```

### Socket.IO Configuration

The frontend connects to the backend via Socket.IO. The connection URL is configured via:

- `VITE_SOCKET_URL`: Backend Socket.IO server URL (default: `http://localhost:3000`)

## Troubleshooting

### Common Issues

1. **Connection Issues:**
   - Ensure backend server is running on the correct port
   - Check that `VITE_SOCKET_URL` matches your backend URL
   - Verify CORS settings in backend `.env`

2. **Media Issues:**
   - Ensure camera/microphone permissions are granted
   - Check browser WebRTC support
   - Verify MediaSoup worker configuration

3. **Environment Variables:**
   - Make sure `.env` files exist in both frontend and backend directories
   - Restart development servers after changing environment variables
   - Use `VITE_` prefix for frontend environment variables

## Technology Stack

- **Frontend:** React 19, Vite, Socket.IO Client, Tailwind CSS
- **Backend:** Node.js, Express, Socket.IO, MediaSoup
- **WebRTC:** MediaSoup SFU Server
- **Styling:** Tailwind CSS
