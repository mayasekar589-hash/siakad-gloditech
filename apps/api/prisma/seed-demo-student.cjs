const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const program = await prisma.studyProgram.upsert({
    where: { code: "D3-NAU" },
    update: { name: "D-III Studi Nautika", degree: "D-III", unit: "Poltektrans SDP Palembang", status: "ACTIVE" },
    create: { code: "D3-NAU", name: "D-III Studi Nautika", degree: "D-III", unit: "Poltektrans SDP Palembang" }
  });

  const lecturer = await prisma.lecturer.upsert({
    where: { nidn: "DEMO-NAU-001" },
    update: { name: "Ahmad Fauzi", title: "Capt., M.Mar.", studyProgramId: program.id, status: "ACTIVE" },
    create: { nidn: "DEMO-NAU-001", name: "Ahmad Fauzi", title: "Capt., M.Mar.", studyProgramId: program.id }
  });

  const course = await prisma.course.upsert({
    where: { code: "NAU401" },
    update: { name: "Navigasi Lanjutan", credits: 3, semester: 4, studyProgramId: program.id, kind: "WAJIB", status: "ACTIVE" },
    create: { code: "NAU401", name: "Navigasi Lanjutan", credits: 3, semester: 4, studyProgramId: program.id, kind: "WAJIB" }
  });

  const offering = await prisma.classOffering.upsert({
    where: { code: "NAU401-4A-2025-DEMO" },
    update: { courseId: course.id, lecturerId: lecturer.id, academicYear: "2025/2026", term: "GENAP", className: "Nautika 4A", capacity: 30, status: "ACTIVE", room: "Simulator Nautika" },
    create: { code: "NAU401-4A-2025-DEMO", courseId: course.id, lecturerId: lecturer.id, academicYear: "2025/2026", term: "GENAP", className: "Nautika 4A", capacity: 30, status: "ACTIVE", room: "Simulator Nautika" }
  });

  const applicant = await prisma.applicant.upsert({
    where: { nationalId: "9000000000000001" },
    update: { fullName: "Muhammad Rizky Pratama", email: "rizky.pratama@demo.poltektrans.ac.id", phone: "081200001001" },
    create: { nationalId: "9000000000000001", fullName: "Muhammad Rizky Pratama", email: "rizky.pratama@demo.poltektrans.ac.id", phone: "081200001001" }
  });

  const application = await prisma.application.upsert({
    where: { registrationNumber: "DEMO-2025-202501001" },
    update: { applicantId: applicant.id, status: "REGISTERED", personalData: { birthPlace: "Palembang", birthDate: "2007-01-15", gender: "L" } },
    create: { registrationNumber: "DEMO-2025-202501001", applicantId: applicant.id, status: "REGISTERED", personalData: { birthPlace: "Palembang", birthDate: "2007-01-15", gender: "L" } }
  });

  const student = await prisma.student.upsert({
    where: { studentNumber: "202501001" },
    update: { applicantId: applicant.id, sourceApplicationId: application.id, name: "Muhammad Rizky Pratama", studentNumber: "202501001", email: "rizky.pratama@demo.poltektrans.ac.id", phone: "081200001001", studyProgramId: program.id, cohort: 2025, semester: 4, className: "Nautika 4A", academicStatus: "AKTIF" },
    create: { applicantId: applicant.id, sourceApplicationId: application.id, name: "Muhammad Rizky Pratama", studentNumber: "202501001", email: "rizky.pratama@demo.poltektrans.ac.id", phone: "081200001001", studyProgramId: program.id, cohort: 2025, semester: 4, className: "Nautika 4A", academicStatus: "AKTIF" }
  });

  await prisma.krsRecord.upsert({
    where: { studentId_academicYear_term: { studentId: student.id, academicYear: "2025/2026", term: "GENAP" } },
    update: { status: "SUBMITTED", rejectionReason: null },
    create: { studentId: student.id, academicYear: "2025/2026", term: "GENAP", status: "SUBMITTED", items: { create: [{ offeringId: offering.id }] } }
  });

  console.log(`Seeded canonical demo student ${student.studentNumber} with linked applicant, source application, and KRS.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
