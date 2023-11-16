import Phaser from 'phaser'

import Deck from './deck.js'
import { Card, Player } from './game-objects.js'
import { DECK_FACE_UP } from './game-rules.js'

export default class GameScene extends Phaser.Scene {
  constructor(socket, sizeConfig) {
    super({ key: 'game' })
    this.screen = sizeConfig
    this.socket = socket
    this.socket.emit('request-join', {
      playerId: sessionStorage.getItem('player-id'),
      sessionId: sessionStorage.getItem('session-id'),
    })
    this.socket.on('game-full', () => alert('lobby is full'))
    this.socket.on('player', state => {
      this.playerHandler(state)
      // initialize these in a callback so we know these values are set already
      this.suitText = this.add.text(50, 25, `GAME: ${this.gameId}`)
      this.suitText = this.add.text(50, 50, `SUIT: ${this.suit}`)
      this.playerText = this.add.text(50, 75, `PLAYER: ${this.id}`)  
    })
    this.socket.on('update', state => {
      this.updateHandler(state)
    })
    this.socket.on('game-over', state => {
      console.log("GAME OVER")
      this.gameOverHandler(state)
    })
    this.playerSprites = []
    this.deckSprites = []
    this.handSprites = []
    this.playedSprites = []
    this.playedTexts = []
    this.collectionPileSprites = []
    this.lastDrawnTick = -1
    this.stateSet = false
    this.gameOver = false
  }

  preload () {
    for (const card of Deck.allCards()) {
      const cardName = Deck.getCardName(card)
      this.load.image(cardName, `assets/${cardName}.png`)
    }
    for (const suit of Deck.allSuits()) {
      this.load.image(`playerIcon${suit}`, `assets/playerIcon${suit}.png`)
    }
    this.load.image('upArrow', 'assets/upArrow.png')
    this.load.image('cardBack', 'assets/cardBack.png')
  }

  // TODO: refactor playerHandler into updateHandler
  playerHandler (state) {
    this.id = state.id
    this.gameId = state.gameId
    // used for session stickiness:
    sessionStorage.setItem('player-id', this.id)
    sessionStorage.setItem('session-id', state.sessionId)
    this.deck = Deck.fromExisting(state.deck)
    this.hand = state.hand
    this.collectionPile = state.collectionPile
    this.suit = state.suit
    this.turn = state.turn
    this.playedCards = state.playedCards || {}
    this.players = state.players
    this.stateSet = true
    console.log('START state', state)
  }

  updateHandler (state) {
    this.deck = Deck.fromExisting(state.deck)
    this.hand = state.players[this.id].hand
    this.collectionPile = state.players[this.id].collectionPile
    this.turn = state.turn
    this.tick = state.tick
    this.playedCards = state.playedCards
    this.players = state.players
    this.stateSet = true
    console.log('UPDATE state', state)
  }

  gameOverHandler (state) {
    console.log(state)
    if (state.winner.id === this.id) {
      alert('You are the winner!')
    } else {
      alert(`Defeat. Player ${state.winner.id} is the winner.`)
    }
    this.gameOver = true
  }

  playerTurn () {
    return this.turn === this.id
  }

  updateTurnText () {
    if (this.turnText) this.turnText.destroy()
    this.turnText = this.add.text(50, 100, this.playerTurn() ? `TURN: ${this.turn} (yours)` : `TURN: ${this.turn}`)
  }

  create () {
    this.deckText = this.add.text(50, 150, 'PLAYED:')
    this.deckText = this.add.text(50, 300, 'DECK:')
    this.handText = this.add.text(50, 450, 'HAND:')
    this.collectionText = this.add.text(50, 600, 'COLLECTION PILE:')
    this.updateTurnText()
  }

  update () {
    // prevent early + unecessary updates:
    if (!this.stateSet || this.lastDrawnTick === this.tick) {
      return
    }

    this.updateTurnText()
    // playerSprites is the player icons
    for (let i = 0; i < this.playerSprites.length; i++) {
      this.playerSprites[i].destroy()
    }
    // playedSprites is the icons for cards that have been played
    for (let i = 0; i < this.playedSprites.length; i++) {
      this.playedSprites[i].destroy()
      this.playedTexts[i].destroy()
    }
    // lazy hack: recreate the entire deck every frame in case there were any updates
    for (let i = 0; i < this.deckSprites.length; i++) {
      this.deckSprites[i].destroy()
    }
    for (let i = 0; i < this.handSprites.length; i++) {
      this.handSprites[i].destroy()
    }
    for (let i = 0; i < this.collectionPileSprites.length; i++) {
      this.collectionPileSprites[i].destroy()
    }
    
    this.playerSprites = []
    this.playedSprites = []
    this.playedTexts = []
    this.deckSprites = []
    this.handSprites = []

    let playerXPos = 500
    for (const player of this.players) {
      const playerSprite = new Player(this, playerXPos, 100, player, this.turn)
      playerXPos += 200
      this.playerSprites.push(playerSprite)
    }
    let playedXPos = 50
    for (const [player, card] of Object.entries(this.playedCards)) {
      const cardSprite = new Card(this, playedXPos + 37.5, 225, card)
      this.playedSprites.push(cardSprite)
      const playerText = this.add.text(playedXPos, 275, `Player ${player}`)
      this.playedTexts.push(playerText)
      playedXPos += 125
    }
    let deckXPos = 75
    for (let i = 0; i < this.deck.count(); i++) {
      const card = new Card(this, deckXPos += 10, 375, this.deck.get(i), DECK_FACE_UP)
      this.deckSprites.push(card)
    }
    let handXPos = 35
    for (let i = 0; i < this.hand.length; i++) {
      const card = new Card(this, handXPos += 50, 525, this.hand[i])
      card.onClick(() => {
        if (this.playerTurn()) {
          this.socket.emit('play-card', this.hand[i])
        }
      })
      this.handSprites.push(card)
    }
    let collectionPileXPos = 35
    for (let i = 0; i < this.collectionPile.length; i++) {
      const card = new Card(this, collectionPileXPos += 50, 675, this.collectionPile[i])
      this.collectionPileSprites.push(card)
    }

    this.lastDrawnTick = this.tick
  }
}
