const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/proxy-photo', async (req, res) => {
  const { photourl } = req.query;

  if (!photourl) {
    return res.status(400).send('Missing photourl parameter');
  }

  try {
    const response = await axios.get(photourl, {
      responseType: 'arraybuffer',
    });

    res.set('Content-Type', response.headers['content-type']);
    res.send(response.data);
  } catch (error) {
    console.error('Image proxy error:', error.message);
    res.status(500).send('Image load error');
  }
});

module.exports = router;
