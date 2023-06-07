const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const appointmentSchema = new Schema({

    phone: {
        type: String,
        required: true
    },

    date: {
        type: Date,
        required: true
    },

    doctor: {
        type: String,
        required: true
    },

    timeSlot: {
        type: String,
        required: true
    }
});

const appointment = mongoose.model('appointment', appointmentSchema);
module.exports = appointment;