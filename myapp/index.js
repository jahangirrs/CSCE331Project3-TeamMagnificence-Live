const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const path = require('path');
const { timeStamp } = require('console');
const cors = require('cors');

// Create express app
const app = express();
const port = 3000;

//Set who can request
const corsOrigin = {
    origin: "https://csce331project3-teammagnificence-live-o7uu.onrender.com"
  //  origin: "http://localhost:5173"
}
app.use(cors(corsOrigin));

// Create pool
const pool = new Pool({
    user: process.env.PSQL_USER,
    host: process.env.PSQL_HOST,
    database: process.env.PSQL_DATABASE,
    password: process.env.PSQL_PASSWORD,
    port: process.env.PSQL_PORT,
    ssl: {rejectUnauthorized: false}
});

// Add process hook to shutdown pool
process.on('SIGINT', function() {
    pool.end();
    console.log('Application successfully shutdown');
    process.exit(0);
});
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    const data = {name: 'Mario'};
    res.render('index', data);
});

app.get('/customer', (req, res) => {
    menu = []
    pool
        .query('SELECT item_name as name FROM menu;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                menu.push(query_res.rows[i]);
            }
            const data = {menu: menu};
            res.render('customer', data);
        });

});

//Get employee data
app.get('/manager/employees', (req, res) => {

    //get employee data from database
    employees = []
    pool
        .query('SELECT * FROM employees;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                employees.push(query_res.rows[i]);
            }
            const data = {employees: employees};
            res.json(employees);
        });
    
    
        
});

//Get inventory data
app.get("/manager/inventory", (req, res) => {
    //get inventory data from backend
    inventory = []
    pool
        .query('SELECT * FROM inventory;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventory.push(query_res.rows[i]);
            }
            const data = {inventory: inventory};
            res.json(inventory);
        });
});

//Get menu data
app.get("/manager/menu", (req, res) => {
    //get menu data from backend
    menu = []
    pool
        .query('SELECT * FROM menu;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                menu.push(query_res.rows[i]);
            }
            const data = {menu: menu}; 
            res.json(menu);
        });
});

// Sales data per hour since last Zreport
app.get("/manager/hourlySales", (req, res) => {
    //get timestamp of last Zreport generated
    lastZReport = [];
    startDate = [];
    pool
        .query("SELECT * FROM zreportgenerated ORDER BY date DESC LIMIT 1;")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                lastZReport = query_res.rows[i];
            }
            const data = {lastZReport: lastZReport};
            startDate = lastZReport.date.toISOString();
            startDate = startDate.replace("T", " ");
            startDate = startDate.replace("Z", "");

            //get sales data from backend
            sales = []
            now = new Date().toISOString();
            now = now.replace("T", " ");
            now = now.replace("Z", "");
            pool
                .query(`SELECT SUM(total_cost) AS sales, EXTRACT(HOUR FROM date) 
                    AS hour FROM orders WHERE date BETWEEN ` + 
                    "'" + startDate + "'" +  " AND " + 
                    "'" +  now + "'" +
                    ` GROUP BY hour ORDER BY hour;`)
                .then(query_res => {
                    for (let i = 0; i < query_res.rowCount; i++){
                        sales.push(query_res.rows[i]);
                    }
                    const data = {sales: sales};
                    res.json(sales);
                });
            
        });

    
});

//Get sales data given a specific time window
app.get("/manager/salesData", (req, res) => {

    startDate = req.params.start;
    endDate = req.params.end;
    console.log(startDate);
    console.log(endDate);
    //get sales data from backend
    sales = []
    pool
        .query(`SELECT * FROM orders WHERE date BETWEEN ` + 
            "'" + startDate + "'" +  " AND " + 
            "'" +  endDate + "'")
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                sales.push(query_res.rows[i]);
            }
            const data = {sales: sales};
            res.json(sales);
        });


});


app.get("/manager/purchaseOrder", (req, res) => {
    //get menu data from backend
    purchaseOrders = []
    pool
        .query('SELECT * FROM purchaseorders;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                purchaseOrders.push(query_res.rows[i]);
            }
            const data = {purchaseOrders: purchaseOrders}; 
            res.json(purchaseOrders);
        });
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
        