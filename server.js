import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpackConfig from './webpack.config.js'

import GameState from './src/game-state.js'
import { GAME_TIMEOUT_MS } from './src/game-rules.js'

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
// start with just a single game instance:
games[0] = new GameState(0)
let gameTimeoutHandler

function resetGame () {
  games[0] = new GameState(0)
  console.log('game reset')
}

function createTimeoutHandler () {
  // remove the previous
  if (gameTimeoutHandler) {
    clearTimeout(gameTimeoutHandler)
  }
  gameTimeoutHandler = setTimeout(resetGame, GAME_TIMEOUT_MS)
}

app.get('/reset', (_, res) => {
  resetGame()
  res.send('game state reset')
})

// Handle WebSocket connections
io.on('connection', (socket) => {
  createTimeoutHandler()
  let player = { id: 'unknown' }
  // playerInfo may be empty depending on if this is a rejoin or not:
  socket.on('request-join', playerInfo => {
    if (games[0].validRejoin(playerInfo)) {
      player = games[0].getPlayerState(parseInt(playerInfo.playerId))
      socket.emit('player', player)
    } else {
      if (!games[0].canAddPlayer()) {
        socket.emit('game-full')
      } else {
        player = games[0].addPlayer()
        socket.emit('player', player)
        socket.broadcast.emit('update', games[0].getState())
      }
    }
    console.log(`Player ${player.id} connected`)
  })

  socket.on('play-card', card => {
    // reset the timeout because we've received a move:
    createTimeoutHandler()
    const playSuccessful = games[0].playCard(player.id, card)
    if (!playSuccessful) {
      // skip next steps in game logic if playCard failed
      return
    }

    if (games[0].roundOver()) {
      const results = games[0].roundResults()
      console.log('results', results)
      games[0].nextRound(results.winner)
    }
    else {
      games[0].nextTurn()
    }
    io.emit('update', games[0].getState())
    if (games[0].gameOver()) {
      games[0].handleGameOver()
      const winner = games[0].getWinner()
      console.log('game over')
      io.emit('game-over', {
        winner,
      })
    }
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player ${player.id} disconnected`)
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
});
