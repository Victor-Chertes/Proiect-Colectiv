const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';

const getFolders = async (userId) => {
  return prisma.photoFolder.findMany({
    where: { userId },
    include: { _count: { select: { photos: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

const createFolder = async (userId, name) => {
  const existing = await prisma.photoFolder.findFirst({
    where: { userId, name: name.trim() },
  });
  if (existing) {
    throw Object.assign(new Error('Ai deja un folder cu acest nume.'), { code: 'DUPLICATE_NAME' });
  }
  return prisma.photoFolder.create({
    data: { name: name.trim(), userId },
  });
};

const getFolderPhotos = async (folderId, userId) => {
  const folder = await prisma.photoFolder.findUnique({
    where: { id: folderId },
    include: { photos: { orderBy: { uploadedAt: 'desc' } } },
  });
  if (!folder) {
    throw Object.assign(new Error('Folderul nu a fost găsit.'), { code: 'NOT_FOUND' });
  }
  if (folder.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }
  return folder;
};

const processPhoto = async (folderId, userId, file) => {
  const folder = await prisma.photoFolder.findUnique({ where: { id: folderId } });
  if (!folder) {
    fs.unlink(file.path, () => {});
    throw Object.assign(new Error('Folderul nu a fost găsit.'), { code: 'NOT_FOUND' });
  }
  if (folder.userId !== userId) {
    fs.unlink(file.path, () => {});
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  try {

    return await prisma.photo.create({
      data: {
        filename: file.filename,
        url: `/uploads/${file.filename}`,
        folderId,
        userId,
      },
    });
  } catch (err) {

    fs.unlink(file.path, () => {});
    throw err;
  }
};


const deletePhoto = async (photoId, userId) => {
  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) {
    throw Object.assign(new Error('Poza nu a fost găsită.'), { code: 'NOT_FOUND' });
  }
  if (photo.userId !== userId) {
    throw Object.assign(new Error('Acces interzis.'), { code: 'FORBIDDEN' });
  }

  await prisma.photo.delete({ where: { id: photoId } });

  const filePath = path.join(UPLOAD_PATH, photo.filename);
  fs.unlink(filePath, () => {});
};

module.exports = { getFolders, createFolder, getFolderPhotos, processPhoto, deletePhoto };
