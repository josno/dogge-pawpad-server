CREATE TABLE adoption (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  adoption_date TIMESTAMP NOT NULL DEFAULT now(),
  dog_id INTEGER REFERENCES dogs(id) ON DELETE SET NULL,
  adopter_name TEXT NOT NULL,
  adopter_email TEXT NOT NULL,
  adopter_phone TEXT,
  adopter_country TEXT NOT NULL,
  adopter_address TEXT,
  contract_img_url TEXT
);