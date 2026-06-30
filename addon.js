const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const axios = require('axios');

const builder = new addonBuilder({
  id: 'org.zstream.addon',
  version: '1.0.0',
  name: 'ZStream',
  description: 'Streams movies and TV shows from zstream.mov',
  resources: ['stream'],
  types: ['movie', 'series'],
  idPrefixes: ['tt'],
  catalogs: []
});

builder.defineStreamHandler(async (args) => {
  try {
    const imdbId = args.id.split(':')[0];
    
    // Search zstream.mov for the IMDB ID
    const searchUrl = `https://zstream.mov/search?q=${imdbId}`;
    const { data: searchHtml } = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // Find embed URL with IMDB ID
    const embedMatch = searchHtml.match(/href="(\/e\/[^"]+)"/);
    if (!embedMatch) return { streams: [] };

    const embedId = embedMatch[1].replace('/e/', '');
    const embedUrl = `https://zstream.mov/e/${embedId}`;

    // Get embed page
    const { data: embedHtml } = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': embedUrl
      }
    });

    // Extract stream URL
    const streamMatch = embedHtml.match(/file:\s*["']([^"']+\.m3u8[^"']*)/);
    if (!streamMatch) return { streams: [] };

    return {
      streams: [
        {
          url: streamMatch[1],
          name: 'ZStream',
          description: 'Stream from zstream.mov'
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching stream:', error.message);
    return { streams: [] };
  }
});

const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 7000 });
