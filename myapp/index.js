const express = require('express');
const { Pool } = require('pg');
const dotenv = require('dotenv').config();
const path = require('path');
const { timeStamp } = require('console');
const cors = require('cors');
const {jwtDecode} = require('jwt-decode');

// Create express app
const app = express();
const port = 3000;

//front end url
const FrontendURL = "https://csce331project3-teammagnificence-live-o7uu.onrender.com/";
//const FrontendURL = "http://localhost:5173";

//Set who can request
const corsOrigin = {
    origin: [FrontendURL, "https://csce331project3-teammagnificence-live-o7uu.onrender.com"]
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
        .query('SELECT * FROM employees ORDER BY id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                employees.push(query_res.rows[i]);
            }
            const data = {employees: employees};
            res.json(employees);
        });
    
    
        
});

app.put("/manager/employees", async (req, res) => {
    const updates = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const emp of updates) {
        await client.query(
          `UPDATE employees 
           SET name = $1
           ,manager = $2
           ,pto = $3
           WHERE id = $4`,
          [emp.name, emp.manager, emp.pto, emp.id]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Employees updated" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Employee update error:", err);
      res.status(500).json({ error: "Failed to update employees" });
    } finally {
      client.release();
    }
  });

app.post("/manager/employees", async (req, res) => {
  const { name, manager, pto } = req.body;

  try {
    await pool.query(
      `INSERT INTO employees (name, manager, pto) VALUES ($1, $2, $3)`,
      [name, manager, pto]
    );
    res.json({ message: "Employee added" });
  } catch (err) {
    console.error("Add employee error:", err);
    res.status(500).json({ error: "Failed to add employee" });
  }
});


//Get inventory data
app.get("/manager/inventory", (req, res) => {
    //get inventory data from DB
    inventory = []
    pool
        .query('SELECT * FROM inventory ORDER BY id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                inventory.push(query_res.rows[i]);
            }
            const data = {inventory: inventory};
            res.json(inventory);
        });
});

app.put("/manager/inventory", async (req, res) => {
    const updates = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const item of updates) {
        await client.query(
          `UPDATE inventory
           SET name = $1,
               unitsize = $2,
               idealstock = $3,
               itemprice = $4,
               supplier = $5,
               islow = $6
           WHERE id = $7`,
          [item.name, item.unitsize, item.idealstock, item.itemprice, item.supplier, item.islow, item.id]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Inventory updated" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Inventory update error:", err);
      res.status(500).json({ error: "Failed to update inventory" });
    } finally {
      client.release();
    }
  });

