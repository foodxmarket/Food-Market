const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({limit: '50mb'})); 
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(express.static(__dirname));

// Robust Database Connection using Railway URL
const db = mysql.createPool(process.env.MYSQL_URL || process.env.DATABASE_URL || {
    host: process.env.MYSQLHOST || 'localhost',
    user: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || 'Ramp@123',
    database: process.env.MYSQLDATABASE || 'railway',
    port: process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log('Database Connection Pool Created Successfully!');

const otpStorage = {}; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'foodxmarket@gmail.com',
        pass: 'zvovaphgrvdqzdao'
    }
});

// =====================================
// AUTH & OTP APIs
// =====================================

// 1. Send OTP API (Safe with Error Catching)
app.post('/api/send-otp', (req, res) => {
    const { email } = req.body;
    
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
       if (err) {
            console.error('SQL Error details:', err);
            return res.status(500).json({ error: 'Database error: ' + err.sqlMessage });
        }
        if (results.length === 0) return res.status(404).json({ error: 'Email not registered!' });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        otpStorage[email] = otp; 

        const mailOptions = {
            from: '"Food Market Team" <foodxmarket@gmail.com>', 
            to: email,
            subject: 'Food Market - Secure Login OTP',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; max-width: 400px; margin: auto; background-color: #f9f9f9;">
                    <h2 style="color: #ff5200; text-align: center;">Food Market</h2>
                    <p style="font-size: 16px; color: #333;">To safely login to your account, use this OTP:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; background: #fff; padding: 10px 20px; border: 2px dashed #28a745; color: #28a745; letter-spacing: 5px;">${otp}</span>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Email Send Error:', error.message);
                return res.status(500).json({ error: 'Failed to send email: ' + error.message });
            }
            res.json({ message: 'OTP sent to your email!' });
        });
    });
});

app.post('/api/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (otpStorage[email] && otpStorage[email] === otp) {
        delete otpStorage[email]; 
        db.query('SELECT id, username, name, email, mobile FROM users WHERE email = ?', [email], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, user: results[0] });
        });
    } else {
        res.status(401).json({ error: 'Invalid or Expired OTP!' });
    }
});

app.post('/api/send-register-otp', (req, res) => {
    const { email, username } = req.body;
    db.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) return res.status(400).json({ error: 'Email or Username already registered!' });

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        otpStorage[email] = otp; 

        const mailOptions = {
            from: '"Food Market Welcome" <foodxmarket@gmail.com>', 
            to: email,
            subject: 'Welcome to Food Market! Verify your Email',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; max-width: 400px; margin: auto; background-color: #fff9f5;">
                    <h2 style="color: #ff5200; text-align: center;">Food Market</h2>
                    <p style="font-size: 16px; color: #333;">Welcome aboard, <b>${username}</b>! 🎉</p>
                    <p style="font-size: 16px; color: #333;">Your email verification code is:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="font-size: 24px; font-weight: bold; background: #fff; padding: 10px 20px; border: 2px dashed #ffc107; color: #333; letter-spacing: 5px; border-radius: 5px;">${otp}</span>
                    </div>
                </div>
            `
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return res.status(500).json({ error: 'Failed to send OTP' });
            res.json({ message: 'OTP sent to your email!' });
        });
    });
});

app.post('/register', (req, res) => {
    const { username, name, email, mobile, password, otp } = req.body;
    if (otpStorage[email] && otpStorage[email] === otp) {
        db.query('INSERT INTO users (username, name, email, mobile, password) VALUES (?, ?, ?, ?, ?)', 
        [username, name, email, mobile, password], (err) => {
            if (err) return res.status(400).json({ error: 'Registration failed!' });
            delete otpStorage[email]; 
            res.json({ message: 'Registration Successful! You can now login.' });
        });
    } else {
        res.status(401).json({ error: 'Invalid or Expired OTP!' });
    }
});

app.post('/login', (req, res) => {
    const { loginId, password } = req.body;
    db.query('SELECT id, username, name, email, mobile FROM users WHERE (email = ? OR username = ?) AND password = ?', [loginId, loginId, password], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) res.json({ success: true, user: results[0] });
        else res.status(401).json({ error: 'Wrong ID or Password!' });
    });
});

// =====================================
// FOOD & ORDER APIs
// =====================================
app.get('/api/foods', (req, res) => {
    db.query('SELECT f.id, f.food_name, f.price, f.image_url, f.in_market, f.seller_id, u.username as sellerUsername FROM foods f JOIN users u ON f.seller_id = u.id ORDER BY f.created_at DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/add-food', (req, res) => {
    const { seller_id, food_name, price, image_url } = req.body;
    db.query('INSERT INTO foods (seller_id, food_name, price, image_url, in_market) VALUES (?, ?, ?, ?, 1)', [seller_id, food_name, price, image_url], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Item Added to Market!' });
    });
});

app.post('/api/toggle-food', (req, res) => {
    db.query('UPDATE foods SET in_market = ? WHERE id = ?', [req.body.in_market, req.body.food_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Market Status Updated!' });
    });
});

app.post('/api/place-order', (req, res) => {
    const { buyer_id, food_id, delivery_address, quantity, payment_method } = req.body;
    db.query('INSERT INTO orders (buyer_id, food_id, delivery_address, quantity, payment_method, status) VALUES (?, ?, ?, ?, ?, "Waiting for Seller")', 
    [buyer_id, food_id, delivery_address, quantity, payment_method], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order Placed!' });
    });
});

app.get('/api/orders/:buyer_id', (req, res) => {
    db.query('SELECT o.id, o.status, o.estimated_time, o.payment_method, DATE_FORMAT(o.order_date, "%d-%b-%Y") as date, f.food_name, f.price FROM orders o JOIN foods f ON o.food_id = f.id WHERE o.buyer_id = ? ORDER BY o.order_date DESC', [req.params.buyer_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/seller-orders/:seller_id', (req, res) => {
    const query = `
        SELECT o.id, o.quantity, o.delivery_address, o.status, o.estimated_time, o.payment_method, DATE_FORMAT(o.order_date, "%d-%b-%Y") as date, f.food_name, u.name as buyer_name, u.mobile as buyer_mobile 
        FROM orders o JOIN foods f ON o.food_id = f.id JOIN users u ON o.buyer_id = u.id 
        WHERE f.seller_id = ? ORDER BY o.order_date DESC
    `;
    db.query(query, [req.params.seller_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/update-order', (req, res) => {
    const { order_id, estimated_time } = req.body;
    db.query('UPDATE orders SET status = "Accepted by Seller", estimated_time = ? WHERE id = ?', 
    [estimated_time, order_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Response sent to buyer!' });
    });
});

app.post('/api/cancel-order', (req, res) => {
    db.query('UPDATE orders SET status="Cancelled" WHERE id=?', [req.body.order_id], 
    (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({message: "Order Cancelled successfully."});
    });
});

// =====================================
// WISHLIST, OFFICE & ADMIN APIs
// =====================================
app.post('/api/add-wishlist', (req, res) => {
    db.query('INSERT INTO wishlist (buyer_id, food_id) VALUES (?, ?)', [req.body.buyer_id, req.body.food_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Added to Wishlist!' });
    });
});

app.get('/api/wishlist/:buyer_id', (req, res) => {
    db.query('SELECT w.id, f.food_name, f.price FROM wishlist w JOIN foods f ON w.food_id = f.id WHERE w.buyer_id = ?', [req.params.buyer_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/remove-wishlist', (req, res) => {
    db.query('DELETE FROM wishlist WHERE id = ?', [req.body.wishlist_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Removed from Wishlist!' });
    });
});

app.get('/api/office-orders', (req, res) => {
    const query = `
        SELECT o.id, o.quantity, o.delivery_address, o.status, o.payment_method, DATE_FORMAT(o.order_date, "%d-%b-%Y") as date, 
        f.food_name, u.name as buyer_name, u.mobile as buyer_mobile 
        FROM orders o JOIN foods f ON o.food_id = f.id JOIN users u ON o.buyer_id = u.id ORDER BY o.order_date DESC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.post('/api/update-order-status', (req, res) => {
    const { order_id, status } = req.body;
    db.query('UPDATE orders SET status = ? WHERE id = ?', [status, order_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: `Order status updated to: ${status}` });
    });
});

