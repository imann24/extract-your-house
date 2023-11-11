import Phaser from 'phaser'
import socketio from 'socket.io-client'
import GameScene from './game-scene.js'

const sizeConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
}
const gameConfig = {
  ...sizeConfig,
  scene: new GameScene(new socketio(), sizeConfig)
}

window.game = new Phaser.Game(gameConfig)
