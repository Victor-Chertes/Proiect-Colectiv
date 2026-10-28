const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProgressSheets = async (userId) => {
  return prisma.progressSheet.findMany({
    where: { userId },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

const createProgressSheet = async (userId, name, description) => {

  if (!name || !name.trim()) {
    throw Object.assign(
      new Error('Te rugăm să introduci un nume pentru fișă.'),
      { code: 'EMPTY_NAME' }
    );
  }

  const existing = await prisma.progressSheet.findFirst({
    where: { userId, name: name.trim() },
  });
  if (existing) {
    throw Object.assign(
      new Error('Ai deja o fișă cu acest nume, alege altul.'),
      { code: 'DUPLICATE_NAME' }
    );
  }

  return prisma.progressSheet.create({
    data: {
      name: name.trim(),
      description: description?.trim() || '',
      userId,
    },
    include: { _count: { select: { entries: true } } },
  });
};

const getProgressSheet = async (sheetId, userId) => {
  const sheet = await prisma.progressSheet.findUnique({
    where: { id: sheetId },
    include: { entries: { orderBy: { date: 'desc' } } },
  });
  if (!sheet) {
    throw Object.assign(new Error('Fișa nu a fost găsită.'), { code: 'NOT_FOUND' });
  }
  if (sheet.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }
  return sheet;
};

const addProgressEntry = async (sheetId, userId, value, notes) => {

  const sheet = await prisma.progressSheet.findUnique({ where: { id: sheetId } });
  if (!sheet) {
    throw Object.assign(
      new Error('Fișa de progres nu mai există. Vei fi redirecționat înapoi.'),
      { code: 'SHEET_NOT_FOUND' }
    );
  }
  if (sheet.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  if (value === undefined || value === null || value === '') {
    throw Object.assign(
      new Error('Trebuie să introduci o valoare pentru a salva progresul.'),
      { code: 'EMPTY_VALUE' }
    );
  }

  const numericValue = parseFloat(value);

  if (isNaN(numericValue) || numericValue < 0) {
    throw Object.assign(
      new Error('Valoarea introdusă este invalidă. Introdu un număr pozitiv.'),
      { code: 'INVALID_VALUE' }
    );
  }

  return prisma.progressEntry.create({
    data: {
      progressSheetId: sheetId,
      value: numericValue,
      notes: notes?.trim() || '',
    },
  });
};


const deleteProgressSheet = async (sheetId, userId) => {
  const sheet = await prisma.progressSheet.findUnique({ where: { id: sheetId } });

  if (!sheet) {
    throw Object.assign(
      new Error('Fișa nu mai există în sistem.'),
      { code: 'SHEET_NOT_FOUND' }
    );
  }
  if (sheet.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  await prisma.progressSheet.delete({ where: { id: sheetId } });
};

const updateProgressEntry = async (entryId, userId, value, notes) => {
  const entry = await prisma.progressEntry.findUnique({
    where: { id: entryId },
    include: { progressSheet: true },
  });
  if (!entry) {
    throw Object.assign(new Error('Intrarea nu a fost găsită.'), { code: 'NOT_FOUND' });
  }
  if (entry.progressSheet.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  if (value === undefined || value === null || value === '') {
    throw Object.assign(
      new Error('Trebuie să introduci o valoare pentru a salva progresul.'),
      { code: 'EMPTY_VALUE' }
    );
  }
  const numericValue = parseFloat(value);
  if (isNaN(numericValue) || numericValue < 0) {
    throw Object.assign(
      new Error('Valoarea introdusă este invalidă. Introdu un număr pozitiv.'),
      { code: 'INVALID_VALUE' }
    );
  }

  return prisma.progressEntry.update({
    where: { id: entryId },
    data: { value: numericValue, notes: notes?.trim() || '' },
  });
};

const deleteProgressEntry = async (entryId, userId) => {
  const entry = await prisma.progressEntry.findUnique({
    where: { id: entryId },
    include: { progressSheet: true },
  });
  if (!entry) {
    throw Object.assign(new Error('Intrarea nu a fost găsită.'), { code: 'NOT_FOUND' });
  }
  if (entry.progressSheet.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }
  await prisma.progressEntry.delete({ where: { id: entryId } });
};

module.exports = {
  getProgressSheets,
  createProgressSheet,
  getProgressSheet,
  addProgressEntry,
  deleteProgressSheet,
  updateProgressEntry,
  deleteProgressEntry,
};
