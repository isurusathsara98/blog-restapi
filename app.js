const express=require("express");
const jwt=require("jsonwebtoken");
const bodyParser=require('body-parser');
const bcrypt=require("bcryptjs");
const app=express();
const multer=require('multer');
const alert=require('alert');
const path=require('path');
const mysql=require('mysql');
var cons = require('consolidate');
const dotenv = require("dotenv");
const cookieParser=require("cookie-parser");
const {requireAuth, requireAuth1} = require('./middleware/authmiddleware');
const fileupload=require('express-fileupload');
app.use(fileupload());
var profileImage;
dotenv.config({path : './.env'})

const storage = multer.diskStorage({
    destination:'./public/uploads',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
        console.log(file);
    }
});

const upload=multer({
    storage:storage
}).single('uploaded_image');

app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(upload); 
app.use(cookieParser());

app.engine('html',require('ejs').renderFile, cons.swig);
app.set('view engine', 'html');

app.use(express.static(__dirname + '/public'));

const PORT=3000;
const connection=mysql.createConnection({
    //  host:'mysql.metropolia.fi',
    //  user:'jekaters',
    //  password:'9800000',
    //  database:'jekaters'
       host:'localhost',
       user:'root',
       password:'17/Eng/099',
       database:'blogdata'
});
connection.connect(function(error){
    if(error){
        console.log(error);
    }
    else{
        console.log('connected');
    }
});
app.use('/auth',express.static(__dirname +'auth'));
app.get('/',function(req,res){
    connection.query('SELECT * FROM post ',async (error,results)=>{

        res.render('index',{posts:results});
       });
})
app.get('/login',function(req,res){
    res.render('login');
})
app.get('/register',function(req,res){
    res.render('register',{
        message:"damn"
    })
})
app.get('/post_edit',requireAuth, (req,res)=>{
    const id=req.query.id;
    const Title=req.query.Title;
    const Published=req.query.Published;
    const Sumary=req.query.Sumary;
    const updatedAt=req.query.updatedAt;
    const content=req.query.content;
    const image=req.query.image;
    const userID=req.query.userID;
    const category=req.query.category;
    const qs={id,Title,Published,Sumary,updatedAt,content,image,userID,category}
   res.render('post_edit',{qs: qs});
})
app.get('/home',requireAuth1, (req,res)=>{

    connection.query('SELECT * FROM folowers WHERE UserID=?',[res.locals.user.id],async (error,results)=>{
        if(error){
            console.log(error);
        }
        else{
           
        res.render('home',{like:results,message:false});
        }
    });
   
});
app.post('/reg', (req,res)=>{
   res.send(req.body);
});
app.post('/auth/register', (req,res)=>{
    const { fname, mname, lname, email, password, passwordconfirm, mobile, intro} = req.body;
    console.log(req.body);
    connection.query('SELECT email FROM user WHERE email=?',[email],async (error,results)=>{
        if(error){
            console.log(error);
        }
        var img_name=profileImage;

                        if(results.length>0){
                         return res.json({success:"That email already exists"});
                        }
                        else if(password !== passwordconfirm){
                          return res.json({success:"passwords doesn't match"});
                        }
                
                       let hashedPassword = await bcrypt.hash(password, 8);
                       console.log(hashedPassword);
                
                       connection.query('INSERT INTO user SET ?',{firstname: fname, middlename:mname, lastname: lname, email:email, mobile:mobile, password:hashedPassword, profileImage:img_name, Intro:intro},(error,results)=>{
                           if(error){
                               console.log(error);
                           }
                           else{
                           return res.json({success:"You have successfully registered. Please login to your account"});
                           }
                       })                   
    });
})

