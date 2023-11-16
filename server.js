import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpackConfig from './webpack.config.js'

import GamePool from './src/game-pool.js'
import { GAME_TIMEOUT_MS, PAUSE_AFTER_ROUND_MS } from './src/game-rules.js'

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

const games = new GamePool()
let gameTimeoutHandler

// Send the Phaser client when a user visits the root URL
app.get('/', (_, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

function resetAllGames () {
  games.reset()
  console.log('all games reset')
}

// TODO: fix this to work with multiple games
function createTimeoutHandler () {
  // remove the previous
  if (gameTimeoutHandler) {
    clearTimeout(gameTimeoutHandler)
  }
  gameTimeoutHandler = setTimeout(resetGame, GAME_TIMEOUT_MS)
}

app.get('/reset', (_, res) => {
  resetAllGames()
  res.send('all games reset')
})

// Handle WebSocket connections
io.on('connection', socket => {
  // createTimeoutHandler()
  let player = { id: 'unknown' }
  // playerInfo may be empty depending on if this is a rejoin or not:
  socket.on('request-join', playerInfo => {
    console.log('game count:', games.games.length)
    // TODO: assign a game to the player
    const game = games.getGameToRejoin(playerInfo) || games.newPlayerJoin()
    socket.join(game.getSocketRoom())
    if (game.validRejoin(playerInfo)) {
      player = game.getPlayerState(parseInt(playerInfo.playerId))
      socket.emit('player', player)
    } else {
      player = game.addPlayer()
      socket.emit('player', player)
      socket.broadcast.emit('update', game.getState())
    }

    socket.on('play-card', card => {
      // reset the timeout because we've received a move:
      // createTimeoutHandler()
      const playSuccessful = game.playCard(player.id, card)
      if (!playSuccessful) {
        // skip next steps in game logic if playCard failed
        return
      }
  
      if (game.roundOver()) {
        setTimeout(() => {
          const results = game.roundResults()
          console.log('results', results)
          game.nextRound(results.winner)
          io.to(game.getSocketRoom()).emit('update', game.getState())
          if (game.gameOver()) {
            game.handleGameOver()
            const winner = game.getWinner()
            console.log('game over')
            io.to(game.getSocketRoom()).emit('game-over', {
              winner,
            })
          }
        }, PAUSE_AFTER_ROUND_MS)
      } else {
        game.nextTurn()
      }
      io.to(game.getSocketRoom()).emit('update', game.getState())
    })

    console.log(`Player ${player.id} connected`)
  })

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Player ${player.id} disconnected`)
  });
});

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
});
