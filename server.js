import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpackConfig from './webpack.config.js'
import GameState from './src/game-state.js'

const app = express()
const server = http.Server(app)
const io = new SocketIOServer(server)
const PORT = process.env.PORT || 3002

app.use(webpackDevMiddleware(webpack(webpackConfig), {
  publicPath: webpackConfig.output.publicPath
}))
app.use(webpackHotMiddleware(webpack(webpackConfig)))

// Serve static files from the "public" directory
app.use(express.static('public/dist'))

// Send the Phaser client when a user visits the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

const games = []
// start with just a single game state with:
games[0] = new GameState(0)

// Handle WebSocket connections
io.on('connection', (socket) => {
  const player = games[0].addPlayer()
  console.log(`Player ${player.id} connected`)
  socket.emit('player', player)

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player ${player.id} disconnected`)
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
});
