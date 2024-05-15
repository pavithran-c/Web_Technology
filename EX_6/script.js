const http = require('http');
const url=require('url');
const { parse } = require('querystring');
const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017'; 
const client = new MongoClient(uri);
async function connectDB() {
    try {
        await client.connect();
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
connectDB();
async function onRequest(req, res) {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const formData = parse(body);
            const { rollNo, name, gender, address, phone, state } = formData;
            
            if (req.url === '/insert') {
                await insertData(req, res, rollNo, name, gender, address, phone, state);
            } else if (req.url === '/delete') {
                await deleteData(req, res, rollNo);
            } else if (req.url === '/update') {
                await updateData(req, res, rollNo, name, gender, address, phone, state);
            }
            else if(req.url==='/view'){
                await displayTable(res);
            }
        });
    } else {
        var query = url.parse(req.url).query;
        var queryParams = parse(query);
        const rollNo=queryParams["rollNo"];
        const name = queryParams["name"];
        const gender = queryParams["gender"];
        const address = queryParams["address"];
        const phone = queryParams["phone"];
        const state = queryParams["state"];
        if (req.url === '/insert') {
            await insertData(req, res, rollNo, name, gender, address, phone, state);
        } else if (req.url === '/delete') {
            await deleteData(req, res, rollNo);
        } else if (req.url === '/update') {
            await updateData(req, res, rollNo, name, gender, address, phone, state);
        }
        else if(req.url==='/view'){
            await displayTable(res);
        }
    }
}
async function insertData(req, res, rollNo, name, gender, address, phone, state) {
    try {
        const database = client.db('mydatabase');
        const collection = database.collection('students');
        const existingStudent = await collection.findOne({ rollNo: rollNo });
        if (existingStudent) {
            res.writeHead(409, { 'Content-Type': 'text/plain' }); 
            res.end('Roll number already exists');
            return;
        }
        const result = await collection.insertOne({ rollNo:rollNo, name:name, gender:gender, address:address, phone:phone, state:state });
        console.log(`${result.insertedCount} document inserted`);
        await displayTable(res);
    } catch (error) {
        console.error('Error inserting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}
async function deleteData(req, res, rollNo) {
    try {
        const database = client.db('mydatabase'); 
        const collection = database.collection('students');
        const result = await collection.deleteOne({rollNo:rollNo});
        console.log(`${result.deletedCount} document deleted`);
        if (result.deletedCount === 1) {
            await displayTable(res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Document not found');
        }
    } catch (error) {
        console.error('Error deleting data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}
async function updateData(req, res, rollNo, name, gender, address, phone, state) {
    try {
        const database = client.db('mydatabase');
        const collection = database.collection('students');
        const updateDoc = { $set: {name:name,gender:gender,address:address,phone:phone,state:state}};
        if (Object.keys(updateDoc.$set).length === 0) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('No valid fields to update');
            return;
        }
        const result = await collection.updateOne({rollNo:rollNo}, updateDoc);
        console.log(`${result.modifiedCount} document updated`);

        if (result.modifiedCount === 1) {
            await displayTable(res);
        } else if (result.matchedCount === 1 && result.modifiedCount === 0) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Data is already up-to-date');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Roll number not found');
        }
    } catch (error) {
        console.error('Error updating data:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}
async function displayTable(res) {
    try {
        const database = client.db('mydatabase'); 
        const collection = database.collection('students');

        const students = await collection.find({}).toArray();

        let tableHtml = `
            <html>
                <head>
                    <title>Student Details</title>
                    <style>
                        table {
                            font-family: Arial, sans-serif;
                            border-collapse: collapse;
                            width: 100%;
                        }
                        th, td {
                            border: 1px solid #dddddd;
                            text-align: left;
                            padding: 8px;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    <h2>Student Details</h2>
                    <table>
                        <tr>
                            <th>Roll No</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Address</th>
                            <th>Phone</th>
                            <th>State</th>
                        </tr>
        `;

        students.forEach(student => {
            tableHtml += `
                <tr>
                    <td>${student.rollNo}</td>
                    <td>${student.name}</td>
                    <td>${student.gender}</td>
                    <td>${student.address}</td>
                    <td>${student.phone}</td>
                    <td>${student.state}</td>
                </tr>
            `;
        });

        tableHtml += `
                    </table>
                </body>
            </html>
        `;

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(tableHtml);
    } catch (error) {
        console.error('Error displaying table:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}
http.createServer(onRequest).listen(7050);
console.log('Server is running on port 7050...');
