var http = require("http");
var bodyParser = require('body-parser');
var qs = require("querystring")
var path = require("path")
var Nedb = require('nedb')
var express = require("express")

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
    console.log()
    dane.findOne({nazwa: finish.nazwa}, function (err, doc) {


        doc.collection.splice(finish.i, 1)
        dane.update({_id: doc._id}, doc, {}, function (err, numReplaced) {

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
            res.end(JSON.stringify(doc));
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
            res.end(JSON.stringify(doc));
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
            // numReplaced = 1
            // The doc #3 has been replaced by { _id: 'id3', planet: 'Pluton' }
            // Note that the _id is kept unchanged, and the document has been replaced
            // (the 'system' and inhabited fields are not here anymore)
            res.end(JSON.stringify(doc));
        });


    });
}


app.get("/*", function (req, res) {
    res.status(404);
    res.send("brak strony")

})


app.listen(3000, function () {
    console.log("start serwera na porcie ")
})
