-- Rename roles: SUPERVISOR -> KABAG, AGENT -> KOORDINATOR, USER -> STAFF
-- Permission dan relasi tidak berubah; kolom role hanya menyimpan TEXT di SQLite.
UPDATE "User" SET "role" = 'KABAG' WHERE "role" = 'SUPERVISOR';
UPDATE "User" SET "role" = 'KOORDINATOR' WHERE "role" = 'AGENT';
UPDATE "User" SET "role" = 'STAFF' WHERE "role" = 'USER';
