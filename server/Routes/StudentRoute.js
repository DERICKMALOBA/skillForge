const express = require('express');
const StudentRoute = express.Router();
const StudyMaterial = require('../Models/Studymaterials');
const Assignment = require('../Models/Assignment'); 
const Course = require('../Models/CourseModel'); // Make sure to import Course model
const path = require('path');
const fs = require('fs');
const mongoose =require('mongoose')


// Get all assignments across all courses
StudentRoute.get('/assignments/all', async (req, res) => {
  try {
    const assignments = await Assignment.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: {
          path: '$courseInfo',
          preserveNullAndEmptyArrays: true // Handle assignments without courses
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: {
          path: '$creator',
          preserveNullAndEmptyArrays: true // Handle assignments without creators
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          instructions: 1,
          dueDate: 1,
          maxPoints: 1,
          submissionType: 1,
          fileRequirements: 1,
          allowMultipleAttempts: 1,
          createdAt: 1,
          courseInfo: {
            $ifNull: ['$courseInfo', { 
              courseName: 'Unknown Course',
              courseCode: 'N/A',
              _id: null 
            }]
          },
        
          daysRemaining: {
            $ceil: {
              $divide: [
                { $subtract: ['$dueDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          isOverdue: {
            $cond: { 
              if: { $lt: ['$dueDate', new Date()] }, 
              then: true, 
              else: false 
            }
          }
        }
      },
      {
        $sort: { 
          isOverdue: 1,
          dueDate: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
});





// Get all materials across all courses (FIXED SYNTAX)
StudentRoute.get('/materials/all', async (req, res) => {
  try {
    console.log('Fetching all study materials');
    
    // 1. First try direct material collection query
    let materials = await StudyMaterial.find({})
      .select('title module description originalName fileSize _id course')
      .sort({ createdAt: -1 })
      .populate('course', 'name code')
      .lean();

    // 2. If empty, try getting materials through courses
    if (materials.length === 0) {
      console.log('Trying alternative query approach');
      
      const courses = await Course.find({})
        .populate({
          path: 'materials',
          select: 'title module description originalName fileSize _id',
          options: { sort: { createdAt: -1 } } // FIXED: Added missing closing brace
        })
        .lean();

      // SAFE MATERIALS EXTRACTION WITH NULL CHECKS
      materials = courses.flatMap(course => {
        // Check if course exists and has materials array
        if (!course?.materials) return [];
        
        return course.materials
          .filter(material => material) // Filter out null/undefined
          .map(material => ({
            ...material,
            course: { // Include course reference
              _id: course._id,
              name: course.courseName || 'Unnamed Course',
              code: course.courseCode || 'N/A'
            }
          }));
      });
    }

    console.log(`Found ${materials.length} materials total`);
    res.json({
      success: true,
      data: materials,
      message: materials.length > 0
        ? 'All materials retrieved'
        : 'No materials found in database'
    });
  } catch (err) {
    console.error('Error fetching all materials:', err);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + err.message
    });
  }
});

// Download material with robust validation
StudentRoute.get('/download/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Download request for material ID: ${id}`);
    console.log('Is valid ObjectId?', mongoose.Types.ObjectId.isValid(id)); // Check if it's a valid ObjectId

    // 1. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.warn('Invalid ObjectId format.');
      return res.status(400).json({ success: false, message: 'Invalid material ID.' });
    }

    // 2. Fetch material from DB
    console.log('Trying to find material with ID:', id);
    const material = await StudyMaterial.findById(id);
    console.log('Fetched material:', material); // Log fetched material

    if (!material) {
      console.warn(`Material not found in DB for ID: ${id}`);
      return res.status(404).json({ success: false, message: 'Material not found.' });
    }

    // 3. Resolve and verify file path
    const filePath = path.resolve(material.storagePath);
    const fileExists = fs.existsSync(filePath);

    console.log(`Resolved file path: ${filePath}, Exists: ${fileExists}`);

    if (!fileExists) {
      console.error('File does not exist at resolved path.');
      return res.status(404).json({ success: false, message: 'File not found on server.' });
    }

    // 4. Send file as download
    res.download(filePath, material.originalName, async (err) => {
      if (err) {
        console.error('Error during download:', err);
        if (!res.headersSent) {
          return res.status(500).json({ success: false, message: 'Download failed.' });
        }
      } else {
        console.log('Download completed for:', material.originalName);
        try {
          await StudyMaterial.updateOne(
            { _id: material._id },
            { $inc: { downloadCount: 1 } }
          );
        } catch (updateErr) {
          console.error('Failed to update download count:', updateErr);
        }
      }
    });

  } catch (error) {
    console.error('Server error during download:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Get all assignments for a specific course
StudentRoute.get('/courses/:courseId/assignments', async (req, res) => {
  try {
    const { courseId } = req.params;

    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID format'
      });
    }

    // Fetch assignments with course and creator info
    const assignments = await Assignment.find({ course: courseId })
      .populate('course', 'courseName courseCode')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1 }); // Sort by due date ascending

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assignments'
    });
  }
});

