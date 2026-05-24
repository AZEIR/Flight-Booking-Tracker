export const formatTime = (dateString) => {
  if (!dateString) return "--:--";
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDate = (dateString) => {
  if (!dateString) return "Unknown Date";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatTimestamp = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getFlightStatusDetails = (departureTime) => {
  if (!departureTime)
    return {
      state: "unknown",
      label: "Status Unknown",
      color: "text-gray-600 bg-gray-100 border border-gray-200",
    };
  const now = new Date();
  const dep = new Date(departureTime);
  const diffHours = (dep - now) / (1000 * 60 * 60);

  if (diffHours <= 0)
    return {
      state: "departed",
      label: "Flight Departed",
      color: "text-amber-700 bg-amber-50 border border-amber-200",
    };
  if (diffHours < 24) {
    const h = Math.floor(diffHours);
    const m = Math.floor((diffHours - h) * 60);
    return {
      state: "locked",
      label: `User Locked (${h}h ${m}m to departure)`,
      color: "text-amber-700 bg-amber-50 border border-amber-200",
    };
  }
  return {
    state: "active",
    label: "Scheduled",
    color: "text-blue-700 bg-blue-50 border border-blue-200",
  };
};
