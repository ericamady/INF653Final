
const statesData = require('../model/states.json');

// Create an array of just the state codes
const stateCodes = statesData.map(state => state.code);

const verifyStates = (req, res, next) => {
  const stateParam = req.params.state?.toUpperCase();

  if (!stateCodes.includes(stateParam)) {
    return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
  }

  req.code = stateParam;
  next(); 
};

module.exports = verifyStates;
