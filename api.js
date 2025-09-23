require('dotenv').config();

const BASE_URL = 'https://api.clashofclans.com/v1';
const headers = {
  Authorization: `Bearer ${process.env.CLASH_API_KEY}`,
};

// Obtener info del clan
async function getClanInfo(clanTag) {
  const res = await fetch(`${BASE_URL}/clans/${encodeURIComponent(clanTag)}`, { headers });
  if (!res.ok) throw new Error(`Error al obtener info del clan: ${res.status}`);
  return await res.json();
}

// Obtener miembros del clan
async function getClanMembers(clanTag) {
  const res = await fetch(`${BASE_URL}/clans/${encodeURIComponent(clanTag)}/members`, { headers });
  if (!res.ok) throw new Error(`Error al obtener miembros del clan: ${res.status}`);
  const data = await res.json();
  return data.items;
}

module.exports = { getClanMembers, getClanInfo };
