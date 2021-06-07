require("dotenv").config()
const SpotifyWebApi = require("spotify-web-api-node")
const express = require("express")
const open = require("open")
var randomstring = require("randomstring")

const scopes = [
    "user-read-private",
    "user-read-email",
    "playlist-modify-public",
    "user-library-read",
  ],
  redirectUri = process.env.REDIRECT_URI,
  clientId = process.env.CLIENT_ID,
  clientSecret = process.env.CLIENT_SECRET,
  state = randomstring.generate()

const spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId,
  clientSecret,
})

const playlistName = "public-favourites"
const playlistDescription = "public mirror of my saved tracks"

const run = async () => {
  const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state)
  const server = express()
  server.get("/oauth", async (req, res, nextFunction) => {
    const code = req.query.code
    const authRes = await spotifyApi.authorizationCodeGrant(code)
    spotifyApi.setAccessToken(authRes.body.access_token)
    spotifyApi.setRefreshToken(authRes.body.refresh_token)
    const user = await spotifyApi.getMe()
    try {
      let playlists = []
      let next = true
      const limit = 50
      let offset = 0
      while (next) {
        console.log("fetching playlists...")
        let playlistRes = await spotifyApi.getUserPlaylists({ limit, offset })
        playlists = playlists.concat(playlistRes.body.items)
        next = playlistRes.body.next
        offset = playlistRes.body.offset
      }
      console.log(`fetched ${playlists.length} playlists`)

      let playlist = playlists.find((x) => x.name === playlistName)
      if (!playlist) {
        console.log(`no playlist with name ${playlistName} found, creating...`)
        playlist = (
          await spotifyApi.createPlaylist(playlistName, {
            description: playlistDescription,
          })
        ).body
      } else {
        console.log(`found existing playlist with name ${playlistName}`)
      }
      let currentPlaylistTracks = []
      next = true
      offset = 0
      while (next != null) {
        console.log("fetching current playlist tracks...")
        const playlistTracks = await spotifyApi.getPlaylistTracks(playlist.id, {
          limit,
          offset,
        })
        next = playlistTracks.body.next
        offset = playlistTracks.body.offset + limit
        currentPlaylistTracks = currentPlaylistTracks.concat(
          playlistTracks.body.items
        )
      }
      console.log(
        `fetched ${currentPlaylistTracks.length} current playlist tracks`
      )

      let tracks = []
      next = true
      offset = 0
      while (next !== null) {
        console.log("fetching saved tracks...")
        const tracksRes = await spotifyApi.getMySavedTracks({ limit, offset })
        next = tracksRes.body.next
        offset = tracksRes.body.offset + limit
        tracks = tracks.concat(tracksRes.body.items)
      }
      console.log(`fetched ${tracks.length} saved tracks`)
      console.log("cleaning playlist")
      let tracksToRemove = [...currentPlaylistTracks]
      while (tracksToRemove.length > 0) {
        console.log(`${tracksToRemove.length} tracks left to remove`)
        const removal = await spotifyApi.removeTracksFromPlaylist(
          playlist.id,
          tracksToRemove.splice(0, 100).map((x) => ({ uri: x.track.uri }))
        )
      }
      console.log("filling playlist")
      let tracksToAdd = [...tracks]
      while (tracksToAdd.length > 0) {
        console.log(`${tracksToAdd.length} tracks left to add`)
        const add = await spotifyApi.addTracksToPlaylist(
          playlist.id,
          tracksToAdd.splice(0, 100).map((t) => t.track.uri)
        )
      }
    } catch (e) {
      console.error(e)
      res
        .status(500)
        .send(`Sorry ${user.body.display_name}, something went wrong...`)
      process.exit(0)
    }
    res.send(
      `Hej ${user.body.display_name}, that worked. Checkout your playlists...`
    )
    process.exit(0)
  })
  server.listen("8080", async () => {
    await open(authorizeURL, { wait: true })
  })
}

run()
