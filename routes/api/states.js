const express = require('express');
const { deleteState, getState } = require('../../controllers/statesController');
const router = express.Router();

const statesController = require('../../controllers/statesController');
const validation = require('../../middleware/validation');

//validate states
router.get('/data/:state', validation, (req, res) => {
    const state = req.params.state.toUpperCase();
    res.json({ message: `Data for ${state}` });
});


router.route('/')
.get(statesController.getAllStates);



router.route('/:state/funfact')
//How to update
.get(statesController.getFunfact)
.post(statesController.addNewFact)
.patch(statesController.updateFact)
.delete(statesController.deleteFact);



router.route('/:state')
//How to update



//get request in url
router.route('/:id')
    .get(statesController.getState);

    router.route('/:code/capital')
    .get(statesController.getCapital);

    router.route('/:code/admission')
    .get(statesController.getAdmission);

router.route('/:id/:field')
    .get(statesController.getParamDetail);


module.exports = router;
