const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const Clarifai = require('clarifai');

const appKey = new Clarifai.App({
   apiKey: 'becbe65f170c4986947946a7f165ec86'
});

const handleApiCall = (req,res)=>{
	 appKey.models
 		.predict(Clarifai.FACE_DETECT_MODEL, req.body.input)
 		.then (data =>{
 			res.json(data);
 		})	
 		.catch(err=>res.status(400).json('unable to work with API'))
}

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'hello123',
    database : 'smart-brain'
  }
});

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/',(req,res)=>{
	res.send(database.users); // dev env
	//res.send('it is working!');//deployment env
})

app.post('/signin',(req,res)=>{
	const {email, password} = req.body;
	if(!email||!password){
		return res.status(400).json('Incorrect form submission');
	}
	db.select('email','hash').from('login')
		.where('email','=', email)
		.then(data=>{
			const isValid = bcrypt.compareSync(password, data[0].hash);
			if (isValid){
				return db.select('*').from('users')
					.where('email','=',req.body.email)
					.then(user=>{
						res.json(user[0])
					})
				.catch(err=>res.status(400).json('unable to get user'))
			}else{
				res.status(400).json('wrong credentials')	
			}
		})
	.catch(err=>res.status(400).json('wrong credentials'))
})

app.post('/register',(req,res)=>{
	const {email, name, password} = req.body;
	if(!email||!name||!password){
		return res.status(400).json('Incorrect form submission');
	}
	const hash = bcrypt.hashSync(password);
	  db.transaction(trx =>	{
	  	trx.insert({
	  		hash:hash,
	  		email: email
	  	})
	  	.into('login')
	  	.returning('email')
	  	.then(loginEmail=>{
	  		return trx('users')
			.returning('*')
			.insert({
				email:loginEmail[0],
				name:name,
				joined: new Date()
			})
			.then(user =>{
				res.json(user[0]);	
		  	})
	    })
	    .then(trx.commit)
	    .catch(trx.rollback)
	  })
	  .catch(err=>res.status(404).json('unable to register'))
})

app.get('/profile/:id',(req,res)=>{
	const {id} = req.params;
	//let found = false;
	db.select('*').from('users').where({id})
		.then(user=>{
			if (user.length){
				res.json(user[0]);	
			}else{
				res.status(400).json('not found');	
			}
		})
		.catch(err=>res.status(400).json('error getting user'))
})

app.put('/image',(req,res)=>{
	const {id} = req.body;
	db('users').where('id','=',id)
	.increment('entries',1)
	.returning('entries')
	.then(entries =>{
		res.json(entries[0]);
	})
	.catch(err=>res.status(400).json('unable to get entries'))
})

app.post('/imageurl',(req,res)=>{image.handleApiCall(req,res)})

app.listen(3000,()=>{ //dev env
//app.listen(process.env.PORT || 3000,()=>{ //deployment env
	console.log(`app is running on port ${process.env.PORT}`);
})

