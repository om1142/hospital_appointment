const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({

    phone: {
        type: String,
        required: true
    },

    fullname: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    doctor: {
        type: String,
        required: true,
        enum: ['Dr. John Doe', 'Dr. Jane Smith']
    },

    timeSlot: {
        type: String,
        enum: ['9:00 AM', '9:20 AM', '9:40 AM', '10:00 AM', '10:20 AM', '10:40 AM', '11:00 AM', '11:20 AM',
        '11:40 AM', '12:00 PM', '12:20 PM', '12:40 PM', '1:00 PM', '1:20 PM', '1:40 PM', '2:00 PM',
        '2:20 PM', '2:40 PM', '3:00 PM', '3:20 PM', '3:40 PM', '4:00 PM', '4:20 PM', '4:40 PM'],
        required: true
    },

    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },

    medicine: {
        type: String,
        required: true
    },

    disease: {
        type: String,
        required: true
    },

    visited: {
        type: Boolean,
        default: false
    }
});

const report = mongoose.model('report', appointmentSchema);
module.exports = report;