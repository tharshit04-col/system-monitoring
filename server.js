const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const si = require('systeminformation');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = 3000;

app.use(express.static('public'));

let currentInterface = null;

app.get('/interfaces', async (req, res) => {
  const interfaces = await si.networkInterfaces();
  res.json(interfaces.map(iface => iface.iface));
});

app.get('/logs/export', (req, res) => {
  const logPath = path.join(__dirname, 'logs', 'log.json');
  res.download(logPath, 'netwatch-log.json');
});

io.on('connection', (socket) => {
  console.log('Client connected');

  socket.on('setInterface', iface => {
    currentInterface = iface;
  });

  const interval = setInterval(async () => {
    try {
      // Network stats
      if (currentInterface) {
        const [stats] = await si.networkStats(currentInterface);
        const online = await si.inetChecksite('https://google.com');

        const networkData = {
          timestamp: new Date().toISOString(),
          interface: currentInterface,
          online: online.ok,
          rx: stats.rx_sec,
          tx: stats.tx_sec,
          packetsIn: stats.rx_packets,
          packetsOut: stats.tx_packets
        };

        socket.emit('networkData', networkData);

        // Log network data to file
        fs.appendFileSync('./logs/log.json', JSON.stringify(networkData) + ',\n');
      }

      // CPU & Memory stats
      const cpuLoad = await si.currentLoad();
      const cpuTempData = await si.cpuTemperature();
      const mem = await si.mem();

      const cpuData = {
        cpuLoad: cpuLoad.currentLoad.toFixed(1),
        cpuTemp: cpuTempData.main ? cpuTempData.main.toFixed(1) : 'N/A',
      };

      const memData = {
        total: (mem.total / 1024 ** 3).toFixed(2),
        used: (mem.used / 1024 ** 3).toFixed(2),
        free: (mem.free / 1024 ** 3).toFixed(2),
        available: (mem.available / 1024 ** 3).toFixed(2),
        active: (mem.active / 1024 ** 3).toFixed(2),
        buffcache: (mem.buffcache / 1024 ** 3).toFixed(2),
        slab: (mem.slab / 1024 ** 3).toFixed(2),
        swaptotal: (mem.swaptotal / 1024 ** 3).toFixed(2),
        swapused: (mem.swapused / 1024 ** 3).toFixed(2),
        swapfree: (mem.swapfree / 1024 ** 3).toFixed(2)
      };

      socket.emit('cpuData', cpuData);
      socket.emit('memData', memData);

    } catch (error) {
      console.error('Error fetching system info:', error);
    }
  }, 1000);

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
