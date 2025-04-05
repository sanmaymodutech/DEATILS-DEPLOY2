const mongoose = require('mongoose');
const CustomComponentSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    price: {
      type: String,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    dimensions: {
      width: {
        type: Number,
        default: 0
      },
      depth: {
        type: Number,
        default: 0
      },
      height: {
        type: Number,
        default: 0
      }
    },
    material: {
      type: String
    },
    finish: {
      type: String
    },
    additionalInfo: {
      type: String
    },
    defineType: {
      type: String,
    },
    carcassType: {
      type: String
    },
    shutterMaterial: {
      type: String
    },
    shutterFinish: {
      type: String
    },
    shelvesQuantity: {
      type: Number,
      default: 0
    },
    shelvesRequired: {
      type: Boolean,
      default: false
    },
    drawerQuantity: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  });
  
  // Pre-save middleware to update timestamps
  CustomComponentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });
  
  module.exports= mongoose.model('CustomComponent', CustomComponentSchema);