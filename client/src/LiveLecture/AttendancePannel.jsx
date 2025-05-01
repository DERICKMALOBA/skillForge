export default function AttendancePanel({ count }) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">👥</span>
        <span className="font-medium">{count} attending</span>
      </div>
    );
  }