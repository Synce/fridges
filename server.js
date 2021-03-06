var http = require("http");
var bodyParser = require('body-parser');
var qs = require("querystring")
var path = require("path")
var Nedb = require('nedb')
var express = require("express")
const PORT = process.env.PORT || 8080

var app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing application
app.use(express.static('static'))

const dane = new Nedb({
    filename: 'data/dane.db',
    autoload: true,

});

function checkORCreate(finish, res) {

    dane.findOne({nazwa: finish.nazwa}, function (err, doc) {
        if (doc) {
            res.end(JSON.stringify(doc));
        }
        else {
            obj = {
                nazwa: finish.nazwa,
                collection: [],
                przebieg: 0,

            }


            dane.insert(obj, function (err, newDoc) {
                res.end(JSON.stringify(newDoc));
            });
        }

    });
}


app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname + "/static/index.html"))
})


app.post("/odbierz", function (req, res) {

    var finish = req.body
    if (finish.action == 0) {
        checkORCreate(finish, res)
        console.log('akcja 0')
    }
    if (finish.action == 1) {
        console.log('akcja 1')
        newMagneto(finish, res)
    }
    if (finish.action == 2) {
        console.log('akcja 2')
        updateContent(finish, res)
    }
    if (finish.action == 3) {
        deleteMagneto(finish, res)
        console.log('action 3')
    }
    if (finish.action == 4) {
        moveMultiMagneto(finish, res)
        console.log('action 4')
    }
})

function deleteMagneto(finish, res) {
    console.log(finish)
    dane.findOne({nazwa: finish.nazwa}, function (err, doc) {
        let obj = doc.collection[finish.i];
        let bufor = obj.zindex;
        obj.zindex = doc.collection.length - 1;
        doc.collection[finish.i] = obj;
        doc = updateZIndex(obj, bufor, doc)
        doc.collection.splice(finish.i, 1)
        dane.update({_id: doc._id}, doc, {}, function (err, numReplaced) {

            res.end(JSON.stringify({}));
        });

    })
}

function moveMultiMagneto(finish, res) {
    dane.findOne({nazwa: finish.nazwa}, function (err, doc) {

        for (let g = 0; g < finish.i.length; g++) {
            doc.collection[finish.i[g]].x = finish.x[g]
            doc.collection[finish.i[g]].y = finish.y[g]
        }


        dane.update({_id: doc._id}, doc, {}, function (err, numReplaced) {
            res.end(JSON.stringify({}));
        });

    })
}

function newMagneto(finish, res) {
    dane.findOne({nazwa: finish.nazwa}, function (err, doc) {

        doc.przebieg += 1;
        let obj = {
            content: 'NEW JOB',
            x: '20px',
            y: '100px',
            width: '200px',
            height: '200px',
            zindex: doc.collection.length,
        }

        doc.collection.push(obj)
        dane.update({_id: doc._id}, doc, {}, function (err, numReplaced) {
            res.end(JSON.stringify({}));
        });

    })
}


function updateZIndex(kloeck, bufor, doc) {

    for (let i = 0; i < doc.collection.length; i++) {
        if (+doc.collection[i].zindex >= +bufor && doc.collection[i] !== kloeck) {
            doc.collection[i].zindex--;
        }
    }

    return doc;
}

function updateContent(finish, res) {

    dane.findOne({nazwa: finish.nazwa}, function (err, doc) {

        let obj = doc.collection[finish.i];
        if (finish.content)
            obj.content = finish.content
        if (finish.x)
            obj.x = finish.x
        if (finish.y)
            obj.y = finish.y
        if (finish.width)
            obj.width = finish.width
        if (finish.height)
            obj.height = finish.height

        let bufor = obj.zindex;
        obj.zindex = doc.collection.length - 1;
        doc.collection[finish.i] = obj;
        doc = updateZIndex(obj, bufor, doc)
        dane.update({_id: doc._id}, doc, {}, function (err, numReplaced) {
            console.log('updated')

            res.end(JSON.stringify({}));
        });


    });
}


app.get("/*", function (req, res) {
    res.status(404);
    res.send("brak strony")

})


app.listen(PORT, function () {
    console.log("start serwera na porcie ")
})
