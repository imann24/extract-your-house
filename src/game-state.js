import Deck from './deck.js'

class Player {
  constructor (id) {
    this.id = id
    this.hand = []
    this.collectionPile = []  
  }
}
export default class GameState {
  constructor (id) {
    this.id = id
    this.deck = new Deck()
    this.players = []
  }

  addPlayer () { 
    // use player count as the id for a new player
    const player = new Player(this.players.length)
    this.players.push(new Player(this.players.length))
    return this.getPlayerState(player.id)
  }

  getPlayerState (playerId) {
    return {
      id: playerId,
      deck: this.deck,
      hand: this.players[playerId].hand,
      collectionPile: this.players[playerId].collectionPile,
    }
  }
}
