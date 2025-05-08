// middleware/validateState.js

const validStates = ['AL', 'AR', 'AS', 'CO','CT','DE','DC','GA','GU', 'HI', 'ID', 'IL','IN',
    'IA','KS', 'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
    'NH','NJ','NM','NC','ND', 'OH','OK','OR', 'PA','PR','RI','SC','SD',
    'TN','TT','UT','VT','VA', 'NY', 'CA', 'TX', 'FL', 'WA','VI','WV','WI','WY']; 

const validateState = (req, res, next) => {
    const { state } = req.params;

    if (validStates.includes(state.toUpperCase())) {
        next();
    } else {
        res.status(400).json({ error: `Invalid state parameter: '${state}'` });
    }
};

module.exports = validateState;
