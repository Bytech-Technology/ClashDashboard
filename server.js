const express = require('express');
const path = require('path');
require('dotenv').config();
const { getClanMembers, getClanInfo } = require('./api');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'assets')));

app.get('/', async (req, res) => {
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
        console.error(error);
        res.send('Error al obtener datos del clan');
    }
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
