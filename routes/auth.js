const express = require('express');
const passport = require('passport');
const router = express.Router();

// Ruta para iniciar sesión
router.get('/login', passport.authenticate('discord'));

// Callback después del login
router.get(
    '/callback',
    passport.authenticate('discord', { failureRedirect: '/' }),
    (req, res) => {
        // Redirige al dashboard después de un login exitoso
        res.redirect('/dashboard');
    }
);

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

module.exports = router;