app.post("/manager/inventory", async (req, res) => {
    const { name, unitsize, idealstock, itemprice, supplier, islow } = req.body;

    try {
      await pool.query(
        `INSERT INTO inventory (name, unitsize, idealstock, itemprice, supplier, islow)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [name, unitsize, idealstock, itemprice, supplier, islow]
      );
      res.json({ message: "Inventory item added" });
    } catch (err) {
      console.error("Add inventory error:", err);
      res.status(500).json({ error: "Failed to add inventory item" });
    }
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

app.post("/manager/menu", async (req, res) => {
    const { item_name, base_cost, item_group } = req.body;

    try {
      await pool.query(
        `INSERT INTO menu (item_name, base_cost, item_group) VALUES ($1, $2, $3)`,
        [item_name, base_cost, item_group]
      );
      res.json({ message: "Menu item added" });
    } catch (err) {
      console.error("Add menu error:", err);
      res.status(500).json({ error: "Failed to add menu item" });
    }
  });

app.put("/manager/menu", async (req, res) => {
    const updates = req.body;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        for (const menuItem of updates) {
            await client.query(
                `UPDATE menu
         SET item_name = $1,
             base_cost = $2,
             item_group = $3
         WHERE id = $4`,
                [menuItem.item_name, menuItem.base_cost, menuItem.item_group, menuItem.id]
            );
        }

        await client.query("COMMIT");
        res.json({ message: "All menu items updated!" });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Bulk menu update error:", err);
        res.status(500).json({ error: "Failed to update menu items" });
    } finally {
        client.release();
    }
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
            "INSERT INTO menuinventory (menuid, inventoryid, invamount) VALUES($1, $2, $3) ON CONFLICT (menuid, inventoryid) DO UPDATE SET invamount = $3",
            [menuId, link.inventory_id, link.invamount]
        )
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
        .query('SELECT * FROM purchaseorders ORDER BY id ASC;')
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++){
                purchaseOrders.push(query_res.rows[i]);
            }
            const data = {purchaseOrders: purchaseOrders}; 
            res.json(purchaseOrders);
        });
});

app.put("/manager/purchaseOrder", async (req, res) => {
    const updates = req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const order of updates) {
        await client.query(
          `UPDATE purchaseorders
           SET quantity = $1,
               cost_per_unit = $2,
               total_cost = $3,
               order_status = $4,
               expected_arrival = $5,
               received_date = $6
           WHERE id = $7`,
          [
            order.quantity,
            order.cost_per_unit,
            order.total_cost,
            order.order_status,
            order.expected_arrival || null,
            order.received_date || null,
            order.id,
          ]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Purchase orders updated" });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Purchase order update error:", err);
      res.status(500).json({ error: "Failed to update purchase orders" });
    } finally {
      client.release();
    }
  });

app.post("/manager/purchaseOrder", async (req, res) => {
    const {
      inventory_name,
      unitsize,
      supplier_name,
      order_date,
      quantity,
      cost_per_unit,
      total_cost,
      order_status,
      expected_arrival,
      received_date
    } = req.body;

    try {
      await pool.query(
        `INSERT INTO purchaseorders (inventory_name, unitsize, supplier_name, order_date, quantity, cost_per_unit, total_cost, order_status, expected_arrival, received_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [inventory_name, unitsize, supplier_name, order_date, quantity, cost_per_unit, total_cost, order_status, expected_arrival || null, received_date || null]
      );
      res.json({ message: "Purchase order added" });
    } catch (err) {
      console.error("Add purchase order error:", err);
      res.status(500).json({ error: "Failed to add purchase order" });
    }
  });

//Submit order info after order is confirmed to db
app.post('/submitOrder', async (req, res) => {
    const order = req.body;
    console.log('Received order:', order);
    const client = await pool.connect();

    try{
        await client.query('BEGIN');

        const orderID = Math.floor(Math.random() * 10000000);

        const insertOrderQuery = 'INSERT INTO orders (id, date, total_cost, member, isprocessed) VALUES ($1, $2, $3, $4, $5);';

        await client.query(insertOrderQuery, [orderID, order.timestamp, order.orderTotal, 0, true]);

        const stockNums = [
            100, 100, 100, 100, 60,
            70, 70, 70, 50, 50,
            50, 100, 250, 20, 40,
            200, 10, 100, 2, 50,
            40, 10000, 10000, 10000, 50,
            50, 200, 1, 10000
        ];

        const inventoryPerItem = [
            .0055, .0044, .009, .009, .1,
            .079, .079, .079, .31, .31,
            .31, .2, .066, .175, .027,
            .066, .0067, .13, .0072, .22,
            .025, 1, 1, 1, .25,
            .22, .027, .0013, 1
        ];

        const menuItems = [
            "Classic Milk Tea", "Honey Milk Tea", "Classic Coffee", "Coffee Milk Tea",
            "Classic Tea", "Wintermelon Tea", "Honey Tea", "Ginger Tea",
            "Mango Green Tea", "Wintermelon Lemonade", "Strawberry Tea", "Peach Tea with Aiyu Jelly",
            "Fresh Milk Tea", "Wintermelon with Fresh Milk", "Cocoa Lover with Fresh Milk", "Fresh Milk Family"
        ];

        const menuItemInv = [
            [21,28,22,0,5,12],[21,28,22,0,16,9],[21,28,22,20,7,12],[21,28,22,0,20,11],
            [21,28,22,0,8,12],[21,28,22,13,15,0,4],[21,28,22,3,18,16],[21,28,22,14,16,18],
            [21,28,22,1,19,12,17,4],[21,28,22,13,15,18,17],[21,28,22,1,24,12,18],[21,28,22,2,25,12,18],
            [21,28,22,10,0,12],[21,28,22,13,15,8,4],[21,28,22,6,26,15,27],[21,28,22,5,15]
        ];

        for(const item of order.items){
            const menuIndex = menuItems.findIndex(name => name === item.name);

            if(menuIndex != -1){
                for(const invIndex of menuItemInv[menuIndex]){
                    const amtUsed = inventoryPerItem[invIndex];

                    const updateInventoryQuery = 'UPDATE inventory SET stocknum = stocknum - $1, stockpercent = (stocknum - $1) / $2 * 100, islow = CASE WHEN (stocknum - $1) < idealstock THEN true ELSE false END WHERE id = $3;';

                    await client.query(updateInventoryQuery, [amtUsed, stockNums[invIndex], invIndex]);

                }
            }
        }
        await client.query('COMMIT');
        res.status(200).send('Order successfully processed.');
    } catch(err){
        await client.query('ROLLBACK');
        console.error('Transaction failed:', err);
        res.status(500).send('Order processing failed.' + err.message);
    } finally {
        client.release();
    }
})

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

//Remove entries from tables
app.post("/manager/remove", (req, res) => {

    //protect against SQL injection by verifying input
    const tables = ["employees", "inventory", "menu", "purchaseorders"]
    if(tables.includes(req.query.table)) {
        const removeQuery = "DELETE FROM " + req.query.table + " WHERE id = $1;"
        const removeVals = [parseInt(req.query.id)];

        //if menu, want to remove ingredients list before removing menu entry
        if(req.query.table === "menu"){
            const removeMenuInventoryQuery = "DELETE FROM menuinventory WHERE menuid = $1;"
            pool
                .query(removeMenuInventoryQuery, removeVals)
                .then(() =>{
                    pool
                    .query(removeQuery, removeVals)
                    })
        }
        else {
            pool
                .query(removeQuery, removeVals)
        }

    }

})


//
app.get("/auth", (req, res) => {
    sub = "";
    //send data to google to get user Data
   fetch("https://oauth2.googleapis.com/token", {method: "POST", headers: {"Content-type": "application/x-www-form-urlencoded",} ,body: new URLSearchParams({
            code: req.query.code,
            client_id: "104092234806-rmjagmekkhhcrd303i16jd0cblcp9a8g.apps.googleusercontent.com",
            client_secret: process.env.CLIENT_SECRET,
             redirect_uri: FrontendURL,
             grant_type: "authorization_code"
        })})
        .then(res => res.json())
        .then((data) =>{
            sub = jwtDecode(data.id_token).sub

    user = [];

    //get user Data from DB
    const userQuery = "SELECT * FROM users WHERE id=$1;"
    pool
        .query(userQuery,[sub])
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                user.push(query_res.rows[i]);
            }

            //determine type of user and send to front end
            if (user.length === 1) {
                if (user[0].employee_id === null || user[0].employee_id === 0 && user[0].name !== "Stefan Dawson") {
                    res.json({exists: true, path: "/Customer", allergens: user[0].allergens});
                } else if (!user[0].ismanager) {
                    res.json({exists: true, path: "/Cashier"});
                } else if (user[0].ismanager) {
                    res.json({exists: true, path: "/Manager"});
                }
            } else {
                res.json({exists: false, sub: sub})
            }
        })
        })
})
app.get("/user", (req,res) => {
            //if user does not exist in database, make an entry
                const Insertquery = "INSERT INTO users VALUES ($1, $2, $3, $4, $5);"
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
                            const values = [req.query.id, req.query.name, parseInt(req.query.employeeID), isManager[0].manager, null];

                            pool
                                .query(Insertquery, values);

                            //return user type
                             if (!isManager[0].manager) {
                                res.json({path: "/Cashier"});
                            } else if (isManager[0].manager) {
                                res.json({path: "/Manager"});
                            }
                            else {
                                res.json({path: "/Customer"});
                            }
                        })
                }else{
                    const values = [req.query.id, req.query.name, null, null, "{" + req.query.allergens + "}"];
                    pool
                        .query(Insertquery, values);

                    res.json({path:"/Customer"});
                }
});

//get ingredients given menu item id
app.get("/ingredients", (req, res) => {

    //get ids of inventory items used in a menu item
    ingredientsIDs = []
    const idQuery = "SELECT inventoryid as id FROM menuinventory where menuid = $1;";
    const idVals = [req.query.id];

    pool
        .query(idQuery, idVals)
        .then(query_res => {
            for (let i = 0; i < query_res.rowCount; i++) {
                ingredientsIDs.push(query_res.rows[i].id);
            }
            const data = {ingredientsIDs: ingredientsIDs};

            const placeholderIDs = ingredientsIDs.map((_, i) => `$${i + 1}`).join(',');
            const nameQuery = "SELECT name from inventory WHERE id IN (" + placeholderIDs + ");";
            ingredientsNames = []
            pool
                .query(nameQuery, ingredientsIDs)
                .then(query_res =>{
                    for (let i = 0; i < query_res.rowCount; i++) {
                        ingredientsNames.push(query_res.rows[i].name);
                    }
                    const data = {ingredientsNames: ingredientsNames};

                    res.json(ingredientsNames);

                });

        })

});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
        