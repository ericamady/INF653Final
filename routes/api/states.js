const express = require('express');
const { deleteState, getState } = require('../../controllers/statesController');
const router = express.Router();

const statesController = require('../../controllers/statesController');
const verifyStates = require('../../middleware/verifyStates');



//get all states
router.route('/')
.get(statesController.getAllStates);


//get one state
router.route('/:state')
    .get(verifyStates, statesController.getState);

//get capital
router.route('/:state/capital')
    .get(verifyStates, statesController.getCapital);

// get admission date
router.route('/:state/admission')
    .get(verifyStates, statesController.getAdmission);

//Get, patch and delete funfacts
router.route('/:state/funfact')
.get(verifyStates, statesController.getFunfact)
.post(verifyStates, statesController.addNewFact)
.patch(verifyStates, statesController.updateFact)
.delete(verifyStates, statesController.deleteFact);

//get filter
router.route('/:state/:field')
    .get(verifyStates, statesController.getParamDetail);



    


module.exports = router;
