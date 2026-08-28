-- BeadForge Database Initialization Script
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure user has full permissions on public schema
GRANT ALL ON SCHEMA public TO beadforge;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO beadforge;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO beadforge;
