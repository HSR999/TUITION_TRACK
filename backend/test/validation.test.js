const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const { getIndiaDateKey, isValidDateKey, normalizePhone } = require("../utils/validation");

test("normalizes Indian and international phone numbers", () => {
  assert.equal(normalizePhone("98765 09001"), "+919876509001");
  assert.equal(normalizePhone("09876509001"), "+919876509001");
  assert.equal(normalizePhone("+1 (202) 555-0101"), "+12025550101");
  assert.equal(normalizePhone(""), "");
  assert.throws(() => normalizePhone("123"), /valid phone number/);
});

test("validates real calendar date keys and uses India local dates", () => {
  assert.equal(isValidDateKey("2024-02-29"), true);
  assert.equal(isValidDateKey("2025-02-29"), false);
  assert.equal(isValidDateKey("2025-13-01"), false);
  assert.equal(getIndiaDateKey(new Date("2026-01-01T20:00:00.000Z")), "2026-01-02");
});

test("student phone is optional while the parent phone is required", async () => {
  const student = new Student({
    teacherId: new mongoose.Types.ObjectId(),
    name: "Sam Lee",
    phone: "",
    parentName: "Alex Lee",
    parentPhone: "9876509001",
    class: "Group A",
    feeAmount: 1250.5,
    feeDueDate: 5,
  });
  await student.validate();
  assert.equal(student.phone, "");
  assert.equal(student.parentPhone, "+919876509001");

  const missingParentPhone = new Student({
    teacherId: new mongoose.Types.ObjectId(),
    name: "Sam Lee",
    parentName: "Alex Lee",
    class: "Group A",
    feeAmount: 1250,
    feeDueDate: 5,
  });
  await assert.rejects(missingParentPhone.validate(), (error) => {
    assert.ok(error.errors.parentPhone);
    return true;
  });
});

test("attendance model rejects impossible dates", async () => {
  const record = new Attendance({
    teacherId: new mongoose.Types.ObjectId(),
    studentId: new mongoose.Types.ObjectId(),
    date: "2025-02-30",
    status: "present",
  });
  await assert.rejects(record.validate(), (error) => {
    assert.ok(error.errors.date);
    return true;
  });
});
