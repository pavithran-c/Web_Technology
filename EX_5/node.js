var http = require('http');
var querystring = require('querystring');
var url = require('url');
function onrequest(req, res) {
function generateOutput(name, gender, address, phone, state) {
    var output= `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Form Submission Output</title>
        <link rel="stylesheet" href="../../boot/css/bootstrap.min.css">
        <style>
            .container {
                margin-top: 50px;
            }
            .table {
                width: 100%;
                max-width: 600px; 
            }
            .table td {
                border: 1px solid #dee2e6;
                padding: 8px;
            }
            .table tr:nth-child(even) {
                background-color: #f2f2f2;
            }
            .table tr:hover {
                background-color: #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="container mt-5">
            <center>
            <h2>Form Submission Output</h2>
            <table class="table">
                    <tr><td>Name:</td><td>${name}</td></tr>
                    <tr><td>Gender:</td><td>${gender}</td></tr>
                    <tr><td>Address:</td><td>${address}</td></tr>
                    <tr><td>Phone Number:</td><td>${phone}</td></tr>
                    <tr><td>State:</td><td>${state}</td></tr>
            </table>
            </center>
        </div>
    </body>
    </html>    
    `;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(output);
}
    var name, gender, address, phone, state, body = '', qs,output;
    if (req.method === 'GET') {
        var query = url.parse(req.url).query;
        var queryParams = querystring.parse(query);
        name = queryParams["name"];
        gender = queryParams["gender"];
        address = queryParams["address"];
        phone = queryParams["phone"];
        state = queryParams["state"];
        generateOutput(name, gender, address, phone, state);
    } else if (req.method === 'POST') {
        req.on('data', function (chunk) {
            body += chunk;
        });
        req.on('end', function () {
            qs = querystring.parse(body);
            name = qs['name'];
            gender = qs['gender'];
            address = qs['address'];
            phone = qs['phone'];
            state = qs['state'];
            generateOutput(name, gender, address, phone, state);
        });
    }
}
http.createServer(onrequest).listen(8080);
console.log("Server running");