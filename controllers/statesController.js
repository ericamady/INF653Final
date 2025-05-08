const State = require('../model/States');
const statesData = require('../model/states.json');

//display funfact
const getFunfact = async(req, res)=>{
  try{
    //pull state code from url
    const stateInitial = req.params.state.toUpperCase();
    //search MongoDB and match to url param
    const stateData = await State.findOne({stateCode: stateInitial});
    if(!stateData){
      return res.status(404).json({ message: `No Fun Facts found for ${stateInitial}`});
    }

  // Check if funfacts exist
  if (!stateData.funfacts || stateData.funfacts.length === 0) {
    return res.status(404).json({ message: `No fun facts available for state: ${stateInitial}`});
  }

  // Select a random fun fact
  const randomFact = stateData.funfacts[Math.floor(Math.random() * stateData.funfacts.length)];

  res.json({ state: stateInitial, funfact: randomFact });

} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
}
};

//find all states

const getAllStates = async (req, res) => {
  try {
    const contig = req.query.contig;

    // filter
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

    const funFactsMap = {};
    mongoStates.forEach(state => {
      if (state.funfacts && state.funfacts.length > 0) {
        funFactsMap[state.stateCode] = state.funfacts;
      }
    });

    // Merge funfacts into filtered states
    const result = filteredStates.map(state => {
      const funfacts = funFactsMap[state.code];
      return funfacts ? { ...state, funfacts } : state;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


  
const addNewFact = async (req, res) => {
    const { state } = req.params;
    let { funfact, funfacts } = req.body;

  
    if (funfact && typeof funfact === 'string') {
        funfacts = [funfact];
    }

    if (!Array.isArray(funfacts) || funfacts.length === 0) {
        return res.status(400).json({ message: 'Funfacts must be a non-empty array or string.' });
    }

    try {
      const stateCode = state.toUpperCase();
        const stateData = await State.findOne({ stateCode });
        console.log('Found state data:', stateData);

        if (!stateData) {
            return res.status(404).json({ message: 'State not found' });
        }

        if (!Array.isArray(stateData.funfacts)) {
            stateData.funfacts = [];
        }

        stateData.funfacts.push(...funfacts);
        const result = await stateData.save();

        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Unable to add funfacts' });
    }
};

const updateFact = async (req, res)=>{
 
        const { state } = req.params; 
        const { index, funfact } = req.body; 
    
        // Check if the index or funfact is missing
        if (!index === undefined|| !funfact) {
            return res.status(400).json({ message: 'Both index and funfact are required' });
        }
    
        try {
            // Convert the 1-based index to 0-based
            const zeroBasedIndex = index - 1;
    
            const normalizedStateCode = state.toUpperCase();  // Normalize to uppercase

        // Find the state 
        const foundState = await State.findOne({ stateCode: normalizedStateCode });
            
        if (!foundState) {
          return res.status(404).json({ message: `State with code ${normalizedStateCode} not found` });
      }

      foundState.funfacts[index] = funfact;
      const updatedState = await foundState.save();
    
      res.status(200).json(updatedState);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }

  };
    

const deleteFact = async (req, res)=>{
   
        const { state } = req.params;
        const { index } = req.body;
    
        if (!index) {
            return res.status(400).json({ message: 'Index is required' });
        }
    
        const stateCode = state.toUpperCase();
    
        try {
            const stateDoc = await State.findOne({ stateCode });
    
            if (!stateDoc) {
                return res.status(404).json({ message: `No state found with code ${stateCode}` });
            }
    
            if (!Array.isArray(stateDoc.funfacts) || stateDoc.funfacts.length === 0) {
                return res.status(404).json({ message: 'No fun facts found for this state' });
            }
    
            const adjustedIndex = index - 1;
    
            if (adjustedIndex < 0 || adjustedIndex >= stateDoc.funfacts.length) {
                return res.status(400).json({ message: 'Invalid index' });
            }
    
            // Remove the funfact 
            stateDoc.funfacts.splice(adjustedIndex, 1);
    
            const result = await stateDoc.save();
            res.status(200).json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error while deleting fun fact' });
        }
    };


// show one state
const getState = async (req, res) => {
    try {
      const stateCode = req.params.id.toUpperCase();
  
      // Find static data for the state
      const stateJson = statesData.find(
        (state) => state.code === stateCode
      );
  
      if (!stateJson) {
        return res.status(404).json({ message: 'Invalid state abbreviation parameter' });
      }
  
      // Find MongoDB entry for that state
      const stateMongo = await State.findOne({ stateCode });
  
      // Merge funfacts if available
      const mergedState = {
        ...stateJson,
        ...(stateMongo?.funfacts?.length > 0 && { funfacts: stateMongo.funfacts }),
      };
  
      res.status(200).json(mergedState);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error retrieving state' });
    }
  };



const getParamDetail = async (req,res)=>{
    const code = req.params?.id?.toUpperCase();
    const jsonField = req.params?.field?.toLowerCase();  

    if (!code) {
        return res.status(400).json({ message: 'State code is required.' });
    }

    const stateJson = statesData.find(state => state.code === code);
    if (!stateJson) {
        return res.status(404).json({ message: `No state found for code ${code}` });
    }

    // Check if the field exists on the stateJson object
    if (!stateJson[jsonField]) {
        return res.status(404).json({ message: `No such field ${jsonField} for state ${code}` });
    }

    res.json({ [jsonField]: stateJson[jsonField] });
};

// get the capital
const getCapital = async (req, res) => {
    const code = req.params.code?.toUpperCase(); 
   
    if (!code) {
        return res.status(400).json({ message: 'State code is required.' });
    }

   
    const state = statesData.find(state => state.code === code);

    if (!state) {
        return res.status(404).json({ message: `No state found for code ${code}` });
    }

    res.json({ state: state.state,
               capital: state.capital_city });
};

// get admission date
const getAdmission  = async (req, res) => {
    const code = req.params.code?.toUpperCase(); // Retrieve state code from query parameter

   
    if (!code) {
        return res.status(400).json({ message: 'State code is required.' });
    }

   
    const state = statesData.find(state => state.code === code);
    if (!state) {
        return res.status(404).json({ message: `No state found for code ${code}` });
    }

    if (!state.admission_date) {
        return res.status(404).json({ message: `No admission date found for state ${code}` });
    }

    res.json({ state: state.state,
               admitted: state.admission_date });
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