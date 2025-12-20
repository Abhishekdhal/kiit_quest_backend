const mongoose = require('mongoose');

const pyqSchema = mongoose.Schema({
    schoolName: { type: String, required: true, trim: true }, 
    branchName: { type: String, required: true, trim: true }, 
    semester: { type: String, required: true }, 
    // Use trim to avoid "file not found" errors caused by accidental spaces
    subjectId: { type: String, required: true, trim: true, index: true }, 
    subjectName: { type: String, required: true, trim: true }, 
    year: { type: String, required: true, trim: true, index: true }, 
    fileUrl: { type: String, required: true, unique: true }, 
}, { 
    timestamps: true,
    // Explicitly set collection name to avoid pluralization issues
    collection: 'pyqs' 
});

// Create a compound index for subjectId and year to optimize findOne queries
pyqSchema.index({ subjectId: 1, year: 1 });

const PYQ = mongoose.model('PYQ', pyqSchema);
module.exports = PYQ;

// const mongoose = require('mongoose');

// const pyqSchema = mongoose.Schema({
//     schoolName: { type: String, required: true }, 
//     branchName: { type: String, required: true }, 
//     semester: { type: String, required: true }, 
//     subjectId: { type: String, required: true }, 
//     subjectName: { type: String, required: true }, 
//     year: { type: String, required: true }, 
//     fileUrl: { type: String, required: true, unique: true }, // The direct PDF link
// });

// const PYQ = mongoose.model('PYQ', pyqSchema);
// module.exports = PYQ;