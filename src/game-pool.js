import GameState from './game-state.js'

export default class GamePool {
  constructor () {
    this.games = []
  }

  // returns undefined if no game found
  getGameToRejoin (playerInfo) {
    for (const game of this.games) {
      if (game.validRejoin(playerInfo)) {
        return game
      }
    }
    return undefined
  }

  newPlayerJoin () {
    let i = 0;
    for (i = 0; i < this.games.length; i++) {
      const game = this.games[i]
      console.log(game.id)
      if (game.canAddPlayer()) {
        return game
      }
    }
    // existing games full:
    console.log('new game created, id:', i)
    const newGame = new GameState(i)
    this.games[i] = newGame
    return newGame
  }

  reset () {
    this.games = []
  }
}
