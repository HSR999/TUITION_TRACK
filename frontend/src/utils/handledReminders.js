const getKey = (month, studentId) => `tuitiontrack_handled_${month}_${studentId}`;

export const isReminderHandledLocally = (month, studentId) => (
  localStorage.getItem(getKey(month, studentId)) === "true"
);

export const markReminderHandledLocally = (month, studentId) => {
  localStorage.setItem(getKey(month, studentId), "true");
};
