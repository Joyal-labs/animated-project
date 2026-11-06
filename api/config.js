module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const accessKey = process.env.WEB3FORMS_ACCESS_KEY || '8b016d03-708a-4363-9104-4c603bf09629';

  return res.status(200).json({
    success: true,
    access_key: accessKey
  });
};

