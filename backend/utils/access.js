const getInstituteId = (req) => req.teacher?.instituteId?._id || req.teacher?.instituteId || null;

const isOwner = (req) => req.teacher?.role === "owner";

const getDataScope = (req) => {
  const instituteId = getInstituteId(req);

  if (isOwner(req) && instituteId) {
    return {
      $or: [
        { instituteId },
        { teacherId: req.teacher._id, instituteId: null },
        { teacherId: req.teacher._id, instituteId: { $exists: false } },
      ],
    };
  }

  return { teacherId: req.teacher._id };
};

const withDataScope = (req, extra = {}) => {
  const scope = getDataScope(req);
  if (scope.$or && extra.$or) return { $and: [scope, extra] };
  return { ...scope, ...extra };
};

const getCreateOwnership = (req, teacherId = req.teacher._id) => ({
  teacherId,
  instituteId: getInstituteId(req),
});

const requireOwner = (req, res, next) => {
  if (!isOwner(req)) {
    return res.status(403).json({ message: "Only institute owner can perform this action" });
  }
  next();
};

module.exports = {
  getCreateOwnership,
  getDataScope,
  getInstituteId,
  isOwner,
  requireOwner,
  withDataScope,
};