// Add to StudentRoute.js
StudentRoute.get('/assignments/:id/download', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment || !assignment.attachmentPath) {
      return res.status(404).json({
        success: false,
        message: 'Assignment or attachment not found'
      });
    }

    const filePath = path.resolve(assignment.attachmentPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Attachment file not found'
      });
    }

    res.download(filePath, assignment.attachmentName || 'assignment_attachment');
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download attachment'
    });
  }
});



// StudentRoute.js

// Get single assignment details
StudentRoute.get('/courses/:courseId/assignments/:assignmentId', async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(courseId) || 
        !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const assignment = await Assignment.aggregate([
      {
        $match: { 
          _id: new mongoose.Types.ObjectId(assignmentId),
          course: new mongoose.Types.ObjectId(courseId) 
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: '$courseInfo'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: '$creator'
      },
      {
        $project: {
          title: 1,
          description: 1,
          instructions: 1,
          dueDate: 1,
          maxPoints: 1,
          submissionType: 1,
          fileRequirements: 1,
          allowMultipleAttempts: 1,
          createdAt: 1,
          'courseInfo.courseName': 1,
          'courseInfo.courseCode': 1,
          'creator.name': 1,
          daysRemaining: {
            $ceil: {
              $divide: [
                { $subtract: ['$dueDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          isOverdue: {
            $cond: { 
              if: { $lt: ['$dueDate', new Date()] }, 
              then: true, 
              else: false 
            }
          }
        }
      }
    ]);

    if (assignment.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.status(200).json({ success: true, data: assignment[0] });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignment' });
  }
});

// StudentRoute.js

// Get single assignment details
StudentRoute.get('/courses/:courseId/assignments/:assignmentId', async (req, res) => {
  try {
    const { courseId, assignmentId } = req.params;

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(courseId) || 
        !mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const assignment = await Assignment.aggregate([
      {
        $match: { 
          _id: new mongoose.Types.ObjectId(assignmentId),
          course: new mongoose.Types.ObjectId(courseId) 
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: '$courseInfo'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creator'
        }
      },
      {
        $unwind: '$creator'
      },
      {
        $project: {
          title: 1,
          description: 1,
          instructions: 1,
          dueDate: 1,
          maxPoints: 1,
          submissionType: 1,
          fileRequirements: 1,
          allowMultipleAttempts: 1,
          createdAt: 1,
          'courseInfo.courseName': 1,
          'courseInfo.courseCode': 1,
          'creator.name': 1,
          daysRemaining: {
            $ceil: {
              $divide: [
                { $subtract: ['$dueDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          isOverdue: {
            $cond: { 
              if: { $lt: ['$dueDate', new Date()] }, 
              then: true, 
              else: false 
            }
          }
        }
      }
    ]);

    if (assignment.length === 0) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.status(200).json({ success: true, data: assignment[0] });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignment' });
  }
});


// Get all assignments across all courses
StudentRoute.get('/assignments/all', async (req, res) => {
  try {
    const assignments = await Assignment.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      {
        $unwind: {
          path: '$courseInfo',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          dueDate: 1,
          maxPoints: 1,
          submissionType: 1,
          'courseInfo.courseName': 1,
          'courseInfo.courseCode': 1,
          'courseInfo._id': 1,
          daysRemaining: {
            $ceil: {
              $divide: [
                { $subtract: ['$dueDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          },
          isOverdue: {
            $cond: { 
              if: { $lt: ['$dueDate', new Date()] }, 
              then: true, 
              else: false 
            }
          }
        }
      },
      {
        $sort: { 
          isOverdue: 1,
          dueDate: 1
        }
      }
    ]);

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
  }
});

module.exports = StudentRoute;