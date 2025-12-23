const asyncHandler = require('express-async-handler');
const StudyMaterial = require('../models/StudyMaterial');

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Get subjects that have study materials available
// @route   GET /api/study-material/subjects
const getMaterialSubjects = asyncHandler(async (req, res) => {
    const { school, branch, semester } = req.query; 

    if (!school || !branch || !semester) {
        res.status(400);
        throw new Error('Please provide school, branch, and semester');
    }

    const subjects = await StudyMaterial.aggregate([
        {
            $match: {
                schoolName: { $regex: new RegExp(`^${escapeRegex(school.trim())}$`, 'i') },
                branchName: { $regex: new RegExp(`^${escapeRegex(branch.trim())}$`, 'i') },
                semester: semester.toString().trim(), 
            },
        },
        {
            $group: {
                _id: '$subjectId',
                name: { $first: '$subjectName' }, 
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

// @desc    Get all files (Notes/Labs) for a specific subject
// @route   GET /api/study-material/files
const getFilesBySubject = asyncHandler(async (req, res) => {
    const { subjectId } = req.query;

    if (!subjectId) {
        res.status(400);
        throw new Error('Subject ID is required');
    }

    const files = await StudyMaterial.find({ 
        subjectId: subjectId.toString().trim() 
    }).sort({ category: 1 });

    res.json(files);
});

module.exports = { getMaterialSubjects, getFilesBySubject };