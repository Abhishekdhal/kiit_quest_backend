const asyncHandler = require('express-async-handler');
const PYQ = require('../models/PYQ');
//completed this file
/**
 * Helper to escape special regex characters (for branch/school names)
 * This ensures strings like "(CSE)" are treated as literals.
 */
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// @desc    Get subjects based on school, branch, and semester
// @route   GET /api/pyq/subjects
const getSubjects = asyncHandler(async (req, res) => {
    const { school, branch, semester } = req.query; 

    if (!school || !branch || !semester) {
        res.status(400);
        throw new Error('Please provide school, branch, and semester');
    }

    const subjects = await PYQ.aggregate([
        {
            $match: {
                // Matches school and branch case-insensitively.
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

// @desc    Get available years for a subject filtered by Exam Type
// @route   GET /api/pyq/years
const getYears = asyncHandler(async (req, res) => {
    // UPDATED: Capture 'type' to filter the year list.
    const { subjectId, type } = req.query;
    
    if (!subjectId) {
        res.status(400);
        throw new Error('Subject ID is required');
    }

    // Build the query to find only years that have the selected paper type.
    const queryFilter = { 
        subjectId: subjectId.toString().trim() 
    };

    if (type) {
        queryFilter.type = type.toString().trim();
    }

    // Returns unique years matching the subject and exam type.
    const years = await PYQ.distinct('year', queryFilter);

    console.log(`Years found for [${subjectId}] with type [${type}]:`, years);
    res.json(years);
});

// @desc    Get the actual file URL for a specific Year AND Type
// @route   GET /api/pyq/file-url
const getFileUrl = asyncHandler(async (req, res) => {
    const { subjectId, year, type } = req.query;

    console.log(`Searching for -> ID: [${subjectId}], Year: [${year}], Type: [${type}]`);

    if (!subjectId || !year || !type) {
        res.status(400);
        throw new Error('Subject ID, Year, and Type are required');
    }

    // Performs a specific search using subjectId, year, and the new 'type' field.
    const pyqDoc = await PYQ.findOne({ 
        subjectId: subjectId.toString().trim(),
        type: type.toString().trim(), // Matches 'Midsem' or 'Endsem'
        $or: [
            { year: year.toString().trim() },
            { year: isNaN(parseInt(year)) ? null : parseInt(year) }
        ]
    }).select('fileUrl');

    if (pyqDoc && pyqDoc.fileUrl) {
        res.json({ fileUrl: pyqDoc.fileUrl });
    } else {
        res.status(404);
        throw new Error(`Paper not found for ${year} ${type}`);
    }
});

module.exports = { 
    getSubjects, 
    getYears, 
    getFileUrl 
};
