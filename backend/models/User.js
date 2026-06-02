const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'කරුණාකර නම ඇතුළත් කරන්න']
    },
    username: {
        type: String,
        required: [true, 'කරුණාකර Username එකක් ඇතුළත් කරන්න'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'කරුණාකර Password එකක් ඇතුළත් කරන්න'],
        minlength: 6
    },
    balance: {
        type: Number,
        default: 0 // මුලින්ම රෙජිස්ටර් වෙද්දී සල්ලි 0යි, ඇඩ්මින් තමයි දාන්න ඕනේ
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isFrozen: {
        type: Boolean,
        default: false // අර උඹ කියපු හොර වැඩ කරන ඇඬපාලයන්ව බ්ලොක් කරන්න පාවිච්චි කරන්නේ මේක
    },
    lastActive: {
        type: Date,
        default: Date.now // සෙල්ලම් නොකරන අයව දින 30න් අයින් කරන්න මේක ඕන වෙනවා
    }
}, {
    timestamps: true // CreatedAt සහ UpdatedAt ඔටෝම හැදෙනවා
});

module.exports = mongoose.model('User', UserSchema);