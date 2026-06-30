const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const axios = require('axios');

const builder = new addonBuilder({
  id: 'org.vidsrc.addon',
  version: '1.0.0',
  name: 'VidSrc',
  description: 'Streams movies and TV shows from vidsrc.to',
  resources: ['stream'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  catalogs: []
});

builder.defineStreamHandler(async (args) => {
  try {
    const parts = args.id.split(':');
    const imdbId = parts[0];
    const season = parts[1];
    const episode = parts[2];

    let embedUrl;
    if (season && episode) {
      embedUrl = `https://vidsrc.to/embed/tv/${imdbId}/${season}/${episode}`;
    } else {
      embedUrl = `https://vidsrc.to/embed/movie/${imdbId}`;
    }

    // Return embed as a stream URL directly
    return {
      streams: [
        {
          externalUrl: embedUrl,
          name: 'VidSrc',
          description: 'Stream from vidsrc.to'
        }
      ]
    };

  } catch (error) {
    console.error('Error:', error.message);
    return { streams: [] };
  }
});

const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 7000 });
