import Phaser from 'phaser'
import socketio from 'socket.io-client'

const gameConfig = {
  width: 600,
  height: 480,
}

window.game = new Phaser.Game(gameConfig)
const socket = new socketio()
