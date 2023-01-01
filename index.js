const express = require('express')
const mysql = require('promise-mysql');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const { check, validationResult } = require('express-validator');
const MongoClient = require('mongodb').MongoClient;

const port = 8000;
const app = express();

app.set('view engine', 'ejs')
//use of parse 
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());

var pool;
//connection to mysql
mysql.createPool({
    connectionLimit: 3,
    user: "joseph",
    host: "localhost",
    password: "password",
    database: 'proj2022'
}).then(p => {
    pool = p
}).catch(e => {
    console.log("pool error:" + e)
});







//Go home Page:
app.get('/', (req, res) => {
    res.render("home", { errors: undefined })
})

//The Employees List Page
app.get('/employees', (req, res) => {

    pool.query("select * from employee").then((d) => {
        res.render("employees", { employees: d })
    }).catch((error) => {

        res.send(error)
    })

});
//Edit the Employees page
app.get('/employees/edit/:eid', (req, res) => {

    pool.query("select * from employee e where e.eid = '" + req.params.eid + "'").then((d) => {
        res.render("editEmployee", { e: d[0], errors: undefined })
    }).catch((error) => {

        res.send(error)
    })

});
//Editing the Employees page requirements 
app.post('/employees/edit/:eid',
    [
        check("name").isLength({ min: 5 }).withMessage("Employee Name has to be 5 characters Long")
    ],
    [
        check("role").isIn(["Manager", "Employee"]).withMessage("Role can be Manager or Employee")
    ],
    [
        check("salary").isFloat({ gt: 0 }).withMessage("Salary must be > than 0")
    ],
    (req, res) => {
        const errors = validationResult(req)

        let data = {};
        data.eid = req.params.eid;
        data.ename = req.body.name;
        data.role = req.body.role;
        data.salary = req.body.salary;
        
        if (!errors.isEmpty()) {
            res.render("editEmployee", { e: data, errors: errors.errors })

        }
        else {
            pool.query(`UPDATE employee set ename = '${req.body.name}',role = '${req.body.role}',salary ='${req.body.salary}'WHERE eid ='${req.params.eid}'`).then((d) => {
                res.redirect("/employees")
            }).catch((error) => {
                res.send(error)
            })
        }



    }
);





//Departments page
app.get('/depts', (req, res) => {

    pool.query("SELECT dept.did,dept.dname,loc.county,dept.budget FROM dept JOIN location AS loc ON loc.lid = dept.lid").then((d) => {
        res.render("departments", { departments: d })
    }).catch((error) => {
        res.send(error)
    })



});

//deleting from departments page
app.get('/depts/delete/:did'), (req, res) => {
    pool.query(`DELETE FROM dept WHERE did = '${req, params.did}';`).then((d) => {
        res.redirect("/departments")
    }).catch(() => {
        res.status(400).send(
            `<div></div>
            <h1>Error Message<\h1>
            <h2>${req.params.did} has employees and cannot be delivered</h2>
            <a href="/departments">Home</a>
            </div>`)
    })

}
//start of MongoDB  code for connection and adding employees
const url = 'mongodb+srv://joseph:asare@cluster0.jck3wxg.mongodb.net/test';
const dbName = 'employeesDB'
const colName = 'employees'

var employeesDB
var employees

MongoClient.connect(url, { useNewUrlParser: true })
    .then((client) => {
        employeesDB = client.db(dbName)
        employees = employeesDB.collection(colName)
    }).catch((error) => {
        console.log(error)
    });


function getEmployees() {
    return new Promise((resolve, reject) => {
        var cursor = employees.find()

        cursor.toArray()
            .then((documents) => {

                resolve(documents)
            }).catch((error) => {
                reject(error)
            })

    })
}





app.get('/employeesMongoDB', (req, res) => {

    getEmployees()
        .then((documents) => {
            res.render('employeesMongoDB', { employees: documents })
        }).catch((error) => {
            res.send(error)
        })
});


function addEmployee(_id, phone, email) {
    return new Promise((resolve, reject) => {
        employees.insertOne({ "_id": _id, "phone": phone, "email": email })
            .then((result) => {
                resolve(result)
            }).catch((error) => {
                reject(error)
            })
    })
}

app.get('/addEmployee', (req, res) => {
    res.render("addEmployee")
})
app.post('/addEmployee', (req, res) => {
    addEmployee(req.body._id, req.body.phone, req.body.email)
        .then((result) => {
            res.redirect("/employeesMongoDB")
        }).catch((error) => {
            res.send(error)
        })
})



app.listen(8000, () => {
    console.log(`Example app listening on port `)
});

