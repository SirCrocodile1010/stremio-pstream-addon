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

    // Log HTML so we can see the structure
    console.log('HTML SAMPLE:', embedHtml.substring(0, 2000));

    return { streams: [] };

  } catch (error) {
    console.error('Error:', error.message);
    return { streams: [] };
  }
});

const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 7000 });
