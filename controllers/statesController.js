const State = require('../model/States');
const statesData = require('../model/states.json');

//show funfact
const getFunfact = async (req, res) => {
  try {
    const stateCode = req.code; 
const stateJson = statesData.find(state => state.code === stateCode);
const stateName = stateJson ? stateJson.name : stateCode;
    // Search MongoDB for a matching state
    const stateData = await State.findOne({ stateCode });

    if (!stateData || !Array.isArray(stateData.funfacts) || stateData.funfacts.length === 0) {
      return res.status(404).json({ message: `No Fun Facts found for ${stateName}` });
    }

    // Return a random fun fact
    const randomIndex = Math.floor(Math.random() * stateData.funfacts.length);
    const funfact = stateData.funfacts[randomIndex];

    return res.json({ funfact });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


//find all states

const getAllStates = async (req, res) => {
  try {
    const { contig } = req.query;

    if (contig && contig !== 'true' && contig !== 'false') {
      return res.status(400).json({ message: 'Invalid value for contig. Use true or false.' });
    }

    // Filter states based on contig param
    let filteredStates = [...statesData];
    if (contig === 'true') {
      filteredStates = filteredStates.filter(state => state.code !== 'AK' && state.code !== 'HI');
    } else if (contig === 'false') {
      filteredStates = filteredStates.filter(state => state.code === 'AK' || state.code === 'HI');
    }

    // Pull funfacts from MongoDB
    const mongoStates = await State.find().lean();

    // Build a map 
    const funFactsMap = Object.fromEntries(
      mongoStates
        .filter(state => Array.isArray(state.funfacts) && state.funfacts.length > 0)
        .map(state => [state.stateCode, state.funfacts])
    );

    // Merge funfacts into filtered states
    const result = filteredStates.map(state => ({
      ...state,
      ...(funFactsMap[state.code] ? { funfacts: funFactsMap[state.code] } : {})
    }));

    res.json(result);
  } catch (err) {
    console.error('Error in getAllStates:', err);
    res.status(500).json({ message: 'Server error' });
  }
};




const addNewFact = async (req, res) => {
  let { funfact, funfacts } = req.body;

  //check if array exists
   if (!funfacts || funfacts.length === 0) {
    return res.status(400).json({ message: 'State fun facts value required' });
  }
  
  if (funfact && typeof funfact === 'string') {
    funfacts = [funfact];
  }

  if (!Array.isArray(funfacts)) {
  return res.status(400).json({ message: 'State fun facts value must be an array' });
}

if (funfacts.length === 0 || !funfacts.every(f => typeof f === 'string')) {
  return res.status(400).json({ message: 'State fun facts value required' });
}

  try {
    const stateCode = req.code; 
    const stateData = await State.findOne({ stateCode });

    if (!stateData) {
      return res.status(404).json({ message: `No state found for code ${stateCode}` });
    }

    if (!Array.isArray(stateData.funfacts)) {
      stateData.funfacts = [];
    }

    stateData.funfacts.push(...funfacts);
    const result = await stateData.save();

    res.status(201).json(result);
  } catch (err) {
    console.error('Error adding funfacts:', err);
    res.status(500).json({ message: 'Unable to add funfacts due to a server error.' });
  }
};



const updateFact = async (req, res) => {
  const { index, funfact } = req.body;

  const stateCode = req.code;

  // Validate index
  if (index === undefined || typeof index !== 'number') {
    return res.status(400).json({ message: 'State fun fact index value required' });
  }

  // Validate funfact
  if (!funfact || typeof funfact !== 'string') {
    return res.status(400).json({ message: 'State fun fact value required' });
  }

  try {
    const foundState = await State.findOne({ stateCode });

    if (!foundState || !Array.isArray(foundState.funfacts) || foundState.funfacts.length === 0) {
      const stateName = getStateNameFromCode(stateCode); // helper
      return res.status(404).json({ message: `No Fun Facts found for ${stateName}` });
    }

    const zeroBasedIndex = index - 1;

    if (zeroBasedIndex < 0 || zeroBasedIndex >= foundState.funfacts.length) {
      const stateName = getStateNameFromCode(stateCode); // helper
      return res.status(400).json({ message: `No Fun Fact found at that index for ${stateName}` });
    }

    // Update the fun fact
    foundState.funfacts[zeroBasedIndex] = funfact;
    const updatedState = await foundState.save();

    res.status(200).json(updatedState);
  } catch (err) {
    console.error('Error updating fun fact:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



const getStateNameFromCode = (code) => {
  const state = statesData.find(s => s.code === code);
  return state?.state || code;
};


const deleteFact = async (req, res) => {
  const { index } = req.body;
  
  const stateCode = req.code;
  const state = statesData.find(state => state.code === stateCode);
  const stateName = state ? state.state : stateCode;  // Using `state.state` for state name

  // Validate index: Ensure it's a positive integer
  if (!Number.isInteger(index) || index <= 0) {
    return res.status(400).json({ message: 'State fun fact index value required' });
  }

  try {
    const stateDoc = await State.findOne({ stateCode });

    // Check if funfacts exist for the state
    if (!stateDoc || !Array.isArray(stateDoc.funfacts) || stateDoc.funfacts.length === 0) {
      return res.status(404).json({ message: `No Fun Facts found for ${stateName}` });
    }

    // Adjust index by subtracting 1 to match 0-based array index
    const adjustedIndex = index - 1;

    // Check if the provided index is valid in the funfacts array
    if (adjustedIndex < 0 || adjustedIndex >= stateDoc.funfacts.length) {
      return res.status(400).json({ message: `No Fun Fact found at that index for ${stateName}` });
    }

    // Remove the funfact at the adjusted index
    stateDoc.funfacts.splice(adjustedIndex, 1);

    // Save the updated state document
    const result = await stateDoc.save();
    res.status(200).json(result);

  } catch (err) {
    console.error('Error deleting fun fact:', err);
    res.status(500).json({ message: 'Server error while deleting fun fact' });
  }
};




// show one state
const getState = async (req, res) => {
  try {
    const stateCode = req.code; 

    
    const stateJson = statesData.find(state => state.code === stateCode);

    
    if (!stateJson) {
      return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
    }

    // Get funfacts from MongoDB if available
    const stateMongo = await State.findOne({ stateCode });

    const mergedState = {
      ...stateJson,
      ...(Array.isArray(stateMongo?.funfacts) && stateMongo.funfacts.length > 0 && {
        funfacts: stateMongo.funfacts,
      }),
    };

    res.status(200).json(mergedState);
  } catch (err) {
    console.error('Error fetching state:', err);
    res.status(500).json({ message: 'Server error retrieving state' });
  }
};


const getParamDetail = async (req, res) => {
  const code = req.code; 
  const field = req.params?.field?.toLowerCase();

  if (!code || !field) {
    return res.status(400).json({ message: 'State code and field are required' });
  }
  
  if (field === 'funfact') {
    try {
      const stateDoc = await State.findOne({ stateCode: code }).lean();
      if (!stateDoc || !Array.isArray(stateDoc.funfacts) || stateDoc.funfacts.length === 0) {
        return res.status(404).json({ message: `No Fun Facts found for ${code}` });
      }

      // Pick a random fun fact
      const randomIndex = Math.floor(Math.random() * stateDoc.funfacts.length);
      return res.json({ funfact: stateDoc.funfacts[randomIndex] });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error retrieving fun fact' });
    }
  }

  
  const stateJson = statesData.find(state => state.code === code);
  if (!stateJson) {
    return res.status(404).json({ message: `No state found for code ${code}` });
  }

  if (!stateJson[field]) {
    return res.status(404).json({ message: `No such field '${field}' for state ${code}` });
  }
  let fieldValue = stateJson[field];
if (field === 'population' && typeof fieldValue === 'number') {
  fieldValue = fieldValue.toLocaleString();  // Adds commas like 10,123,456
}

  return res.json({ state: stateJson.state,  [field]: fieldValue });
};

// get the capital
const getCapital = async (req, res) => {
  const stateCode = req.code; 

  const state = statesData.find(state => state.code === stateCode);

  if (!state) {
    return res.status(404).json({ message: `No state found for code ${stateCode}` });
  }

  res.json({
    state: state.state,
    capital: state.capital_city,
  });
};

// get admission date
const getAdmission = async (req, res) => {
  const code = req.code;  // Extract the state code from the request

  if (!code) {
      return res.status(400).json({ message: 'State code is required.' });
  }

  // Find the state by its code
  const state = statesData.find(state => state.code === code);

  if (!state) {
      return res.status(404).json({ message: `No state found for code ${code}` });
  }

  // Check if the state has an admission_date field
  if (!state.admission_date) {
      return res.status(404).json({ message: `No admission date found for state ${code}` });
  }

  // Return the state and admission_date
  res.json({ state: state.state, admitted: state.admission_date });
};











module.exports = {
    getFunfact,
    getAllStates,
    addNewFact,
    updateFact,
    deleteFact,
    getState,
    getParamDetail,
    getCapital,
    getAdmission
}
