const asyncHandler = require('express-async-handler');
const PYQ = require('../models/PYQ');

const getSubjects = asyncHandler(async (req, res) => {
    const { school, branch, semester } = req.query; 

    const subjects = await PYQ.aggregate([
        {
            $match: {
                schoolName: school,
                branchName: branch,
                semester: semester,
            },
        },
        {
            $group: {
                _id: '$subjectId',
                name: { $first: '$subjectName' }, // Get the subject name
            },
        },
        {
            $project: {
                _id: 0,
                id: '$_id',
                name: '$name',
            },
        },
    ]);

    res.json(subjects);
});

const getYears = asyncHandler(async (req, res) => {
    const { subjectId } = req.query;
    // Find all unique years available for the selected subject
    const years = await PYQ.distinct('year', { subjectId: subjectId });

    res.json(years);
});

const getFileUrl = asyncHandler(async (req, res) => {
    const { subjectId, year } = req.query;

    const pyqDoc = await PYQ.findOne({ 
        subjectId, 
        year 
    }).select('fileUrl');

    if (pyqDoc && pyqDoc.fileUrl) {
        res.json({ fileUrl: pyqDoc.fileUrl });
    } else {
        res.status(404);
        throw new Error('PYQ file not found for the selected criteria.');
    }
});

module.exports = { getSubjects, getYears, getFileUrl };