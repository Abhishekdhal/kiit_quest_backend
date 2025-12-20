const asyncHandler = require('express-async-handler');
const PYQ = require('../models/PYQ');

// @desc    Get subjects based on school, branch, and semester
// @route   GET /api/pyq/subjects
const getSubjects = asyncHandler(async (req, res) => {
    const { school, branch, semester } = req.query; 

    // console.log helps verify exactly what Flutter is sending in Vercel logs
    console.log(`Fetching subjects for: [${school}], [${branch}], Sem: [${semester}]`);

    const subjects = await PYQ.aggregate([
        {
            $match: {
                // Regex handles case sensitivity and leading/trailing whitespace
                schoolName: { $regex: new RegExp(`^${school.trim()}$`, 'i') },
                branchName: { $regex: new RegExp(`^${branch.trim()}$`, 'i') },
                // Ensure semester is treated as a string for matching
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
    
    // Ensure subjectId is trimmed to match the database entry exactly
    const years = await PYQ.distinct('year', { 
        subjectId: subjectId.toString().trim() 
    });

    res.json(years);
});

// @desc    Get the actual file URL
// @route   GET /api/pyq/file-url
const getFileUrl = asyncHandler(async (req, res) => {
    const { subjectId, year } = req.query;

    console.log(`Searching for File -> SubjectID: [${subjectId}], Year: [${year}]`);

    // FIX: Look for year as both a string and a number using $or operator
    const pyqDoc = await PYQ.findOne({ 
        subjectId: subjectId.toString().trim(), 
        $or: [
            { year: year.toString().trim() },
            { year: isNaN(parseInt(year)) ? null : parseInt(year) }
        ]
    }).select('fileUrl');

    if (pyqDoc && pyqDoc.fileUrl) {
        res.json({ fileUrl: pyqDoc.fileUrl });
    } else {
        // This block executes when the query returns null
        console.error(`DB query FAILED for SubjectID: ${subjectId} and Year: ${year}`);
        res.status(404);
        throw new Error('PYQ file not found for the selected criteria.');
    }
});

module.exports = { getSubjects, getYears, getFileUrl };

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