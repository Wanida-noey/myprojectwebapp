import { error } from 'console';
import 'dotenv/config';
// const express = require('express');
import express from 'express'

const app = express();
app.use(express.json());

const DRONE_CONFIG_URL = process.env.DRONE_CONFIG_URL;
const DRONE_LOG_URL = process.env.DRONE_LOG_URL;
const DRONE_LOG_TOKEN = process.env.DRONE_LOG_TOKEN;
 console.log("Config server: ", DRONE_CONFIG_URL);
 console.log("Log Server: ", DRONE_LOG_URL);
 console.log("Log token exist? ", !!DRONE_LOG_TOKEN);

// define a route for the root URL
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

async function getLogs(droneId, { page = 1, perPage = 12 } = {}) {
    const baseURL = process.env.DRONE_LOG_URL;
    const url = new URL(baseURL);
   // const respone = await fetch(DRONE_LOG_URL + '?sort=-created&perPage=15');

   //filter ตาม PocketBase (drone_id เป็นตัวเลข ไม่ต้องใส่ quote)
    url.searchParams.set('filter', `drone_id=${Number(droneId)}`);
    url.searchParams.set('sort', '-created');
    url.searchParams.set('page', String(page));
    url.searchParams.set('perPage', String(perPage));

    const headers = { 'Content-Type': 'application/json' };
    if (process.env.DRONE_LOG_TOKEN) {
        headers.Authorization = `Bearer ${process.env.DRONE_LOG_TOKEN}`;
    }

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) {
        const txt = await response.text();
        throw new Error(`Log server error: ${response.status} ${txt}`);
    }

    const body = await response.json(); // { page, perPage, totalItems, items: [...] }
    const items = body.items || [];

    // คงไว้เฉพาะ field ตามโจทย์
    return items.map(it => ({
        drone_id:   it.drone_id,
        drone_name: it.drone_name,
        created:    it.created,
        country:    it.country,
        celsius:    it.celsius,
    }));
}

async function getDroneConfigs() {
    const respone = await fetch(DRONE_CONFIG_URL);
    const body = await respone.json();
    const data = body.data;

    return data;
}

//66010730
app.get('/config/:droneId', async (req, res) => {

    // droneId is route parameter. Its type is string
    const droneId = Number(req.params.droneId);
    console.log(droneId);

    const droneConfigs = await getDroneConfigs();
    const config = droneConfigs.find( drone => drone.drone_id === droneId );

    // remove unwanted fields
    delete config.condition;
    delete config.population;
    res.json(config);
    });

app.get('/status/:droneId', async (req, res) => {
    const droneId = Number(req.params.droneId);

    const droneConfigs = await getDroneConfigs();
    const config = droneConfigs.find( drone => drone.drone_id === droneId );

    if (!config){
        return res.status(404).json({ error: 'Drone not found'});
    }
    
    res.json({
        condition: config.condition
    });
});

app.get('/log/:droneId', async (req, res) => {
    try {
        const droneId = Number(req.params.droneId);
        if (Number.isNaN(droneId)) 
            return res.status(400).json({error: 'Invalid droneId'});

        const page = req.query.page ? Number(req.query.page) : 1;
        const perPage = req.query.perPage ? Number(req.query.perPage) : 12;

        const logs = await getLogs(droneId, { page, perPage });
        res.json(logs);
    }   catch (err) {
        res.status(500).json({ error : String(err.message || err ) });
    }
})

app.post('/logs', (req, res) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', async () => {
        try {
            const body = raw ? JSON.parse(raw) : {};
            const { drone_id, drone_name, country, celsius } = body || {};

            // ตรวจสอบแบบเบื้องต้น
            if (typeof drone_id !== 'number' || typeof drone_name !== 'string' || typeof country !== 'string') {
                return res.status(400).json({
                    error: 'Invalid body: require drone_id(number), drone_name(string), country(string), celsius(number|string)'
                });
            }

            const baseUrl = process.env.DRONE_LOG_URL;
            const headers = { 'Content-Type': 'application/json' };
            if (process.env.DRONE_LOG_TOKEN) {
                headers.Authorization = `Bearer ${process.env.DRONE_LOG_TOKEN}`;
            }

            const response = await fetch(baseUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ drone_id, drone_name, country, celsius })
            });

            if (!response.ok) {
                const txt = await response.text();
                return res.status(502).json({ error: `Create log failed: ${response.status} ${txt}` });
            }

            const created = await response.json();
            // คืนเฉพาะ field ตามโจทย์
            res.status(201).json({
                drone_id:   created.drone_id,
                drone_name: created.drone_name,
                created:    created.created,
                country:    created.country,
                celsius:    created.celsius
        });
    }   
        catch (err) {
        res.status(500).json({ error: String(err.message || err) });
        }
    });
});

// run sever listening on port 3000
const port = process.env.PORT || 3000;
export default app;
if (!process.env.VERCEL){
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
});
}