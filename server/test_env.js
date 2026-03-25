require('dotenv').config();
console.log('MONGO_URI is:', process.env.MONGO_URI ? 'Defined' : 'Undefined');
console.log('JWT_SECRET is:', process.env.JWT_SECRET ? 'Defined' : 'Undefined');
