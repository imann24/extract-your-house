import Phaser from 'phaser'
import socketio from 'socket.io-client'
import GameScene from './game-scene.js'

const gameConfig = {
  width: 1920,
  height: 1080,
  scene: new GameScene(new socketio())
}

window.game = new Phaser.Game(gameConfig)
