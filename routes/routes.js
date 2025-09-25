const express = require('express');
const routes = express();
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config();
const { getClanMembers, getClanInfo } = require('../api');

// Carpeta donde se guardan los snapshots
const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR);

// Función para guardar snapshot
async function saveWeeklySnapshot(fakeDate = null) {
    try {
        const members = await getClanMembers(process.env.CLAN_TAG);
        const players = members.map(p => ({
            id: p.tag,
            nombre: p.name,
            donaciones: p.donations,
            donacionesRecibidas: p.donationsReceived,
            trofeos: p.trophies,
            xp: p.expLevel,
            nivel: p.townHallLevel,
            warStars: p.warStars || 0
        }));

        const date = fakeDate || new Date();
        const filename = `viernes_${date.getDate()}_${date.getMonth()+1}_${date.getFullYear()}.json`;
        fs.writeFileSync(path.join(SNAPSHOT_DIR, filename), JSON.stringify(players, null, 2));

        console.log("✅ Snapshot guardado:", filename);
    } catch (err) {
        throw new Error("Error guardando snapshot: " + err.message);
    }
}

// Función para comparar snapshots
function compareSnapshots(oldSnap, newSnap) {
    const diffs = [];
    for (let player of newSnap) {
        const prev = oldSnap.find(p => p.id === player.id);
        if (prev) {
            let cambios = {};
            ["donaciones", "donacionesRecibidas", "trofeos", "xp", "nivel", "warStars"].forEach(field => {
                if (player[field] !== prev[field]) {
                    cambios[field] = { antes: prev[field], ahora: player[field], diff: player[field] - prev[field] };
                }
            });
            if (Object.keys(cambios).length > 0) {
                diffs.push({ id: player.id, nombre: player.nombre, cambios });
            }
        }
    }
    return diffs;
}

// Middleware para admin
function requireAdmin(req, res, next) {
  if (req.session.isAdmin) return next();
  res.redirect('/login');
}

// Función para cargar últimos snapshots
function loadSnapshots() {
    const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.endsWith('.json'));
    if (files.length < 2) return []; 
    files.sort((a, b) => {
        return fs.statSync(path.join(SNAPSHOT_DIR, b)).mtime - fs.statSync(path.join(SNAPSHOT_DIR, a)).mtime;
    });
    return files.slice(0, 2);
}

// --- VERIFICACIÓN AL INICIAR PARA SNAPSHOT DEL VIERNES ---
const today = new Date();
const filename = `viernes_${today.getDate()}_${today.getMonth()+1}_${today.getFullYear()}.json`;
const filePath = path.join(SNAPSHOT_DIR, filename);

if (today.getDay() === 5 && !fs.existsSync(filePath)) {
    console.log("⚡ Generando snapshot de hoy automáticamente al iniciar...");
    saveWeeklySnapshot(today).catch(err => console.error(err.message));
}

// Cron normal para todos los viernes a la 00:00
cron.schedule('0 0 * * 5', () => saveWeeklySnapshot().catch(err => console.error(err.message)));

// --- RUTAS ---

routes.get('/', async (req, res, next) => {
    try {
        const clanInfo = await getClanInfo(process.env.CLAN_TAG);
        const members = await getClanMembers(process.env.CLAN_TAG);

        const players = members.map(player => {
            const donaciones = player.donations;
            const donacionesRecibidas = player.donationsReceived;
            const nivel = player.townHallLevel;
            const xp = player.expLevel;
            const trofeos = player.trophies;
            const clanRank = player.clanRank;
            const leagueName = player.league ? player.league.name : 'Sin liga';
            const leagueIcon = player.league ? player.league.iconUrls.medium : '';
            const warStars = player.warStars || 0;

            let estado = 'Expulsion';
            if ((donaciones >= 150 || donacionesRecibidas >= 150) && (nivel >= 8 || trofeos >= 1000) && xp >= 50) {
                estado = 'activos';
            } else if ((donaciones >= 100 || donacionesRecibidas >= 100) && (nivel >= 6 || trofeos >= 500) && xp >= 30) {
                estado = 'Advertencia';
            }
             
            const roleMap = {
                admin: 'Veterano',
                coLeader: 'Colider',
                leader: 'Lider'
            };

            let role = roleMap[player.role] || 'miembro';

            return {
                id:player.tag,
                nombre: player.name,
                nivel,
                donaciones,
                donacionesRecibidas,
                xp,
                trofeos,
                role,
                clanRank,
                leagueName,
                leagueIcon,
                warStars,
                estado
            };
        });

        res.render('index', { clanInfo, players });
    } catch (error) {
        next(error);
    }
});

routes.get('/login', (req, res) => {
  res.render('login', { error: null });
});

routes.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { key } = req.body;
  if (key === process.env.ADMIN_KEY) {
    req.session.isAdmin = true;
    return res.redirect('/admin');
  }
  res.send("<script>alert('Clave incorrecta'); window.location.href='/'</script>");
});

routes.get('/admin', requireAdmin, (req, res, next) => {
    try {
        const files = loadSnapshots();
        if (files.length < 2) {
            return res.send("⚠️ No hay suficientes snapshots para comparar.");
        }

        const [newFile, oldFile] = files;
        const newSnap = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, newFile)));
        const oldSnap = JSON.parse(fs.readFileSync(path.join(SNAPSHOT_DIR, oldFile)));
        const differences = compareSnapshots(oldSnap, newSnap);

        res.render('admin', { differences, newFile, oldFile });
    } catch (err) {
        next(err);
    }
});

routes.get('/make-test-snapshots', async (req, res, next) => {
  try {
    const d1 = new Date(2025, 0, 17);
    const d2 = new Date(2025, 0, 24);
    await saveWeeklySnapshot(d1);
    await saveWeeklySnapshot(d2);
    res.send("✅ Se generaron 2 snapshots de prueba.");
  } catch (err) {
    next(err); // pasa al middleware de error
  }
});


// --- MIDDLEWARES DE ERROR ---

// 404
routes.use((req, res) => {
  res.status(404).render('error', { 
    message: 'Página no encontrada', 
    redirectTo: '/' 
  });
});

// Otros errores (500, etc.)
routes.use((err, req, res, next) => {
  console.error("⚠️ Error detectado:", err);
  res.status(500).render('error', { 
    message: err.message || 'Error interno del servidor', 
    redirectTo: '/' 
  });
});

module.exports = routes;
