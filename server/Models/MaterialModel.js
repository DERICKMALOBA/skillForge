const mongoose = require('mongoose');
const { Schema } = mongoose;

const materialSchema = new Schema({
  course: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true,
    index: true 
  },
  lecturer: { 
    type: Schema.Types.ObjectId, 
    ref: 'Lecturer',  // Assuming you have a User model
    required: true,
    index: true 
  },
  // File information
  originalName: { type: String, required: true },
  storagePath: { type: String, required: true },  // Changed from 'path' to be more descriptive
  fileSize: { type: Number, required: true },    // Changed from 'size'
  mimeType: { type: String, required: true },
  
  // Metadata
  title: { type: String, required: true },
  description: { type: String },
  module: { type: String },
  tags: [{ type: String, index: true }],
  
  // Access control
  visibility: { 
    type: String, 
    enum: ['public', 'private', 'scheduled'], 
    default: 'public' 
  },
  availableFrom: { type: Date, default: Date.now },
  availableTo: { type: Date },
  
  // Versioning
  version: { type: Number, default: 1 },
  previousVersions: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Material' 
  }],
  
  // Statistics
  downloadCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add text index for search
materialSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for file URL
materialSchema.virtual('downloadUrl').get(function() {
  return `/api/materials/download/${this._id}`;
});

module.exports = mongoose.model('Material', materialSchema);