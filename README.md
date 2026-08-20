# Expenses Tracker

This is a your personal expense tracker application.

# Tech Stack Used:

    1. HTML
    2. CSS
    3. JavaScript
    4. MySQL

# Features:

    1. Add Expenses using Category
    2. Update Expenses
    3. Delete Expenses
    4. Adding the budget limit
    5. Category Breakdown and Insights
    6. Expense filter by Month and All time

# Requirements:

    1. Node.js 18 or newer
    2. MySQL 8 or newer

# How to Run:

1.  Import the database script. It creates the `expense-tracker` database,
    the tables and some sample data.

         mysql -u root -p < server/schema.sql

    (Or import `server/schema.sql` through the phpMyAdmin Import tab.)

2.  Create a file `server/.env` with your own MySQL details:

        MYSQL_USER=root
        MYSQL_HOST=localhost
        MYSQL_DATABASE=expense-tracker
        MYSQL_PASSWORD=mysql
        MYSQL_PORT=3306
        JWT_SECRET=9cce84436918c818c66c86e67f5bcb0ad3addf6f417f11e7c8678fdddc1033613d8e0366853873fae50c170c539e2d16

3.  Install the packages and start the server:

         cd server
         npm install
         npm start

    The terminal should print "Database connection established" and
    "Server is running on port 3000". Keep it running.

4.  Open `client/index.html` in the browser (double click it, or use the
    VS Code Live Server extension).

5.  Sign up for an account, log in, set a monthly budget, and start adding
    expenses.
    Email: saujan@gmail.com
    Password: saujan123
