const mysql = require('mysql2/promise');

(async () => {
    const configs = [
        { user: 'root', password: '' },
        { user: 'root', password: 'password' },
        { user: 'admin', password: 'admin' },
    ];

    for (const cfg of configs) {
        try {
            const conn = await mysql.createConnection({
                host: 'localhost',
                port: 3306,
                user: cfg.user,
                password: cfg.password
            });
            console.log(`✓ SUCCESS: ${cfg.user} with "${cfg.password}"`);
            await conn.end();
            break;
        } catch (err) {
            console.error(`✗ FAILED ${cfg.user} with "${cfg.password}": ${err.code}`);
        }
    }
})();