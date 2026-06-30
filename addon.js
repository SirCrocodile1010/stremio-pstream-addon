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

    const { data: html } = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://vidsrc.to'
      },
      timeout: 10000
    });

    console.log('HTML SAMPLE:', html.substring(0, 3000));

    // Try common stream patterns
    const patterns = [
      /file:\s*["']([^"']+\.m3u8[^"']*)/,
      /file:\s*["']([^"']+\.mp4[^"']*)/,
      /"url":\s*"([^"]+\.m3u8[^"]*)/,
      /"url":\s*"([^"]+\.mp4[^"]*)/,
      /source:\s*["']([^"']+\.m3u8[^"']*)/,
      /src:\s*["']([^"']+\.m3u8[^"']*)/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        console.log('Found stream:', match[1]);
        return {
          streams: [{
            url: match[1],
            name: 'VidSrc',
            description: 'Stream from vidsrc.to'
          }]
        };
      }
    }

    console.log('No direct stream found');
    return { streams: [] };

  } catch (error) {
    console.error('Error:', error.message);
    return { streams: [] };
  }
});

const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 7000 });