app.post('/auth/edit',requireAuth,function async(req,res){
    const { fname, mname, lname, email, mobile, intro , currentpassword} = req.body;
    id=res.locals.user.id;
    connection.query('SELECT * FROM user WHERE id = ?',[id], async (error, results)=>{
    if(!(await bcrypt.compare(currentpassword, results[0].password))){
        res.status(401).render('edit',{
            message: 'Current password entered is incorrect',
        })
    }
    else{
    if(fname){
        connection.query('UPDATE user SET firstname=? WHERE id=?',[fname, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
          
            }
        });
    }
    if(lname){
        console.log("req.body");
        connection.query('UPDATE user SET lastname=? WHERE id=?',[lname, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
           
            }
        });
    }
    if(mname){
        console.log("req.body");
        connection.query('UPDATE user SET middlename=? WHERE id=?',[mname, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
            
            }
        });
    }
    if(email || !(email==res.locals.user.email)){
        console.log("req.body");
        connection.query('UPDATE user SET email=? WHERE id=?',[email, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
            }
        });
    }
    if(mobile){
        console.log("req.body");
        connection.query('UPDATE user SET mobile=? WHERE id=?',[mobile, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
           
            }
        });
    }
    if(intro){
        console.log("req.body");
        connection.query('UPDATE user SET intro=? WHERE id=?',[intro, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
            else{
                console.log(results);
           
            }
        });
    }
    return res.json({success:"Edited"});
}
});
});

app.post('/imageupload',function async(req,res){
    var file = req.files.uploaded_image;
    console.log(file);
    if(file.mimetype == "image/jpeg" ||file.mimetype == "image/png"||file.mimetype == "image/gif" ){
                 profileImage ='uploads'+Date.now()+file.name;
                 console.log(profileImage);          
        file.mv('public/'+profileImage,async function(err){
            if (err)
            console.log(err);
        });
    }
});
app.post('/auth/login',function async(req,res){
    try{
        const {email, password, uploaded_image} = req.body;
        connection.query('SELECT * FROM user WHERE email = ?',[email], async (error, results)=>{
            if(results.length==0 || !(await bcrypt.compare(password, results[0].password))){
               return res.json({success:"Email or Password is incorrect"});
            }
            else{
                const id =results[0].id;
                const token = jwt.sign({id: id}, process.env.JWT_SECRET,{
                    expiresIn:process.env.JWT_EXPIRES_IN
                });
              
                const cookieOptions = {
                    expires: new Date(
                        Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 
                    ),
                    httpOnly: true
                }
                res.cookie('jwt',token, cookieOptions);
                res.json({success:"Sucessfully logged in"});
            
            }
        })
    }catch(error){
        console.log(error);
    }
})

app.post('/logout',function(req,res){
    res.cookie('jwt','',{maxAge:1});
   return res.json({success:"logout successfull"});
})
app.get('/edit', requireAuth ,(req,res)=>{
    res.render('edit',{message:"Leave any detail as it is if changes are not required"});
});
app.get('/profile', requireAuth, (req,res)=>{
    res.render('profile',{message:false});
});
app.post('/edit_post', requireAuth, (req,res)=>{
    const {id}=req.body;
    connection.query('SELECT * FROM post WHERE id=?',[id],async (error,results)=>{
        if(error){
            return res.json({success:"Error"});
        }
        else{
            return res.json({success:"ok",qs:results[0]});
        }
    });
});


app.get('/postview', requireAuth ,(req,res)=>{
    connection.query('SELECT * FROM post WHERE id=?',[req.query.post],async (error,results)=>{
        if(error){
            console.log(error);
        }
        else{
           
            connection.query('SELECT * FROM user WHERE id=?',[results[0].userID],async (error,results1)=>{
                if(error){
                    console.log(error);
                }
                else{
                    connection.query('SELECT * FROM post_comment WHERE postID=?',[req.query.post],async (error,results2)=>{
                        if(error){
                            console.log(error);
                        }
                        else{
                            connection.query('SELECT * FROM folowers WHERE postID=?',[req.query.post],async (error,result)=>{
                          
                                res.render('postview',{qs: results[0], author: results1[0],comment:results2,count:result, message:false});
                            });
                            
                        }
                    });
                }
            });
           
        }
    });
});

app.post('/auth/deletecomment', requireAuth, (req,res)=>{
    const {post,publish}=req.body;
    console.log(publish);
    connection.query('DELETE from post_comment WHERE id=?',[publish],async (error,results)=>{
        if(error){
            return res.json({success:"Error"});
        }
        else{
           return res.json({success:"Comment Deleted"});
           
        }
      });
})

