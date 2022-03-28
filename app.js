const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
//mutler is a package that helps us upload the file
const multer = require('multer')
const methodOverride = require('method-override');
const fs = require('fs')

//connecting to the mongoDb Database
mongoose.connect("mongodb://localhost:27017/images", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useCreateIndex : true
})

//creating Schema(Structure of the database) for Database

let imageSchema = new mongoose.Schema({  
    imgUrl : String
})

//Creating Schema for the picture
let Picture = mongoose.model('Picture', imageSchema)

//Setting Images/documents  storage
let storage = multer.diskStorage({
    destination: './public/uploads/images',
    filename : (req, file, cb) => {
        cb(null, file.originalname)
    }
})

//setting up the upload
let upload = multer({
    storage: storage,
    //Filtering our files
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb)
    }
})

//function to handle image types alone 
function checkFileType(file, cb) {
    //defining the image extensions allowed
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());

    if(extname) {
        return cb(null, true)
    } else{
        cb('Error: Please Images only')
    }
} 


app.post('/uploadSingle', upload.single('singleImage'), (req, res, next) => {
    const file = req.file;

    if(!file) {
        return console.log('Please select an Image');
    } 

    //removing the public from the url so it can display on the browser
    let url = file.path.replace('public', '');

    Picture.findOne({imgUrl : url})
        .then( img => {
            if(img){
                console.log('Duplicate Image. Try again');
                return res.redirect('/upload')
            }

            Picture.create({imgUrl : url})
                .then(img => {
                    console.log('Image saved to DB');
                    res.redirect('/');
                })
        })
        .catch(err => {
           return console.log('Error' + err)
        })

    //checking so that there will be no duplicate file with the same name

})


app.post('/uploadMultiple', upload.array('multipleImages') ,(req, res, next) => {
    
    const files = req.files;
    // To check if the files exists
    if (!files) {
        return console.log('Please Select Multiple Images Only');
    }

    //Saving the data for each file 
    files.forEach(file => {
        let url = file.path.replace('public', '');
        //looping and checking if the image already exists in the database
        Picture.findOne({imgUrl : url})
            .then(async img => {
                if (img) {
                    return console.log('Duplicate Image')
                }
                //saving the image in the databse
              await Picture.create({imgUrl : url})
            }).catch(err => {
                        return console.log('Error: ' + err);
                    })
    });

            res.redirect('/');


})

//basic setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static('public'));


//Middleware for method-override
app.use(methodOverride('_method'))

//Middleware


//Routes
app.get('/upload', (req, res) => {
    res.render('upload');
})

app.get('/', (req, res) => {
    //displaying the image in the database
    Picture.find({})
        .then(images => {
            res.render('index', {images:images}) //parsing the images to the template
        })

    
})

app.delete('/delete/:id', (req, res) => {
    //create a search query 
    let searchQuery = { _id: req.params.id}

    //fiding the Picture with the searchQuery Id
    Picture.findOne(searchQuery)
        .then(img => {
            //unlink helps us to delete the file
            fs.unlink(__dirname+'/public/'+img.imgUrl, (err) => {
                 if(err) return console.log(err);
                 Picture.deleteOne(searchQuery)
                    .then(img => {
                        res.redirect('/');
                    })
                    
            }) 
        }).catch(err => {
            console.log(err)
        })
})




app.listen(3000, () => {
    console.log('Server Started On Port 3000')
})