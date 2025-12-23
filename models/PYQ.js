const mongoose = require('mongoose');

const pyqSchema = mongoose.Schema({
    schoolName: { type: String, required: true, trim: true }, 
    branchName: { type: String, required: true, trim: true }, 
    semester: { type: String, required: true }, 
    subjectId: { type: String, required: true, trim: true, index: true }, 
    subjectName: { type: String, required: true, trim: true }, 
    year: { type: String, required: true, trim: true, index: true }, 
    // NEW FIELD: Distinguishes between Midsem and Endsem
    type: { 
        type: String, 
        required: true, 
        enum: ['Midsem', 'Endsem'],
        default: 'Endsem' 
    }, 
    fileUrl: { type: String, required: true, unique: true }, 
}, { 
    timestamps: true,
    collection: 'pyqs' 
});

// UPDATE INDEX: Now includes 'type' to make search faster and unique
pyqSchema.index({ subjectId: 1, year: 1, type: 1 });

const PYQ = mongoose.model('PYQ', pyqSchema);
module.exports = PYQ;