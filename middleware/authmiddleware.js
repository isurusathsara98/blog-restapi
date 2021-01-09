const jwt=require("jsonwebtoken"); //validates the user using the json web token
const mysql = require("mysql");
const db= mysql.createConnection({
    // host:'mysql.metropolia.fi',
    // user:'jekaters',
    // password:'9800000',
    // database:'jekaters'
    host:'localhost',
       user:'root',
       password:'17/Eng/099',
       database:'blogdata'

})
const requireAuth = (req,res,next)=>{
    const token = req.cookies.jwt; //retrive the token from the cookie

    if(token){
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken)=>{  //verify whether the token is the same
            if(err){
                console.log(err.message);
                res.redirect('login',{
                    message: 'Please login', //if the token is damaged or tampered redirect to login
                })
            }else{
                console.log(decodedToken);
                /**********/
                try{  //get the user details from database
                    db.query('SELECT * FROM user WHERE id = ?',[decodedToken.id], async (error, results)=>{
                        if(!results){
                            res.status(401).render('login',{
                                message: 'User not found',
                            })
                        }
                        else{                         
                           res.locals.user =results[0];//save the details in locals.user variable
                           db.query('SELECT * FROM post WHERE userID = ?',[decodedToken.id], async (error, results1)=>{
                            if(!results1){
                                   console.log(error);
                            }else{
                                res.locals.posts=results1; //save the details in locals.posts variable
                                
                                next();
                            }
                        })
                          
                        }
                    });
                }catch(error){
                    console.log(error);
                }
              
            }
        })

    }
    else{
        res.render('login',{
            message:"Please login", //if token mismatch or if token not found redirect to login
        })
    }
}
const requireAuth1 = (req,res,next)=>{ //similar to the previous requireauth function but retrives post data as well
    const token = req.cookies.jwt;

    if(token){
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken)=>{
            if(err){
                console.log(err.message);
                res.redirect('login',{
                    message: 'Please login',
                })
            }else{
                console.log(decodedToken);
                /**********/
                try{
                    db.query('SELECT * FROM user WHERE id= ?',[decodedToken.id], async (error, results)=>{
                        if(!results){
                            res.status(401).render('login',{
                                message: 'User not found',
                            })
                        }
                        else{                         
                           res.locals.user =results[0];
                           db.query('SELECT * FROM post WHERE userID != ?',[decodedToken.id], async (error, results1)=>{
                            if(!results1){
                                   console.log(error);
                            }else{
                                res.locals.posts=results1;
                                next();
                            }
                        })
                          
                        }
                    });
                }catch(error){
                    console.log(error);
                }
              
            }
        })

    }
    else{
        res.render('login',{
            message:"Please login",
        })
    }
}
module.exports={requireAuth , requireAuth1};