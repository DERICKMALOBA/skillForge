// utils/emailService.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'Gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendAssignmentNotification = async (students, course, assignment) => {
  try {
    if (students.length > 0) {
      await Promise.all(students.map(student => {
        return transporter.sendMail({
          from: process.env.EMAIL_FROM || 'E-Learning Platform <noreply@elearning.com>',
          to: student.email,
          subject: `New Assignment: ${assignment.title}`,
          html: `
            <h2>New Assignment Available</h2>
            <p>Dear ${student.name},</p>
            <p>A new assignment "${assignment.title}" has been posted for ${course.courseName}.</p>
            <p><strong>Due Date:</strong> ${new Date(assignment.dueDate).toLocaleString()}</p>
            <p><strong>Points:</strong> ${assignment.maxPoints}</p>
            <p>${assignment.description || ''}</p>
            <p>Please log in to your student portal to view the full details.</p>
            <p>Best regards,<br>The Teaching Team</p>
          `
        });
      }));
    }
  } catch (error) {
    console.error('Failed to send email notifications:', error);
    throw error;
  }
};