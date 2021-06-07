# Spotify Public Favourites

https://community.spotify.com/t5/Live-Ideas/Make-quot-Liked-Songs-quot-playlist-shareable/idi-p/4872982

Since this is still not possible, here is a script to publish your spotify favourites via a public playlist.

## !!! Use at your own risk!

## !!! This script contains destructive actions! If you own a playlist called `public-favourites` it will completely overwrite it!

## Steps

- nodejs > 14
- Go to https://developer.spotify.com/dashboard and create an oauth application
- copy .env-default to .env and set your oauth configs there
- `npm install`
- `node index.js`
- the browser will open, consent and give it a second.
- Check your playlists.

#### What it does:

- fetches playlists.
- checkes if you have a `public-favourites` list. If so, removes all tracks. If not, creates a new one.
- fetches all your favourite tracks.
- adds them to the playlist.