app.post('/auth/comment', requireAuth, (req,res)=>{
    
    const {id, name, content} = req.body;
    if(content==" ")
    {
        return res.json({success:"Please enter a comment"});
    }
    else{
        connection.query('INSERT INTO post_comment SET ?',{content: content, title: name, userID: res.locals.user.id, postID: id},(error,results)=>{
            if(error){
                console.log(error);
            }
            else{
                return res.json({success:"ok"});
            }
        })
    }
});
app.post('/auth/like', requireAuth, (req,res)=>{
  const {id}=req.body;
    connection.query('INSERT INTO folowers SET ?',{userID: res.locals.user.id, postID: id},(error,results)=>{
        if(error){
            console.log(error);
            return res.json({success:"Error"});
        }
        else{
            return res.json({success:"You liked the post"});
        }
    })
});

app.post('/auth/unlike', requireAuth, (req,res)=>{
    const {id}=req.body;
    connection.query('DELETE from folowers WHERE postID=? AND UserID=?',[id, res.locals.user.id],async (error,results)=>{
        if(error){
            return res.json({success:"Error"});
        }
        else{
            return res.json({success:"You unliked the post"});
        }
    })
});
app.get('/search',requireAuth,(req,res)=>{
    const category=req.query.category;
    connection.query('SELECT * FROM post WHERE category=? AND userID!=?',[category , res.locals.user.id],async (error,results)=>{
        if(error){
            console.log(error);
        }
        else{
           connection.query('SELECT * FROM folowers WHERE UserID=?',[res.locals.user.id],async (error,results1)=>{
            if(error){
                console.log(error);
            }
            else{
            res.render('search',{like:results1,posts:results,message:false});
            }
        });
        }
    });
})
app.post('/search', requireAuth, (req,res)=>{

    const {category}=req.body;
    if(category=="select"){
       return res.json({success:"Please select a category"});
    }
    else{
        return res.json({success:"search"});
    }
});

app.post('/auth/editpost', requireAuth, (req,res)=>{
    const {id, title, summary, content, category, uploaded_image} = req.body;
  
    if(title){
      connection.query('UPDATE post SET Title=? WHERE id=?',[title, id],async (error,results)=>{
          if(error){
              console.log(error);
          }
          else{
              
        
          }
      });
    }
    if(content && content!=" "){
        connection.query('UPDATE post SET content=? WHERE id=?',[content, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
        });
      }
      if(summary && summary!=" "){
        connection.query('UPDATE post SET Sumary=? WHERE id=?',[summary, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
        });
      }
      if(category){
        connection.query('UPDATE post SET category=? WHERE id=?',[category, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
        });
      }
      if(uploaded_image){
        var img_name=profileImage;
        connection.query('UPDATE post SET image=? WHERE id=?',[img_name, id],async (error,results)=>{
            if(error){
                console.log(error);
            }
        });
    }
      let date_ob = new Date();
connection.query('UPDATE post SET updatedAt=? WHERE id=?',[date_ob, id],async (error,results)=>{
  if(error){
      console.log(error);
  }
});
return res.json({success:"Succesfully edited"});

});

app.post('/auth/upload', requireAuth, (req,res)=>{
    const { title, content, summary, category} = req.body;
    if(category =="select")
    {
       return res.json({success:"Please select a category"});
    }
    else{
   
       var img_name=profileImage;
       connection.query('INSERT INTO post SET ?',{Title: title,Sumary: summary, content: content, image:img_name, userID: res.locals.user.id, category: category},(error,results)=>{
           if(error){
               console.log(error);
           }
           else{
            return res.json({success:"Posted"});
           }
       }); 
    
    
    }
});

app.post('/auth/delete', requireAuth, (req,res)=>{
    const {id} = req.body;
    connection.query('DELETE from post WHERE id=?',[id],async (error,results)=>{
        if(error){
            return res.json({success:"Some problem occured. Please try again"});
        }
        else{
            return res.json({success:"deleted"});
        }
      });
});


app.get('*',function(req,res){
    res.send('404 page not found');
})
app.listen(PORT,function(){
    console.log(`Server is listening to ${PORT}`);
})
