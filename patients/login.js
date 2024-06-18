const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const cors = require("cors");
const { parse } = require('querystring');

const app = express();
const port = 7050;

const mongoUri = "mongodb://localhost:27017";
const dbName = "loginApp";

let db, usersCollection, Collection;

MongoClient.connect(mongoUri)
    .then(client => {
        console.log("Connected to MongoDB");
        db = client.db(dbName);
        usersCollection = db.collection("users");
        Collection = db.collection("patients");

        app.use(cors());
        app.use(bodyParser.json());
        app.use(express.static("public"));
        app.post("/login", async (req, res) => {
            const { email, password,role } = req.body;

            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required"
                });
            }

            try {
                const user = await usersCollection.findOne({ username: email, password: password,role:role });
                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: "Invalid email or password"
                    });
                }
               else{
                res.status(200).json({ success: true, message: "Login successful" });
               }
            } catch (error) {
                console.error(error);
                res.status(500).json({ success: false, message: "Internal server error" });
            }
        });

       
        // Insert patient data
        app.post("/insert", async (req, res) => {
            let body = '';

            try {
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    const formData = parse(body);
                    let { patientID } = formData;
                    const existingPatient = await Collection.findOne({ patientID: patientID });
                    console.log(formData);
                    if (existingPatient) {
                        return res.status(409).json({ success: false, message: 'Patient ID already exists' });
                    }

                    const result = await Collection.insertOne(formData);
                    console.log(`${result.insertedCount} document inserted`);

                    res.status(201).json({ success: true, message: 'Data inserted successfully' });
                });
            } catch (error) {
                console.error('Error inserting data:', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // Update patient data
        app.post("/update", async (req, res) => {
            let body = '';

            try {
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    const formData = parse(body);
                    const patientID = formData.patientID;
                    delete formData.patientID; // Remove patientID from update data
                    const f=await Collection.find({patientID:patientID})
                    if(f){
                    const result = await Collection.updateOne({ patientID: patientID }, { $set: formData });
                    console.log(`${result.modifiedCount} document updated`);
                    res.status(201).json({ success: true, message: 'Data updated successfully' });
                    }
                    else{
                        res.status(201).json({ success: true, message: 'Data nnot found' });
                    }
                });

            } catch (error) {
                console.error('Error processing request:', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // Delete patient data
        app.post("/delete", async (req, res) => {
            let body = '';

            try {
                req.on('data', chunk => {
                    body += chunk.toString();
                });

                req.on('end', async () => {
                    const formData = parse(body);
                    const { patientID } = formData;
                    const result = await Collection.deleteOne({ patientID: patientID });

                    if (result.deletedCount === 1) {
                        res.status(200).json({ success: true, message: 'Data deleted successfully' });
                    } else {
                        res.status(404).json({ success: false, message: 'Patient not found' });
                    }
                });
            } catch (error) {
                console.error('Error deleting data:', error);
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // View patient data
        app.post("/view", async (req, res) => {
            try {
            const patients = await Collection.find({}).toArray();

            let tableHtml = `
            <html>
                <head>
                    <title>Patients Details</title>
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
                    <h2>Patients Details</h2>
                    <table>
                        <tr>
                            <th>Patient ID</th>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Address</th>
                            <th>Admitted Date</th>
                            <th>Discharge Date</th>
                            <th>Affected By</th>
                            <th>Reference Doctor</th>
                        </tr>
        `;

        patients.forEach(patient => {
            tableHtml += `
                <tr>
                    <td>${patient.patientID}</td>
                    <td>${patient.name}</td>
                    <td>${patient.age}</td>
                    <td>${patient.gender}</td>
                    <td>${patient.address}</td>
                    <td>${patient.admittedDate}</td>
                    <td>${patient.dischargeDate}</td>
                    <td>${patient.affectedBy}</td>
                    <td>${patient.referenceDoctor}</td>
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
        });

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    });
