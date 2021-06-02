const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const fs = require('fs');

const User = require('../users/users.model');

passport.serializeUser((user, done) => {
    console.log('hola1')
    done(null, user.id);
});
  
passport.deserializeUser(async (id, done) => {
    console.log('hola2')
    const user = await User.findById(id);
    done(null, user);
});

passport.use("sign-up-twitter",new TwitterStrategy(
    {
      consumerKey: process.env.API_KEY,
      consumerSecret: process.env.API_SECRET_KEY,
      callbackURL: `http://localhost:3000/auth/twitter/login`
    },
    async (token, tokenSecret, profile, done) => {
      console.log(profile)
      const id = JSON.parse(fs.readFileSync('../id.json')).id;
      console.log(id);
      const user = await User.findOneAndUpdate({_id:id},{tokenTwitter:token,tokenSecretTwitter:tokenSecret});// si existe en la base de datos
      console.log(user);
         
   
      if (user) {
        console.log('POR AKI');
        done(null, user)
      } else {
        console.log('POR AKI 404');
        done(null, false)
      }
      
    }
  )
);
  