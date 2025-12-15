const mongoose = require('mongoose');

const pyqSchema = mongoose.Schema({
    schoolName: { type: String, required: true }, 
    branchName: { type: String, required: true }, 
    semester: { type: String, required: true }, 
    subjectId: { type: String, required: true }, 
    subjectName: { type: String, required: true }, 
    year: { type: String, required: true }, 
    fileUrl: { type: String, required: true, unique: true }, // The direct PDF link
});

const PYQ = mongoose.model('PYQ', pyqSchema);
module.exports = PYQ;