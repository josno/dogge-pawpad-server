CREATE TYPE note_type AS ENUM ('medical', 'additional', 'archive', 'adoption');

CREATE TABLE notes (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  date_created TIMESTAMP NOT NULL DEFAULT now(),
  notes TEXT,
  type_of_note note_type,
  dog_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL,
  note_updated_by TEXT
);
