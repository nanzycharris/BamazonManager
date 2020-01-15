// The app requires 'mysql' and 'inquirer' packages for data input and storage
var mysql = require("mysql");
var inquirer = require("inquirer");
var departments;

// Create your connection to your Bamazon MySQL database
var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: " ",
    database: "bamazonDB"
});

// Connect to the server and call the function which uses the 'products' database 
connection.connect(function (err) {
    if (err) throw err;
    // Display the Manager's Options 
    showManagerMenu();
});

// Get product table from our bamazonDB
function showManagerMenu() {
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        // Call the function that displays the manager's options and passes in the products data
        showManagerOptions(res);
    });
}

// Display the menu of actions available to managers 
function showManagerOptions(products) {
    inquirer.prompt({
        type: "list",
        name: "choice",
        choices: ["1) View Books for Sale", "2) View Low Inventory", "3) Add to Inventory", "4) Add a New Book", "5) Quit"],
        message: "Please select an action from the menu by typing its number"
    }).then(function (val) {
        switch (val.choice) {
            case "1) View Books for Sale":
                console.table(products);
                showManagerMenu();
                break;
            case "2) View Low Inventory":
                showLowInventory();
                break;
            case "3) Add to Inventory":
                increaseInventory(products);
                break;
            case "4) Add a New Book":
                addANewProduct(products);
                break;
            default:
                console.log("\nThank you for using our Manager's app. Have a great day!\n");
                process.exit(0);
        }
    });
}

// Make a query from the DB to display the current low inventory products
function showLowInventory() {
    // Selects all of the products that have a quantity of 5 or less
    connection.query("SELECT * FROM products WHERE stock_quantity <= 5", function (err, res) {
        if (err) throw err;
        // Draw the table in the terminal using the response, call the manager menu function again
        console.table(res);
        showManagerMenu();
    });
}

// Function to allow the manager to increase the inventory of an item
function increaseInventory(inventory) {
    console.table(inventory);
    inquirer.prompt([
        {
            type: "input",
            name: "choice",
            message: "Type the ID of the book of which you want to add more copies",
            validate: function (val) {
                return !isNaN(val);
            }
        }
    ]).then(function (val) {
        var choiceId = parseInt(val.choice);
        var product = checkInventory(choiceId, inventory);
        // If item is part of the inventory proceed
        if (product) {
            // call function 'askForQuantity'
            askForQuantity(product);
        } else {
            // If item number doesn't exist, let the manager know and display Manager Menu again
            console.log("\nThat item ID does not exist in our book store.");
            showManagerMenu();
        }
    });
}

// Function to ask the manager the quantity in which the selected item inventory should be increased 
function askForQuantity(product) {
    inquirer.prompt([
        {
            type: "input",
            name: "quantity",
            message: "How many copies would you like to add?",
            validate: function (val) {
                return val > 0;
            }
        }
    ]).then(function (val) {
        var quantity = parseInt(val.quantity);
        addQuantity(product, quantity);
    });
}

// Function to increase the quantity in stock
function addQuantity(product, quantity) {
    connection.query(
        "UPDATE products SET stock_quantity = ? WHERE item_id = ?",
        [product.stock_quantity + quantity, product.item_id],
        function (err, res) {
            // Let the user know they have successfully increased the amount of copies in the inventory
            console.log("\nYou have successfully added " + quantity + " copies of " + product.book_title + "!\n");
            showProducts();
            console.log("\nThis is the updated inventory:\n")
            showManagerMenu();
        }
    );
}

function checkInventory(choiceId, inventory) {
    for (var i = 0; i < inventory.length; i++) {
        if (inventory[i].item_id === choiceId) {
            // If a matching product is found, return the product
            return inventory[i];
        }
    }
    // Otherwise return null
    return null;
}


function showProducts() {
    // Select * (ALL) items from table 'products'
    connection.query("SELECT * FROM products", function (err, res) {
        if (err) throw err;
        // Display table on terminal
        console.table(res);
    });
}

// Gets all departments, then obtain new book info, and insert the new book title into our bookstore database
function addANewProduct() {
    // console.log("inside addANewProduct")
    getProductInfo(departments).then(insertNewProduct);
};

// Prompts manager for new product info, then adds new item
function getProductInfo(departments) {
    return inquirer.prompt([
        {
            type: "input",
            name: "book_title",
            message: "What is the title of the book you would like to add?"
        },
        {
            type: "input",
            name: "book_author",
            message: "What is the name of this book's author?"
        },
        {
            type: "list",
            name: "department_name",
            choices: [
                "Autobiography",
                "Biography",
                "Fiction",
                "Non Fiction",
                "Children's Fiction",
                "Spanish Literature",
                "Hobbies"
            ],
            message: "To which department does this book belong?"
        },
        {
            type: "input",
            name: "price",
            message: "What it this book's price?",
            validate: function (val) {
                return val > 0;
            }
        },
        {
            type: "input",
            name: "stock_quantity",
            message: "What is the amount of copies available for this title?",
            validate: function (val) {
                return !isNaN(val);
            }
        }
    ]);
}

// Add new book title to our database
function insertNewProduct(val) {
    connection.query(
        "INSERT INTO products (book_title, book_author, department_name, price, stock_quantity) VALUES (?, ?, ?, ?, ?)",
        [val.book_title, val.book_author, val.department_name, val.price, val.stock_quantity],
        function (err, res) {
            if (err) throw err;
            console.log(val.book_title + " has been added to our bookstore!\n");
            // When done, re run loadManagerMenu, effectively restarting our app
            showManagerMenu();
        }
    );
}
