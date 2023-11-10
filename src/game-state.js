import { PLAYER_MAX, CARDS_TO_DEAL } from './game-rules.js'
import Deck from './deck.js'
import ArrayUtil from './array-util.js'

class Player {
  constructor (id, suit) {
    this.id = id
    this.hand = []
    this.collectionPile = []
    this.suit = suit
  }
}
export default class GameState {
  constructor (id) {
    this.id = id
    this.deck = new Deck()
    this.deck.shuffle()
    this.players = []
    this.unclaimedSuits = ArrayUtil.shuffle(Deck.allSuits())
  }

  canAddPlayer () {
    return this.players.length < PLAYER_MAX
  }

  addPlayer () { 
    // use player count as the id for a new player
    const player = new Player(this.players.length, this.unclaimedSuits.pop())
    for (let i = 0; i < CARDS_TO_DEAL; i++) {
      player.hand.push(this.deck.deal())
    }
    this.players.push(player)
    return this.getPlayerState(player.id)
  }

  getPlayerState (playerId) {
    return {
      id: playerId,
      deck: this.deck,
      hand: this.players[playerId].hand,
      collectionPile: this.players[playerId].collectionPile,
      suit: this.players[playerId].suit,
    }
  }

  getState () {
    return {
      deck: this.deck,
      players: this.players,
    }
  }
}
