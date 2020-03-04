BEGIN;

TRUNCATE
    shots, notes, users, dogs
    RESTART IDENTITY CASCADE;

INSERT INTO users (user_name, first_name, last_name, password)
VALUES 
('pawpad', 'Pawpad', 'User', '$2a$16$rBYHHZYgVMKK/H/x2Y6tj.1owlHRwipUiSAWszknOarfc.0i2IkGu'), --pawpad123---
('demo', 'Demo', 'User', '$2a$16$Xk4/wWunwDxM0oUnl5K3deciTTraDvEL1QRT13pWWxRwitup2exS2'); --password--

INSERT INTO dogs (dog_name, profile_img, age, gender, arrival_date, spayedneutered, updated_by)
VALUES 
('Winky', 'https://raw.githubusercontent.com/josno/pawpad-client/master/src/assets/Winky.jpg', '2 months', 'Male', '2019-10-19 14:23:00', true, 'Melanie'),
('Coska', 'https://raw.githubusercontent.com/josno/pawpad-client/master/src/assets/Coska.jpg', 'unknown', 'Female', '2019-7-28 12:00:00', false, 'Sarah');

INSERT INTO notes (notes, type_of_note, date_created, dog_id, note_updated_by, created_by)
VALUES 
('Winky needs to get his serum shots', 'medical', '2020-01-19 14:23:00', 1, 'Melanie', 1),
('Puppy; needs to be separated from adult dogs', 'additional', '2020-01-19 14:23:00', 1, 'Melanie', 1),
('Coska will get his Complex 2 shot in February', 'medical', '2020-01-19 14:23:00', 2, 'Sarah', 2),
('Coska is being considered for adoption', 'additional', '2020-01-02 14:23:00', 2, 'Sarah', 2);

INSERT INTO shots (shot_name, shot_iscompleted, dog_id)
VALUES 
('Rabies', true, 1),
('Complex I', true, 1),
('Complex II', true, 1),
('Serum', true, 1),
('Rabies', true, 2),
('Complex I', true, 2),
('Complex II', false , 2),
('Fungus', true, 2);

COMMIT;