import Phaser from 'phaser'
import socketio from 'socket.io-client'
import GameScene from './scenes/game-scene.js'

const gameConfig = {
  width: 600,
  height: 480,
  scene: new GameScene(new socketio())
}

window.game = new Phaser.Game(gameConfig)
