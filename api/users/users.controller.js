const User = require('./users.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const Twit = require('twit');

const getUser = (req,res) => {
    const owner = req.user.usuario.userName;
    // const { projected } = req.query;

    // if(projected){
    //     User.findOne({userName:owner})
    //         .populate('contactsId')
    //         .select({ contactsId : { $slice : -10}})
    //         .then(doc => {
    //             if(typeof doc !== 'null'){
    //                 user = {
    //                     userName: doc.userName,
    //                     email: doc.email
    //                 }
    //                 return res.status(200).json(user);
    //             }
    //             return res.status(404).send('This user not have contacts');
    //         })
    //         .catch(error => res.status(404).send('This user not have contacts'));
    // } else {
    User.findOne({userName:owner})
        .then(doc => {
            if(typeof doc !== 'null'){
                user = {
                    userName: doc.userName,
                    email: doc.email
                }

                return res.status(200).json(user);
            }
            return res.status(404).send('This user not exist');
        })
        .catch(error => res.status(404).send(error));
    //
       
}

const deleteUser = (req,res) => {
    const username = req.params.userName;

    User.findOneAndDelete({userName:username})
        .then(user => {

            userDelete = {
                userName: user.userName,
                email: user.email
            }
            return res.status(200).json(userDelete);
        })
        .catch(error => res.status(404).send(error));
}

const patchUser = (req,res) => {
    const userLogged = req.user.usuario.userName;
    const usuario = req.body; 
    const email = usuario.email || req.user.usuario.email;
    const avatar = usuario.avatar || req.user.usuario.avatar || '';

    if(typeof usuario.userName === 'undefined'){
        return res.status(400).send('The userName is empty');
    }

    User.findOneAndUpdate({userName:userLogged},{userName: usuario.userName, email:email, avatar:avatar})
        .then(doc => {
            console.log(doc);
            if(doc !== null){
                return res.status(202).json(doc);
            }

            return res.status(404).send('The user not exist');
        })
        .catch(error => {
            if(error === 'The userName just exist'){
                return res.status(400).send(error);
            } else if(error === 'The userName is required'){
                return res.status(404).send(error);
            } else {
                return res.status(404).send(error);
            }
        })
}

const changePassword = (req,res) => {
    const userLogged = req.user.usuario.userName;
    const password = bcrypt.hashSync(req.body.password,10);

    User.updateOne({userName:userLogged},{password: password})
        .then(doc => res.status(202).send('Your password change sucessfully'))
}

const postTweet = async (req,res) => {
    const {message, photo_url } = req.body;
    const id = req.query.id;

    try {
        const user = await User.findOne({_id:id});
        console.log(user);

        if(typeof user.tokenSecretTwitter === 'undefined' || typeof user.tokenTwitter === 'undefined'){
            return res.status(400).send('This user not have a twitter account linked')

        }

        const { tokenTwitter, tokenSecretTwitter} = user;
        const config = {
            consumer_key: process.env.API_KEY,
            consumer_secret:process.env.API_SECRET_KEY,
            access_token: tokenTwitter, 
            access_token_secret: tokenSecretTwitter,
            timeout_ms: 60 * 1000,  
            strictSSL:true
        }

        const T = new Twit(config);

        if(typeof photo_url !== 'undefined'){
            
            
                const b64content = fs.readFileSync('koala_crazy.jpeg', { encoding: 'base64' })
    
                // Cargamos el fichero de video/imagen
                T.post('media/upload', { media_data: b64content }, function (err, data, response) {
                    const mediaIdStr = data.media_id_string
                    const altText = "Koala wins"
                    const meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
                
                    T.post('media/metadata/create', meta_params, function (err, data, response) {
                        if (!err) {
                            // now we can reference the media and post a tweet (media will attach to the tweet)
                            const params = { status: message, media_ids: [mediaIdStr] }
                
                            T.post('statuses/update', params, function (err, data, response) {
                                if (err){
                                    console.log("oops, didn't tweet: ", err.message)
                                }
                                return res;
                            })
                        }
                    })
                    return response;
                })
                return res.status(200).send('Post tweet with image');
           
        }
       //post
        T.post('statuses/update', { status: message }, function(err, data, res) {
            if (err){
                console.log("oops, didn't tweet: ", err.message)
            }
            return res;
        });

        return res.status(200).send('Hola');

    } catch(err){

        return res.status(400).send(err)
    }
}

const getUserId = (req,res,next) => {
    console.log('IDDDDDDDD');
    console.log(req.query);

    // if(id === undefined){
    //     return res.status(400).send('The id is empty');
    // }

    fs.writeFileSync('../id.json',JSON.stringify({id:req.query.id}));
    const id = JSON.parse(fs.readFileSync('../id.json')).id;
    console.log('fs id')
    console.log(id);
    next()
}

const login = (req,res,next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (token == null) return res.sendStatus(401)

    jwt.verify(token, process.env.TOKEN_SECRET_KEY, (err, dataStored) => {
        if (err) return res.status(403).send('The User/Password is not correct');
        req.user = dataStored;
        next()
    })
}

const isYou = (req,res,next) => {
    const userLogged = req.user.usuario.userName;

    if(req.params.userName != userLogged){
        return res.status(400).send('You cannot modify/delete another user');
    } else {
        next();
    }
}

module.exports = {
    getUser,
    deleteUser,
    patchUser,
    changePassword,
    login,
    isYou,
    getUserId,
    postTweet
}