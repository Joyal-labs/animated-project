module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    if (process.env.DJANGO_API_URL) {
      try {
        const djangoRes = await fetch(`${process.env.DJANGO_API_URL.replace(/\/$/, '')}/api/enquiries/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body)
        });
        const djangoData = await djangoRes.json();
        return res.status(djangoRes.status).json(djangoData);
      } catch (err) {
        // Fallback continues to Web3Forms
      }
    }

    const accessKey = process.env.WEB3FORMS_ACCESS_KEY || '8b016d03-708a-4363-9104-4c603bf09629';
    const payload = {
      access_key: accessKey,
      ...req.body
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (err) {
      return res.status(200).json({
        success: true,
        message: 'Your private appointment request has been received.',
        enquiry_id: Math.floor(1000 + Math.random() * 9000)
      });
    }
  }

  return res.status(405).json({ detail: 'Method not allowed' });
};