app.post('/api/create-delivery-boy', (req, res) => {
    const { name, mobile, username, password } = req.body;
    db.query('INSERT INTO delivery_boys (name, mobile, username, password) VALUES (?, ?, ?, ?)', 
    [name, mobile, username, password], (err) => {
        if(err) return res.status(500).json({error: "Username might already exist"});
        res.json({message: "Delivery Boy created successfully!"});
    });
});

app.post('/delivery-login', (req, res) => {
    db.query('SELECT id, name FROM delivery_boys WHERE username=? AND password=?', 
    [req.body.username, req.body.password], (err, results) => {
        if(results.length > 0) res.json({success: true, user: results[0]});
        else res.status(401).json({error: 'Invalid Credentials'});
    });
});

app.get('/api/delivery-boys-list', (req, res) => {
    db.query('SELECT id, name FROM delivery_boys', (err, results) => res.json(results));
});

app.post('/api/admin-assign-order', (req, res) => {
    const { order_id, time, db_id } = req.body;
    db.query('UPDATE orders SET estimated_time=?, delivery_boy_id=?, status="Out for Delivery" WHERE id=?', 
    [time, db_id, order_id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({message: "Order Sent for Delivery!"});
    });
});

app.get('/api/delivery-tasks/:db_id', (req, res) => {
    const q = `SELECT o.*, f.food_name, u.name as buyer_name, u.mobile as buyer_mobile 
               FROM orders o JOIN foods f ON o.food_id=f.id JOIN users u ON o.buyer_id=u.id 
               WHERE o.delivery_boy_id=? AND o.status="Out for Delivery"`;
    db.query(q, [req.params.db_id], (err, results) => res.json(results));
});

app.post('/api/confirm-delivery', (req, res) => {
    db.query('UPDATE orders SET status="Delivered" WHERE id=?', [req.body.order_id], 
    (err) => res.json({message: "Delivery Completed!"}));
});

app.get('/api/admin/sellers-and-stock', (req, res) => {
    db.query('SELECT id, username, name, mobile FROM users', (err, users) => {
        if(err) return res.status(500).json({error: err.message});
        db.query('SELECT id, seller_id, food_name, price FROM foods', (err, foods) => {
            if(err) return res.status(500).json({error: err.message});
            res.json({ users, foods });
        });
    });
});

app.post('/api/admin/delete-user', (req, res) => {
    const { user_id } = req.body;
    db.query('DELETE FROM foods WHERE seller_id = ?', [user_id], (err) => {
        db.query('DELETE FROM users WHERE id = ?', [user_id], (err2) => {
            if (err2) return res.status(500).json({error: err2.message});
            res.json({message: "User and all their stock deleted successfully."});
        });
    });
});

app.post('/api/admin/delete-food', (req, res) => {
    const { food_id } = req.body;
    db.query('DELETE FROM foods WHERE id = ?', [food_id], (err) => {
        if (err) return res.status(500).json({error: err.message});
        res.json({message: "Item removed from database."});
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { 
    console.log(`Server running on port ${PORT}`); 
});
