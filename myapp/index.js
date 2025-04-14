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
    //origin: "http://localhost:5173"
}
app.use(cors(corsOrigin));

app.use(express.json());

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
    const data = {name: 'Team Magnificence'};
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
    //get inventory data from DB
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
    //get menu data from DB
    menu = []
    pool
        .query('SELECT * FROM menu ORDER BY id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                menu.push(query_res.rows[i]);
            }
            const data = {menu: menu}; 
            res.json(menu);
        });
});

app.get("/manager/menu/:id", async (req, res) => {
    const menuId = parseInt(req.params.id);
  
    try {
      const menuQuery = await pool.query("SELECT * FROM menu WHERE id = $1", [menuId]);
      const menuData = menuQuery.rows[0];
  
      const inventoryLinkQuery = await pool.query(`
        SELECT mi.id as link_id, i.id as inventory_id, i.name, mi.invamount
        FROM menuinventory mi
        JOIN inventory i ON mi.inventoryid = i.id
        WHERE mi.menuid = $1`, [menuId]
      );
      const inventoryLinks = inventoryLinkQuery.rows;
  
      res.json({
        menu: menuData,
        inventoryLinks: inventoryLinks
      });
    } catch (err) {
      console.error("Error fetching menu for update:", err);
      res.status(500).json({ error: "Error fetching menu item" });
    }
  });
  
  app.put("/manager/menu/:id", async (req, res) => {
    const menuId = parseInt(req.params.id);
    const { menu, inventoryLinks } = req.body;
  
    const client = await pool.connect();
  
    try {
      await client.query('BEGIN');
  
      await client.query(
        "UPDATE menu SET item_name = $1, base_cost = $2, item_group = $3 WHERE id = $4",
        [menu.item_name, menu.base_cost, menu.item_group, menuId]
      );
  
      for (const link of inventoryLinks) {
        await client.query(
          "UPDATE menuinventory SET invamount = $1 WHERE menuid = $2 AND inventoryid = $3",
          [link.invamount, menuId, link.inventory_id]
        );
      }
  
      await client.query('COMMIT');
      res.json({ message: "Menu updated" });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Update menu error:", err);
      res.status(500).json({ error: "Failed to update menu" });
    } finally {
      client.release();
    }
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

    startDate = req.query.start;
    endDate = req.query.end;
    //get sales data from DB
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

//get purchase order data
app.get("/manager/purchaseOrder", (req, res) => {
    //get purchase order data from DB
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

// Add this endpoint to your existing index.js (before app.listen())
app.get("/manager/zreport", (req, res) => {
    // Get current date and time
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // First check if Z-Report was already generated today
    pool.query("SELECT date FROM zreportgenerated ORDER BY date DESC LIMIT 1;")
        .then(lastZReportResult => {
            if (lastZReportResult.rows.length > 0) {
                const lastDate = new Date(lastZReportResult.rows[0].date);
                if (lastDate.toDateString() === today.toDateString()) {
                    return res.status(400).json({ 
                        error: "Z-Report already generated for today" 
                    });
                }
            }

            // Get all report data
            const salesQuery = pool.query(`
                SELECT SUM(total_cost) as total_sales, COUNT(*) as sales_count 
                FROM orders 
                WHERE date BETWEEN $1 AND $2;`,
                [startOfDay, endOfDay]
            );

            const bestItemQuery = pool.query(`
                SELECT m.item_name, COUNT(*) as item_count 
                FROM menuorders mo
                JOIN menu m ON mo.menuid = m.id
                JOIN orders o ON mo.orderid = o.id
                WHERE o.date BETWEEN $1 AND $2
                GROUP BY m.item_name
                ORDER BY item_count DESC
                LIMIT 1;`,
                [startOfDay, endOfDay]
            );

            const lowStockQuery = pool.query(
                "SELECT name FROM inventory WHERE islow = TRUE;"
            );

            const peakHourQuery = pool.query(`
                SELECT EXTRACT(HOUR FROM date) as hour, COUNT(*) as sales 
                FROM orders 
                WHERE date BETWEEN $1 AND $2
                GROUP BY hour 
                ORDER BY sales DESC 
                LIMIT 1;`,
                [startOfDay, endOfDay]
            );

            // Execute all queries
            Promise.all([salesQuery, bestItemQuery, lowStockQuery, peakHourQuery])
                .then(([salesResult, bestItemResult, lowStockResult, peakHourResult]) => {
                    // Calculate values
                    const totalSales = salesResult.rows[0]?.total_sales || 0;
                    const salesCount = salesResult.rows[0]?.sales_count || 0;
                    const taxRate = 0.0825; // 8.25% tax rate
                    const totalTax = totalSales * taxRate;

                    const bestMenuItem = bestItemResult.rows[0]?.item_name || 'N/A';
                    const bestMenuItemCount = bestItemResult.rows[0]?.item_count || 0;

                    const lowStockItems = lowStockResult.rows.length > 0 
                        ? lowStockResult.rows.map(row => row.name).join(', ')
                        : 'None';

                    const peakHour = peakHourResult.rows[0] 
                        ? `${peakHourResult.rows[0].hour}:00 - ${peakHourResult.rows[0].hour + 1}:00`
                        : 'N/A';
                    const peakHourCount = peakHourResult.rows[0]?.sales || 0;

                    // Record Z-Report generation
                    pool.query("DELETE FROM zreportgenerated;")
                        .then(() => {
                            return pool.query("INSERT INTO zreportgenerated(id, date) VALUES (1, CURRENT_TIMESTAMP);");
                        })
                        .then(() => {
                            res.json({
                              reportDate: today.toISOString().split('T')[0],
                              totalSales: parseFloat(totalSales),
                              salesCount: parseInt(salesCount),
                              totalTax: parseFloat(totalTax.toFixed(2)),
                              bestMenuItem,
                              bestMenuItemCount: parseInt(bestMenuItemCount),
                              lowStockItems,
                              peakHour,
                              peakHourCount: parseInt(peakHourCount)
                            });
                        })
                        .catch(err => {
                            console.error("Error recording Z-Report:", err);
                            res.status(500).json({ error: "Error recording report" });
                        });
                })
                .catch(err => {
                    console.error("Error fetching report data:", err);
                    res.status(500).json({ error: "Error generating report" });
                });
        })
        .catch(err => {
            console.error("Error checking for previous Z-Report:", err);
            res.status(500).json({ error: "Error checking previous reports" });
        });
});
 
//
app.get("/auth", (req, res) => {
    //send data to google to get user Data
   fetch("https://oauth2.googleapis.com/token", {method: "POST", headers: {"Content-type": "application/x-www-form-urlencoded",} ,body: new URLSearchParams({
            code: req.query.code,
            client_id: "104092234806-rmjagmekkhhcrd303i16jd0cblcp9a8g.apps.googleusercontent.com",
            client_secret: process.env.CLIENT_SECRET,
             redirect_uri: "http://localhost:5173",
             grant_type: "authorization_code"
        })})
        .then(res => res.json())
        .then((data) =>{ res.json(data.id_token) })
})
app.get("/user", (req,res) => {

    user = [];

    //get user Data from DB
    const userQuery = "SELECT * FROM users WHERE id=$1;"
    pool
        .query(userQuery,[req.query.id])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                user.push(query_res.rows[i]);
            }

            //determine type of user and send to front end
            if(user.length === 1){
                if(user[0].employee_id === 0 && user[0].name !== "Stefan Dawson"){
                    res.json({path:"/Customer"});
                }
                else if(user[0].employee_id !== 0){
                    res.json({path: "/Cashier"});
                }
                else if(user[0].ismanager){
                    res.json({path:"/Manager"});
                }
            }

            //if user does not exist in database, make an entry
            else if(user.length === 0){
                const Insertquery = "INSERT INTO users VALUES ($1, $2, $3, $4);"
                //if an employee, get if manager or not
                if(req.query.employeeID !== "") {
                    isManager = [];
                    const managerQuery = "SELECT manager FROM employees WHERE id= $1;"
                    pool
                        .query(managerQuery, [req.query.employeeID])
                        .then(query_res => {
                            for (let i = 0; i < query_res.rowCount; i++) {
                                isManager.push(query_res.rows[i]);
                            }
                            const data = {isManager: isManager}

                            //Create insert query with parameterized values to protect against injection
                            const values = [req.query.id, req.query.name, parseInt(req.query.employeeID), isManager[0].manager];

                            pool
                                .query(Insertquery, values);

                            //return user type
                            if (req.query.employeeID === "") {
                                res.json({path: "/Customer"});
                            } else if (!isManager[0].manager) {
                                res.json({path: "/Cashier"});
                            } else if (isManager[0].manager) {
                                res.json({path: "/Manager"});
                            }
                        })
                }else{
                    const values = [req.query.id, req.query.name, null, null];
                    pool
                        .query(Insertquery, values);

                    res.json({path:"/Customer"});
                }
            }

        })





});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
        