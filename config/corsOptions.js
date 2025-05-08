

/*
const whitelist = [
    'https://www.google.com', 
    'http://127.0.0.1:5500', 
    'http://localhost:3500'
];
*/
const corsOptions = {
    origin: '*',
        
    optionsSuccessStatus: 200
};

module.exports = corsOptions;