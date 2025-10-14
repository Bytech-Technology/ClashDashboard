const express = require('express');
const routes = express.Router();
require('dotenv').config();
const { getClanMembers, getClanInfo } = require('../api');

// Ruta principal: muestra la info del clan y los jugadores
routes.get('/', async (req, res, next) => {
    try {
        const clanInfo = await getClanInfo(process.env.CLAN_TAG);
        const members = await getClanMembers(process.env.CLAN_TAG);

        const players = members.map(player => {
            const donaciones = player.donations || 0;
            const donacionesRecibidas = player.donationsReceived || 0;
            const nivel = player.townHallLevel || 0;
            const xp = player.expLevel || 0;
            const trofeos = player.trophies || 0;
            const clanRank = player.clanRank;
            const leagueName = player.leagueTier ? player.leagueTier.name : 'Sin liga';
            const leagueIcon = player.leagueTier ? player.leagueTier.iconUrls.large : '';
            const warStars = player.warStars || 0;

            let estado = 'Expulsion';

            if ((donaciones >= 150 || donacionesRecibidas >= 150) && nivel >= 8) {
                estado = 'Activos';
            } else if ((donaciones >= 100 || donacionesRecibidas >= 100) && nivel >= 6) {
                estado = 'Advertencia';
            }

            const roleMap = {
                admin: 'Veterano',
                coLeader: 'Colider',
                leader: 'Lider'
            };

            let role = roleMap[player.role] || 'miembro';

            return {
                id: player.tag,
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

// Manejo de errores 404
routes.use((req, res) => {
    res.status(404).render('error', {
        message: 'Página no encontrada',
        redirectTo: '/'
    });
});

// Manejo de errores generales
routes.use((err, req, res, next) => {
    console.error("⚠️ Error detectado:", err);
    res.status(500).render('error', {
        message: err.message || 'Error interno del servidor',
        redirectTo: '/'
    });
});

module.exports = routes;
