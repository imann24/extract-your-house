import Phaser from 'phaser'
import socketio from 'socket.io-client'
import GameScene from './scenes/game-scene'

const gameConfig = {
  width: 600,
  height: 480,
  scene: new GameScene()
}

window.game = new Phaser.Game(gameConfig)
// TODO: add player events
const socket = new socketio()
