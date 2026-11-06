const DEFAULT_LOCATIONS = [
  { id: 1, name: "Geneva — Rue du Rhône Flagship", city: "Geneva", country: "Switzerland", phone: "+41 22 310 12 34", is_active: true },
  { id: 2, name: "London — New Bond Street Boutique", city: "London", country: "United Kingdom", phone: "+44 20 7493 2299", is_active: true },
  { id: 3, name: "Mumbai — The Taj Mahal Palace", city: "Mumbai", state: "Maharashtra", country: "India", phone: "+91 22 6665 3366", is_active: true },
  { id: 4, name: "New Delhi — The Chanakya", city: "New Delhi", state: "Delhi", country: "India", phone: "+91 11 2611 1199", is_active: true },
  { id: 5, name: "Bengaluru — UB City", city: "Bengaluru", state: "Karnataka", country: "India", phone: "+91 80 4173 8899", is_active: true },
  { id: 6, name: "Dubai — The Dubai Mall", city: "Dubai", country: "United Arab Emirates", phone: "+971 4 339 8999", is_active: true },
  { id: 7, name: "New York — Fifth Avenue", city: "New York", state: "NY", country: "United States", phone: "+1 212 758 7700", is_active: true },
  { id: 8, name: "Singapore — Marina Bay Sands", city: "Singapore", country: "Singapore", phone: "+65 6688 7788", is_active: true }
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
      const response = await fetch(`${process.env.DJANGO_API_URL.replace(/\/$/, '')}/api/jeweller-locations/`);
      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (err) {
      // Fallback to built-in locations if remote backend is unreachable
    }
  }

  return res.status(200).json(DEFAULT_LOCATIONS);
};

