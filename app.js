const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

// Import AWS SDK v3 packages
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { ScanCommand, PutCommand, DeleteCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const accessKeyId=process.env.AWS_ACCESS_KEY_ID;
// const secretAccessKey=process.env.AWS_SECRET_ACCESS_KEY;

// Configure AWS SDK v3 for DynamoDB
const dynamoClient = new DynamoDBClient({
    region: "us-east-1",
});

const tableName = "Products";

// Welcome Page Route
app.get('/', (req, res) => {
    res.render('index');
});

// Products Page - Display All Products
app.get('/products', async (req, res) => {
    try {
        const params = {
            TableName: tableName,
        };
        const command = new ScanCommand(params);
        const data = await dynamoClient.send(command);
        res.render('products', { products: data.Items });
    } catch (err) {
        console.error("Unable to scan table:", err);
        res.status(500).send("Error fetching products");
    }
});

// Route to render add-product page
app.get('/add-product', (req, res) => {
    res.render('add-product'); // This will render the add-product.ejs view
});

// Add a New Product
app.post('/products/add', async (req, res) => {
    const { name, quantity, price } = req.body;
    const id = Date.now();  // Numeric ID based on current timestamp

    const params = {
        TableName: tableName,
        Item: {
            id: id,
            Name: name,
            Quantity: parseInt(quantity),
            Price: parseFloat(price),
        },
    };

    try {
        const command = new PutCommand(params);
        await dynamoClient.send(command);
        res.redirect('/products');
    } catch (err) {
        console.error("Unable to add item:", err);
        res.status(500).send("Error adding product");
    }
});

// Delete a Product
app.post('/products/delete', async (req, res) => {
    const { id } = req.body;
    const params = {
        TableName: tableName,
        Key: { id: parseInt(id) },
    };

    try {
        const command = new DeleteCommand(params);
        await dynamoClient.send(command);
        res.redirect('/products');
    } catch (err) {
        console.error("Unable to delete item:", err);
        res.status(500).send("Error deleting product");
    }
});

// Route to render the update form for a specific product
app.get('/products/update/:id', async (req, res) => {
    const { id } = req.params;
    const params = {
        TableName: tableName,
        Key: { id: parseInt(id) },
    };

    try {
        const command = new GetCommand(params);
        const data = await dynamoClient.send(command);
        res.render('update-product', { product: data.Item });
    } catch (err) {
        console.error("Unable to fetch product:", err);
        res.status(500).send("Error fetching product details");
    }
});

// Update a Product
app.post('/products/update', async (req, res) => {
    const { id, name, quantity, price } = req.body;

    const params = {
        TableName: tableName,
        Key: { id: parseInt(id) },
        UpdateExpression: "set Quantity = :q, Price = :p, #n = :n",
        ExpressionAttributeNames: {
            "#n": "Name",
        },
        ExpressionAttributeValues: {
            ":q": parseInt(quantity),
            ":p": parseFloat(price),
            ":n": name,
        },
    };

    try {
        const command = new UpdateCommand(params);
        await dynamoClient.send(command);
        res.redirect('/products');  // Always redirect back to the products page
    } catch (err) {
        console.error("Unable to update item:", err);
        res.status(500).send("Error updating product");
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
