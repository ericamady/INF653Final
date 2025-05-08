const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const statesSchema = new Schema(
    {
        stateCode:{
            type: String,
            required: true,
            unique: true,
            uppercase:true,
            match: /^[A-Z]{2}$/,
        },
      
      
        
        funfacts:{
            type: [String]
        },
      
    }
);
module.exports = mongoose.models.States || mongoose.model('States', statesSchema);
//Teacher version module.exports = mongoose.model('Employee', employeeSchema);