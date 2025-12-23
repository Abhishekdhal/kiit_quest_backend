const mongoose = require('mongoose');

const studyMaterialSchema = mongoose.Schema({
    // MATCHING YOUR PYQ FORMAT
    subjectName: { type: String, required: true, trim: true },
    subjectId: { type: String, required: true, trim: true, index: true },
    schoolName: { type: String, required: true, trim: true },
    branchName: { type: String, required: true, trim: true },
    semester: { type: String, required: true },
    
    // STUDY MATERIAL SPECIFIC
    title: { type: String, required: true, trim: true }, // e.g. "Unit 1 Notes"
    category: { 
        type: String, 
        required: true, 
        enum: ['Notes', 'Lab Manual', 'Assignment', 'Others'],
        default: 'Notes' 
    },
    fileUrl: { type: String, required: true },
}, { timestamps: true, collection: 'studymaterials' });

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);

// const mongoose = require('mongoose');

// const studyMaterialSchema = mongoose.Schema({
//     schoolName: { type: String, required: true, trim: true }, 
//     branchName: { type: String, required: true, trim: true }, 
//     semester: { type: String, required: true }, 
//     subjectId: { type: String, required: true, trim: true, index: true }, 
//     subjectName: { type: String, required: true, trim: true }, 
//     title: { type: String, required: true, trim: true }, // e.g., "Unit 1: Data Structures"
//     category: { 
//         type: String, 
//         required: true, 
//         enum: ['Notes', 'Lab Manual', 'Assignment', 'Others'],
//         default: 'Notes' 
//     }, 
//     fileUrl: { type: String, required: true, unique: true }, 
// }, { 
//     timestamps: true,
//     collection: 'studymaterials' 
// });

// // Compound index for fast searching within a subject
// studyMaterialSchema.index({ subjectId: 1, category: 1 });

// const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);
// module.exports = StudyMaterial;