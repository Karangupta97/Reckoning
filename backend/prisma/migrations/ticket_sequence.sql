-- Ticket number sequence for the Ticket system.
-- Used by the authority-assignment worker to generate unique ticket numbers.
-- Format: TKT-{YYYY}-{6-digit-zero-padded-seq}
--
-- Run manually against the database:
--   psql $DATABASE_URL -f prisma/migrations/ticket_sequence.sql

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;
