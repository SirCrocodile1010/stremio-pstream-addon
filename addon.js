const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const axios = require('axios');
const cheerio = require('cheerio');

// Create addon builder with manifest
const builder = new addonBuilder({
  id: 'org.pstream.example',
  version: '1.0.0',
  name: 'PStream',
  description: 'Streams from pstream.mov',
  resources: ['stream'],
  types: ['movie', 'series'],
  idPrefixes: ['pstream://'],
  catalogs: []
});

// Define stream handler
builder.defineStreamHandler(async (args) => {
  if (!args.id.startsWith('pstream://')) {
    return { streams: [] };
  }

  const pstreamId = args.id.replace('pstream://', '');
  const pstreamUrl = `https://zstream.mov/e/${pstreamId}`;

  try {
    // Fetch the pstream page
    const { data: html } = await axios.get(pstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': pstreamUrl,
      },
    });

    // Parse HTML to extract form data
    const $ = cheerio.load(html);
    const id = $('input[name="id"]').val();
    const token = $('input[name="token"]').val();

    if (!id || !token) {
      throw new Error('Could not extract form data');
    }

    // Request stream data
    const streamData = await axios.post(
      `https://zstream.mov/api/source/${pstreamId}`,
      new URLSearchParams({ id, token }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Referer': pstreamUrl,
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );

    // Extract the first stream URL
    const streamUrl = streamData.data.data[0]?.file;
    if (!streamUrl) {
      throw new Error('No stream URL found');
    }

    return {
      streams: [
        {
          url: streamUrl,
          name: 'PStream',
          description: 'Stream from zstream.mov',
        },
      ],
    };
  } catch (error) {
    console.error('Error fetching stream:', error.message);
    return { streams: [] };
  }
});

// Get the addon interface and serve it
const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { port: 7000 });
