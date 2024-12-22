const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Strategy = require('passport-discord').Strategy;
const { Client, GatewayIntentBits } = require('discord.js');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Configuración de Discord.js
client.once('ready', () => {
    console.log(`Bot logged in as ${client.user.tag}`);
});
client.login(process.env.DISCORD_TOKEN);

// Configuración de Passport
passport.use(
    new Strategy(
        {
            clientID: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
            callbackURL: process.env.DISCORD_CALLBACK_URL,
            scope: ['identify', 'guilds'],
        },
        (accessToken, refreshToken, profile, done) => {
            process.nextTick(() => done(null, profile));
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Middleware de sesión y Passport
app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// Middleware de Express
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Rutas
app.use('/auth', require('./routes/auth'));

app.get('/', (req, res) => {
    res.render('index', { user: req.user });
});

app.get('/dashboard', async (req, res) => {
    if (!req.isAuthenticated()) return res.redirect('/auth/login');
    const guilds = await client.guilds.fetch();
    const servers = guilds.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
    }));
    res.render('dashboard', { user: req.user, servers });
});

// API para obtener servidores
app.get('/api/servers', async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const guilds = await client.guilds.fetch();
        const servers = guilds.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
        }));
        res.json(servers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error fetching servers' });
    }
});

// Servidor en el puerto 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard running on http://localhost:${PORT}`));
