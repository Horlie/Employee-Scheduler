
INSERT INTO "User" VALUES
(1, 'admin@example.com', '$2a$12$bGc.C1aMIViV00UPw4Megeqcf7PvB038TUFTtlYQgYgy3CeZAPDSy',  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 160, '{"nurse":{"08:00-16:00":{"Friday":1,"Monday":1,"Sunday":1,"Tuesday":1,"Saturday":1,"Thursday":1,"Wednesday":1}},"olderly":{"08:00-16:00":{"Friday":1,"Monday":1,"Sunday":1,"Tuesday":1,"Saturday":1,"Thursday":1,"Wednesday":1}}}'::jsonb);


INSERT INTO "Employee" VALUES
(1, 'Abigail Lopez', 'nurse', 1, 1,  'Female'),
(2, 'Daniel Lee', 'nurse', 1, 1,   'Male'),
(3, 'Emily Gonzalez', 'nurse', 1, 1,   'Female'),
(4, 'Matthew Harris', 'nurse', 1, 1,   'Male'),
(5, 'Elizabeth Clark', 'nurse', 1, 1,   'Female'),
(6, 'Joseph Hall', 'olderly', 1, 1,   'Male'),
(7, 'Victoria Allen', 'olderly', 1, 1,   'Female'),
(8, 'Samuel Young', 'olderly', 1, 1,   'Male'),
(9, 'Madison King', 'olderly', 1, 1,   'Female'),
(10, 'David Wright', 'olderly', 1, 1,   'Male'),
(11, 'Diana Miller', 'doctor', 1, 1,   'Female'),
(12, 'Charlie Brown', 'doctor', 1, 1,   'Male'),
(13, 'Daniil Rakitin', 'doctor', 1, 1,   'Male'),
(14, 'Olivia Garcia', 'nurse', 1, 1,   'Female'),
(15, 'James Martinez', 'olderly', 1, 1,   'Male');

INSERT INTO "Shift" VALUES
(1, 1, '08:00:00', '16:00:00', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], ARRAY['nurse', 'olderly'], false, '7', '12');
