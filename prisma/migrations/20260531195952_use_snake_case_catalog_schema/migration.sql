/*
  Warnings:

  - You are about to drop the `Album` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AlbumArtist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AlbumImportRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Artist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Track` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "album_status" AS ENUM ('importing', 'available', 'failed', 'blocked');

-- CreateEnum
CREATE TYPE "import_request_status" AS ENUM ('pending', 'processing', 'finished', 'failed');

-- DropForeignKey
ALTER TABLE "AlbumArtist" DROP CONSTRAINT "AlbumArtist_albumId_fkey";

-- DropForeignKey
ALTER TABLE "AlbumArtist" DROP CONSTRAINT "AlbumArtist_artistId_fkey";

-- DropForeignKey
ALTER TABLE "Track" DROP CONSTRAINT "Track_albumId_fkey";

-- DropTable
DROP TABLE "Album";

-- DropTable
DROP TABLE "AlbumArtist";

-- DropTable
DROP TABLE "AlbumImportRequest";

-- DropTable
DROP TABLE "Artist";

-- DropTable
DROP TABLE "Track";

-- DropEnum
DROP TYPE "AlbumStatus";

-- DropEnum
DROP TYPE "ImportRequestStatus";

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "release_date" TEXT,
    "total_tracks" INTEGER,
    "status" "album_status" NOT NULL DEFAULT 'importing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "spotify_id" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_artists" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,

    CONSTRAINT "album_artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "spotify_id" TEXT,
    "album_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "track_number" INTEGER,
    "duration_ms" INTEGER,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_import_requests" (
    "id" TEXT NOT NULL,
    "spotify_id" TEXT NOT NULL,
    "album_id" TEXT,
    "user_id" TEXT,
    "status" "import_request_status" NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_import_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "albums_spotify_id_key" ON "albums"("spotify_id");

-- CreateIndex
CREATE UNIQUE INDEX "artists_spotify_id_key" ON "artists"("spotify_id");

-- CreateIndex
CREATE UNIQUE INDEX "album_artists_album_id_artist_id_key" ON "album_artists"("album_id", "artist_id");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_spotify_id_key" ON "tracks"("spotify_id");

-- AddForeignKey
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
