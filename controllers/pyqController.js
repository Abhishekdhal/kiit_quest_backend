const asyncHandler = require('express-async-handler');
const PYQ = require('../models/PYQ');

/**
 * Helper to escape special regex characters (for branch/school names)
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

// @desc    Get available years for a subject
// @route   GET /api/pyq/years
const getYears = asyncHandler(async (req, res) => {
    const { subjectId } = req.query;
    
    if (!subjectId) {
        res.status(400);
        throw new Error('Subject ID is required');
    }

    const years = await PYQ.distinct('year', { 
        subjectId: subjectId.toString().trim() 
    });

    res.json(years);
});

// @desc    Get the actual file URL for a specific Year AND Type
// @route   GET /api/pyq/file-url
const getFileUrl = asyncHandler(async (req, res) => {
    // 1. Capture the 'type' parameter sent from the Flutter app
    const { subjectId, year, type } = req.query;

    console.log(`Searching for -> ID: [${subjectId}], Year: [${year}], Type: [${type}]`);

    if (!subjectId || !year || !type) {
        res.status(400);
        throw new Error('Subject ID, Year, and Type are required');
    }

    // 2. Perform a specific search using the new 'type' field
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

// const asyncHandler = require('express-async-handler');
// const PYQ = require('../models/PYQ');

// /**
//  * Helper function to escape special regex characters.
//  * This is crucial for matching branch names like "(CSE) Computer Science & Engineering"
//  * because characters like ( ) and & have special meanings in Regex.
//  */
// const escapeRegex = (string) => {
//     return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// };

// // @desc    Get subjects based on school, branch, and semester
// // @route   GET /api/pyq/subjects
// // @access  Private
// const getSubjects = asyncHandler(async (req, res) => {
//     const { school, branch, semester } = req.query; 

//     // Log the exact values hitting the server for Vercel debugging
//     console.log(`Fetching subjects for: School: [${school}], Branch: [${branch}], Sem: [${semester}]`);

//     if (!school || !branch || !semester) {
//         res.status(400);
//         throw new Error('Please provide school, branch, and semester');
//     }

//     const subjects = await PYQ.aggregate([
//         {
//             $match: {
//                 // 'i' flag makes matching case-insensitive
//                 // escapeRegex ensures (CSE) is treated as literal text
//                 schoolName: { $regex: new RegExp(`^${escapeRegex(school.trim())}$`, 'i') },
//                 branchName: { $regex: new RegExp(`^${escapeRegex(branch.trim())}$`, 'i') },
//                 semester: semester.toString().trim(), 
//             },
//         },
//         {
//             $group: {
//                 _id: '$subjectId',
//                 name: { $first: '$subjectName' }, 
//             },
//         },
//         {
//             $project: {
//                 _id: 0,
//                 id: '$_id',
//                 name: '$name',
//             },
//         },
//     ]);

//     console.log(`Subjects Found: ${subjects.length}`);
//     res.json(subjects);
// });

// // @desc    Get available years for a subject
// // @route   GET /api/pyq/years
// // @access  Private
// const getYears = asyncHandler(async (req, res) => {
//     const { subjectId } = req.query;
    
//     if (!subjectId) {
//         res.status(400);
//         throw new Error('Subject ID is required');
//     }

//     // Ensure subjectId is trimmed to match the database entry exactly
//     const years = await PYQ.distinct('year', { 
//         subjectId: subjectId.toString().trim() 
//     });

//     console.log(`Years found for Subject [${subjectId}]:`, years);
//     res.json(years);
// });

// // @desc    Get the actual file URL
// // @route   GET /api/pyq/file-url
// // @access  Private
// const getFileUrl = asyncHandler(async (req, res) => {
//     const { subjectId, year } = req.query;

//     console.log(`Searching for File -> SubjectID: [${subjectId}], Year: [${year}]`);

//     if (!subjectId || !year) {
//         res.status(400);
//         throw new Error('Subject ID and Year are required');
//     }

//     /**
//      * $or allows matching regardless of whether 'year' is stored as:
//      * 1. A String ("2023")
//      * 2. A Number (2023)
//      * This solves the common "404 File Not Found" error.
//      */
//     const pyqDoc = await PYQ.findOne({ 
//         subjectId: subjectId.toString().trim(), 
//         $or: [
//             { year: year.toString().trim() },
//             { year: isNaN(parseInt(year)) ? null : parseInt(year) }
//         ]
//     }).select('fileUrl');

//     if (pyqDoc && pyqDoc.fileUrl) {
//         res.json({ fileUrl: pyqDoc.fileUrl });
//     } else {
//         console.error(`DB query FAILED for SubjectID: ${subjectId} and Year: ${year}`);
//         res.status(404);
//         throw new Error('PYQ file not found for the selected criteria.');
//     }
// });

// module.exports = { 
//     getSubjects, 
//     getYears, 
//     getFileUrl 
// };

// const asyncHandler = require('express-async-handler');
// const PYQ = require('../models/PYQ');

// const getSubjects = asyncHandler(async (req, res) => {
//     const { school, branch, semester } = req.query; 

//     const subjects = await PYQ.aggregate([
//         {
//             $match: {
//                 schoolName: school,
//                 branchName: branch,
//                 semester: semester,
//             },
//         },
//         {
//             $group: {
//                 _id: '$subjectId',
//                 name: { $first: '$subjectName' }, // Get the subject name
//             },
//         },
//         {
//             $project: {
//                 _id: 0,
//                 id: '$_id',
//                 name: '$name',
//             },
//         },
//     ]);

//     res.json(subjects);
// });

// const getYears = asyncHandler(async (req, res) => {
//     const { subjectId } = req.query;
//     // Find all unique years available for the selected subject
//     const years = await PYQ.distinct('year', { subjectId: subjectId });

//     res.json(years);
// });

// const getFileUrl = asyncHandler(async (req, res) => {
//     const { subjectId, year } = req.query;

//     const pyqDoc = await PYQ.findOne({ 
//         subjectId, 
//         year 
//     }).select('fileUrl');

//     if (pyqDoc && pyqDoc.fileUrl) {
//         res.json({ fileUrl: pyqDoc.fileUrl });
//     } else {
//         res.status(404);
//         throw new Error('PYQ file not found for the selected criteria.');
//     }
// });

// module.exports = { getSubjects, getYears, getFileUrl };