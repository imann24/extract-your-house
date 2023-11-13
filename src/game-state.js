import { v4 as uuidv4 } from 'uuid';

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
    this.sessionId = uuidv4().toString()
    this.deck = new Deck()
    this.deck.shuffle()
    this.players = []
    this.unclaimedSuits = ArrayUtil.shuffle(Deck.allSuits())
    this.turn = 0
    this.numInactivePlayers = 0
    this.startingPlayer = 0 // for the current trick
    this.tick = 0
    this.playedCards = {} // paired with player
    this.cardsInOrder = [] // array of played cards in order
    this.playersInOrder = []  // array of players matched with theirs cards in order
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

  // TODO: refactor getPlayerState into getState
  getPlayerState (playerId) {
    return {
      id: playerId,
      sessionId: this.sessionId,
      deck: this.deck,
      hand: this.getPlayer(playerId).hand,
      collectionPile: this.getPlayer(playerId).collectionPile,
      suit: this.getPlayer(playerId).suit,
      turn: this.turn,
      playedCards: this.playedCards,
      // This isn't techincally the individual player state but whatever:
      players: this.players
    }
  }

  getState () {
    return {
      deck: this.deck,
      players: this.players,
      turn: this.turn,
      // count up every time we update state
      tick: this.tick,
      playedCards: this.playedCards,
    }
  }

  getPlayer (playerId) {
    // playerId may be a string in some cases:
    return this.players[parseInt(playerId)]
  }

  // returns true is card was able to be played
  playCard (playerId, card) {
    const player = this.getPlayer(playerId)
    if (!player) {
      console.error(`invalid player ${playerId} with card ${JSON.stringify(card)}. Skipping move`)
      return false
    }

    console.log(`Player ${playerId} played card`, card)
    this.playedCards[playerId] = card
    this.cardsInOrder.push(card)
    this.playersInOrder.push(playerId)
    this.getPlayer(playerId).hand = this.getPlayer(playerId).hand.filter(c => !Deck.sameCard(c, card))
    console.log('cards left in hand', this.getPlayer(playerId).hand)
    return true
  }

  nextTurn () {
    this.turn ++
    this.turn %= this.players.length
    this.ensureActivePlayer()
    this.tick ++
  }

  ensureActivePlayer() {
    if (this.getPlayer(this.turn).hand.length == 0) {
      this.nextTurn()
    }
  }

  roundOver () {
    return Object.entries(this.playedCards).length === this.players.length - this.numInactivePlayers
  }

  getplayerTurnOrder (playerId) {
    if (playerId >= this.startingPlayer) {      
      return (playerId - this.startingPlayer)  
    }
    else {
      return this.players.length - (this.startingPlayer - playerId)
    }
  }

  scoreCard (card, playerId) {
    let ownSuitBonus = this.getPlayerState(playerId).suit == card.suit ? 1 : 0 
    return Deck.allValues().indexOf(card.value) + ownSuitBonus
  }

  assignRoundWinner () {
    let leadingPlayer
    let leadingScore = -1

    // so this should ensure that ties go to earlier players in round
    for (let i = 0; i < this.cardsInOrder.length; i++) {
      console.log('card ', this.cardsInOrder[i])

      const currentScore = this.scoreCard(this.cardsInOrder[i], this.playersInOrder[i])
      console.log('player ', this.playersInOrder[i], "score", currentScore)

      if (currentScore > leadingScore) {
        leadingPlayer = this.playersInOrder[i]
        leadingScore = currentScore
        console.log('leadingplayer ', leadingPlayer, "leadingScore", leadingScore)

      }
    }
    return leadingPlayer
  }

  powerPlayers(triggeringPlayerId, playerIds, suit, value) {

    for (let i = 0; i < value; i++) {
      let playerId = playerIds[i % playerIds.length]
      if (suit == 'Hearts') {
        if (!this.deck.empty()) {
          this.getPlayer(playerId).hand.push(this.deck.deal())
          console.log('adding from heart new size', this.getPlayer(playerId).hand.length)
        }
      }
      else if (suit == 'Diamonds') {
        if (this.getPlayer(playerId).collectionPile.length > 0) {
          // might be good that its always taking from the top....
          this.getPlayer(triggeringPlayerId).collectionPile.push(this.getPlayer(playerId).collectionPile.pop()) // todo decide on shuffling of things like collection decks...
          console.log('Diamonds new collection size for attacked player', this.getPlayer(playerId).collectionPile.length)
        } 
      }
      else if (suit == 'Clubs') {
        let hand = this.getPlayer(playerId).hand
        if (hand.length > 0) {
          ArrayUtil.shuffle(this.getPlayer(playerId).hand) // right now this is done multiple times per player often just fyi
          this.deck.cards.unshift(this.getPlayer(playerId).hand.pop())

          console.log('club removing from hand size ', this.getPlayer(playerId).hand.length)
        }
      }
    }
  }

  assignPowersToPlayers (roundWinner) {

    let poweringPlayer
    let lowestValueCard
    let spadePlayers = []
    let lowestSpadePower = 99

    for (let i = 0; i < this.cardsInOrder.length; i++) {
      let card = this.cardsInOrder[i]
      let player = this.playersInOrder[i]
      const currentScore = this.scoreCard(card, player)

      if (card.suit == 'Spades') {
          lowestSpadePower = currentScore
          spadePlayers.push(player)
          console.log('spade player: ', player)
      }       
      if (!lowestValueCard || currentScore < this.scoreCard(lowestValueCard, poweringPlayer)) {
        poweringPlayer = player
        lowestValueCard = card
        console.log('lowest value card ', lowestValueCard.value)
      }
    }

    let targetedPlayers = []
    let totalTurnsofBlockingPlayers = 0

    // value is + 2 when we display it to players and then maxes out at 10
    let attackPower = Math.min(this.scoreCard(lowestValueCard, poweringPlayer) + 2) + spadePlayers.length
    console.log('raw attack power: ', attackPower)

    if (lowestValueCard.suit == 'Hearts') {
      targetedPlayers.push(poweringPlayer)
    }

    // we do this to ensure the players are attacked in order starting from the winner of the trick
    else if (lowestValueCard.suit == 'Diamonds' || lowestValueCard.suit == 'Clubs') {


      let potentialTargetPlayers = []
      for (let i = 0; i < this.playersInOrder.length; i++) {
        if (this.playersInOrder[i] != poweringPlayer) {
          potentialTargetPlayers.push(this.playersInOrder[i])
          console.log('potential player index added ', i)
        }
      }

      for (let i = 0; i < attackPower; i++) {
        let startingIndex = roundWinner
        if (roundWinner > poweringPlayer) {
          startingIndex--
        }
        let curPlayerIndex = (startingIndex + i) % potentialTargetPlayers.length
        let curPlayer = potentialTargetPlayers[curPlayerIndex]
        if (curPlayer != poweringPlayer) {
          if (!spadePlayers.includes(curPlayer)) {
            if (!targetedPlayers.includes(curPlayer)) { // only add as target once
              targetedPlayers.push(curPlayer)
              console.log('targeting player: ', curPlayer)
            } 
          }
          else {
            totalTurnsofBlockingPlayers++
            console.log('totalTurnsofBlockingPlayers: ', totalTurnsofBlockingPlayers)
          }
        }
      }
      // attackPower is the value of the card (above) - but any attacks to blocking players is wasted, 
      // except for +1 collateral total value for each blocking player
      attackPower = attackPower - totalTurnsofBlockingPlayers
      console.log('actual attack power: ', attackPower)
    }

    if (targetedPlayers.length > 0) {
      this.powerPlayers(poweringPlayer, targetedPlayers, lowestValueCard.suit, attackPower, 10)
    }
  }

  roundResults () {
    return {
      winner: this.assignRoundWinner(),      
      cards: Object.values(this.playedCards)
    }
  }

  nextRound (roundWinner) {
    this.assignPowersToPlayers(roundWinner)

    this.getPlayer(roundWinner).collectionPile.push(...Object.values(this.playedCards))
    this.playedCards = {}
    this.cardsInOrder = []
    this.playersInOrder = []
    this.numInactivePlayers = 0

    for (let i = 0; i < this.players.length; i++) {
      if (!this.deck.empty()) {
        this.players[i].hand.push(this.deck.deal())
      }
      else if (this.players[i].hand.length == 0) {
        this.numInactivePlayers++
        console.log('inactive players: ', this.numInactivePlayers)
      }
    }
    this.startingPlayer = this.getPlayer(roundWinner).id // id is order number for now so 
    this.turn = this.startingPlayer
    this.ensureActivePlayer()
    this.tick ++
  }

  gameOver () {
    let cardActuallyInHand = false
    const playersWithCardsInHand = this.players.filter(p => {
      if (p.hand.length > 0) {
        cardActuallyInHand = true
        return true
      }
      // also count if the player has played a card this turn:
      return !!this.playedCards[p.id]
    })
    return this.deck.empty() && (playersWithCardsInHand.length <= 1 || !cardActuallyInHand)
  }

  handleGameOver () {
    this.tick ++
  }
  
  scoreCollectionPile (playerId) {
    const player = this.getPlayer(playerId)
    let points = 0
    for (const card of player.collectionPile) {
      if (player.suit === card.suit) {
        points ++
      }
    }
    return points
  }

  getWinner () {
    let leadingPlayer
    let leadingScore = -1
    for (const player of this.players) {
      const playerScore = this.scoreCollectionPile(player.id)
      // TODO: handle tie logic
      if (playerScore > leadingScore) {
        leadingPlayer = player
        leadingScore = playerScore
      }
    }
    return leadingPlayer
  }

  validRejoin (playerInfo) {
    if (!playerInfo.playerId || !playerInfo.sessionId) {
      return false
    }
    return !!this.players[parseInt(playerInfo.playerId)] && this.sessionId === playerInfo.sessionId
  }
}
