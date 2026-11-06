const DEFAULT_PURPOSES = [
  { id: 1, name: "Private Salon Viewing", description: "Dedicated VIP appointment in a private boutique salon to view and inspect Reference 126688." },
  { id: 2, name: "Acquisition Reservation", description: "Formal allocation and client dossier preparation for purchasing the 18 ct yellow gold Yacht-Master II." },
  { id: 3, name: "Technical Horological Presentation", description: "In-depth walkthrough of Calibre 4161, regatta countdown memory programming, and Ring Command bezel interaction." },
  { id: 4, name: "Bespoke Fitting & Sizing", description: "Tailored bracelet fitting with 5 mm Easylink comfort extension and link adjustment by certified Rolex watchmakers." }
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (process.env.DJANGO_API_URL) {
    try {
      const response = await fetch(`${process.env.DJANGO_API_URL.replace(/\/$/, '')}/api/consultation-purposes/`);
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (err) {
      // Fallback to built-in purposes if remote backend is unreachable
    }
  }

  return res.status(200).json(DEFAULT_PURPOSES);
};

