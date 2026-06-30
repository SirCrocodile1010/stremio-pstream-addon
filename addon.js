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
    const embedUrl = `https://zstream.mov/e/${imdbId}`;

    const { data: embedHtml } = await axios.get(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://zstream.mov'
      },
      timeout: 10000
    });

    console.log('Got embed page for', imdbId);

    // Try to find m3u8 stream
    const m3u8Match = embedHtml.match(/file:\s*["']([^"']+\.m3u8[^"']*)/);
    if (m3u8Match) {
      return {
        streams: [{
          url: m3u8Match[1],
          name: 'ZStream',
          description: 'Stream from zstream.mov'
        }]
      };
    }

    // Try to find mp4 stream
    const mp4Match = embedHtml.match(/file:\s*["']([^"']+\.mp4[^"']*)/);
    if (mp4Match) {
      return {
        streams: [{
          url: mp4Match[1],
          name: 'ZStream',
          description: 'Stream from zstream.mov'
        }]
      };
    }

    // Try sources array
    const sourcesMatch = embedHtml.match(/sources:\s*\[([^\]]+)\]/);
    if (sourcesMatch) {
      const urlMatch = sourcesMatch[1].match(/["']([^"']+(?:m3u8|mp4)[^"']*)/);
      if (urlMatch) {
        return {
          streams: [{
            url: urlMatch[1],
            name: 'ZStream',
            description: 'Stream from zstream.mov'
          }]
        };
      }
    }

    console.log('No stream found for', imdbId);
    return { streams: [] };

  } catch (error) {
    console.error('Error fetching stream:', error.message);
    return { streams: [] };
  }
});

const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 7000 });
