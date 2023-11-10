const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware')
const webpackHotMiddleware = require('webpack-hot-middleware')
const webpackConfig = require('./webpack.config')

const PORT = process.env.PORT || 3002

app.use(webpackDevMiddleware(webpack(webpackConfig), {
  publicPath: webpackConfig.output.publicPath
}))
app.use(webpackHotMiddleware(webpack(webpackConfig)))

// Serve static files from the "public" directory
app.use(express.static('public/dist'))

// Send the Phaser client when a user visits the root URL
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected')

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected')
  });
});

http.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`)
});
