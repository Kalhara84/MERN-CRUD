-- =====================================================================
--  Payroll System - Employee module  (PostgreSQL)
--  Create DB first:   CREATE DATABASE payroll_db;
--  Then run:          psql -U postgres -d payroll_db -f payroll_db.sql
--  Tables are taken from the old MySQL dump (ctecomco_prrbf.sql):
--    p_empmast, f_depmast, s_locmast, p_sysmast, a_sysmast, usdmast (login)
--  Only the columns used by the Employee Master screen are kept.
-- =====================================================================

DROP TABLE IF EXISTS usdmast CASCADE;
DROP TABLE IF EXISTS p_empmast CASCADE;
DROP TABLE IF EXISTS f_depmast CASCADE;
DROP TABLE IF EXISTS s_locmast CASCADE;
DROP TABLE IF EXISTS p_sysmast CASCADE;
DROP TABLE IF EXISTS a_sysmast CASCADE;

-- Locations
CREATE TABLE s_locmast (
  locsno  SERIAL PRIMARY KEY,
  locloc  VARCHAR(6) NOT NULL UNIQUE,
  locnam  VARCHAR(50)
);

-- Departments
CREATE TABLE f_depmast (
  depsno  SERIAL PRIMARY KEY,
  depdep  VARCHAR(6) NOT NULL UNIQUE,
  depdes  VARCHAR(30)
);

-- System master: sysrtp 200 = Basis, 260 = Cost Center, 261 = Section
CREATE TABLE p_sysmast (
  syssno  SERIAL PRIMARY KEY,
  sysrtp  INTEGER NOT NULL,
  sysrno  VARCHAR(10) NOT NULL,
  sysdes  VARCHAR(40) NOT NULL,
  UNIQUE (sysrtp, sysrno)
);

-- Area master: sysrtp 202 = Area
CREATE TABLE a_sysmast (
  syssno  SERIAL PRIMARY KEY,
  sysrtp  INTEGER NOT NULL,
  sysrno  VARCHAR(10) NOT NULL,
  sysdes  VARCHAR(40) NOT NULL,
  UNIQUE (sysrtp, sysrno)
);

-- Users (login). Taken from the old table usdmast; the password is stored hashed (scrypt)
CREATE TABLE usdmast (
  usdsno     SERIAL PRIMARY KEY,
  usdusd     VARCHAR(20)  NOT NULL UNIQUE,   -- user name
  usdpwd     VARCHAR(200) NOT NULL,          -- password hash  (scrypt$salt$hash)
  usdnam     VARCHAR(50),                    -- full name
  usdmail    VARCHAR(40),
  usddes     VARCHAR(25),                    -- designation / role
  usdactive  CHAR(1) NOT NULL DEFAULT 'Y'
);

-- Employee master
CREATE TABLE p_empmast (
  empsno        SERIAL PRIMARY KEY,
  empeno        INTEGER NOT NULL UNIQUE,
  empinital     VARCHAR(20) NOT NULL DEFAULT '',
  empnam        VARCHAR(80) NOT NULL,
  empcat        VARCHAR(1)  NOT NULL DEFAULT 'W',
  empactflg     CHAR(1)     NOT NULL DEFAULT 'Y',
  empsts        VARCHAR(1)  NOT NULL DEFAULT '',
  empmapcode    INTEGER,
  emplocsno     INTEGER REFERENCES s_locmast(locsno)  ON DELETE SET NULL,
  empdepsno     INTEGER REFERENCES f_depmast(depsno)  ON DELETE SET NULL,
  empsecsno     INTEGER REFERENCES p_sysmast(syssno)  ON DELETE SET NULL,
  emparesno     INTEGER REFERENCES a_sysmast(syssno)  ON DELETE SET NULL,
  empcossno     INTEGER REFERENCES p_sysmast(syssno)  ON DELETE SET NULL,
  empbasisno    INTEGER REFERENCES p_sysmast(syssno)  ON DELETE SET NULL,
  empsal        DOUBLE PRECISION NOT NULL DEFAULT 0,
  empscgpcn     DOUBLE PRECISION NOT NULL DEFAULT 0,
  empepfyn      CHAR(1)     NOT NULL DEFAULT 'Y',
  empepfno      INTEGER     NOT NULL DEFAULT 0,
  emppayeyn     CHAR(1)     NOT NULL DEFAULT 'N',
  emptno        INTEGER     NOT NULL DEFAULT 0,
  empprl        DOUBLE PRECISION NOT NULL DEFAULT 0,
  emptax        DOUBLE PRECISION NOT NULL DEFAULT 0,
  empgin        DOUBLE PRECISION NOT NULL DEFAULT 0,
  emptin        VARCHAR(18) NOT NULL DEFAULT '',
  empcob        DOUBLE PRECISION NOT NULL DEFAULT 0,
  empmof        CHAR(1)     NOT NULL DEFAULT 'M',
  empidno       VARCHAR(20) NOT NULL DEFAULT '',
  emppasportno  VARCHAR(15) NOT NULL DEFAULT '',
  empdob        DATE,
  empmrdtst     CHAR(1)     NOT NULL DEFAULT '',
  empdesig      VARCHAR(60) NOT NULL DEFAULT '',
  empjoin       DATE,
  empleft       DATE,
  empbnkacno    VARCHAR(30) NOT NULL DEFAULT '',
  empbnkcode    VARCHAR(20) NOT NULL DEFAULT '',
  empbnkbranch  VARCHAR(20) NOT NULL DEFAULT '',
  empbnkid      VARCHAR(20) NOT NULL DEFAULT '',
  empad1        VARCHAR(40) NOT NULL DEFAULT '',
  empad2        VARCHAR(40) NOT NULL DEFAULT '',
  empad3        VARCHAR(40) NOT NULL DEFAULT '',
  empad4        VARCHAR(40) NOT NULL DEFAULT '',
  empemail      VARCHAR(40) NOT NULL DEFAULT '',
  emptel        VARCHAR(25) NOT NULL DEFAULT '',
  empanual      VARCHAR(4)  NOT NULL DEFAULT '',
  empcasal      VARCHAR(4)  NOT NULL DEFAULT '',
  empleuleu     VARCHAR(4)  NOT NULL DEFAULT '',
  empotflg      CHAR(1)     NOT NULL DEFAULT 'N',
  empnopflg     CHAR(1)     NOT NULL DEFAULT 'N',
  empattincflg  CHAR(1)     NOT NULL DEFAULT 'N',
  emplateflg    CHAR(1)     NOT NULL DEFAULT 'N',
  empnsatlflg   CHAR(1)     NOT NULL DEFAULT 'N'
);

-- same rule as the old PHP screen: map code must be unique (0 / NULL = not used)
CREATE UNIQUE INDEX uq_empmast_mapcode ON p_empmast (empmapcode)
  WHERE empmapcode IS NOT NULL AND empmapcode <> 0;
CREATE INDEX idx_empmast_name ON p_empmast (empnam);



-- ---------- login user ----------
-- user name: admin     password: 1234
INSERT INTO usdmast (usdusd, usdpwd, usdnam, usdmail, usddes) VALUES
  ('admin', 'scrypt$4a43737588225c3e41830ecd74156c9d$9c3bd4fb9dd243b640cae2e64e8abde31e436de579d12e0729faf044035a131628a6c3b1ad2ce82c4b2b8744cbbcc35b1d82d68aa3302187d7b9b97de000031d', 'Administrator', 'admin@example.com', 'Admin');

-- ---------- lookup data ----------

INSERT INTO s_locmast (locloc, locnam) VALUES
  ('HO','Head Office'),
  ('KDY','Kandy Branch'),
  ('GLE','Galle Branch');

INSERT INTO f_depmast (depdep, depdes) VALUES
  ('ACC','Accounts'),
  ('HR','Human Resources'),
  ('SAL','Sales'),
  ('PRD','Production'),
  ('IT','Information Technology'),
  ('LOG','Logistics');

INSERT INTO p_sysmast (sysrtp, sysrno, sysdes) VALUES
  (261,'S01','Administration'),
  (261,'S02','Operations'),
  (261,'S03','Finance'),
  (261,'S04','Marketing'),
  (260,'CC01','Cost Center 01'),
  (260,'CC02','Cost Center 02'),
  (260,'CC03','Cost Center 03'),
  (200,'B01','Monthly'),
  (200,'B02','Daily'),
  (200,'B03','Hourly');

INSERT INTO a_sysmast (sysrtp, sysrno, sysdes) VALUES
  (202,'A01','Colombo'),
  (202,'A02','Kandy'),
  (202,'A03','Galle'),
  (202,'A04','Kurunegala');


-- ---------- 30 sample employees (demo data) ----------

INSERT INTO p_empmast (empeno, empinital, empnam, empcat, empactflg, empsts, empmapcode, emplocsno, empdepsno, empsecsno, emparesno, empcossno, empbasisno, empsal, empepfyn, empepfno, emppayeyn, emptno, empmof, empidno, empdob, empmrdtst, empdesig, empjoin, empleft, empbnkacno, empbnkcode, empbnkbranch, empad1, empad2, empad3, empemail, emptel, empanual, empcasal, empleuleu, empotflg, empnopflg, empattincflg, emplateflg, empnsatlflg) VALUES
  (1001, 'N.B', 'Nimal Bandara', 'E', 'Y', 'A', 10001, 2, 2, 4, 4, 5, 8, 32000, 'Y', 1001, 'N', 0, 'M', '197615032582', '1976-06-19', 'Y', 'HR Executive', '2012-09-07', NULL, '22175294', '7010', 'Galle', 'No 109', 'Temple Road', 'Colombo', 'nimal.bandara@example.com', '0722037872', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1002, 'S.D', 'Sunil Dissanayake', 'E', 'Y', 'A', 10002, 2, 5, 1, 3, 7, 8, 38000, 'Y', 1002, 'N', 0, 'M', '197229361589', '1972-09-28', 'Y', 'Software Engineer', '2014-05-14', NULL, '23831903', '7083', 'Galle', 'No 147', 'Main Street', 'Galle', 'sunil.dissanayake@example.com', '0712053424', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1003, 'K.D', 'Kamal Dissanayake', 'E', 'Y', 'A', 10003, 3, 1, 2, 2, 5, 8, 52000, 'Y', 1003, 'N', 0, 'M', '199750234045', '1997-06-15', 'N', 'Accountant', '2021-08-12', NULL, '80490681', '7010', 'Kandy', 'No 225', 'Lake Road', 'Kurunegala', 'kamal.dissanayake@example.com', '0752228106', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1004, 'S.S', 'Saman Silva', 'E', 'Y', 'A', 10004, 2, 5, 3, 3, 7, 8, 95000, 'Y', 1004, 'Y', 2, 'M', '199120418044', '1991-03-16', 'N', 'Software Engineer', '2018-01-22', NULL, '87832216', '7083', 'Kandy', 'No 18', 'Temple Road', 'Galle', 'saman.silva@example.com', '0762090518', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1005, 'R.P', 'Ruwan Perera', 'W', 'Y', 'A', 10005, 3, 6, 2, 1, 6, 8, 34000, 'Y', 1005, 'N', 0, 'M', '198871967692', '1988-12-13', 'Y', 'Driver', '2022-06-01', NULL, '48578460', '7056', 'Colombo', 'No 190', 'Main Street', 'Kurunegala', 'ruwan.perera@example.com', '0769330000', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1006, 'C.S', 'Chaminda Silva', 'S', 'Y', 'A', 10006, 2, 2, 4, 2, 5, 8, 65000, 'Y', 1006, 'Y', 1, 'M', '198765740154', '1987-03-27', 'Y', 'HR Executive', '2018-09-09', NULL, '30306925', '7056', 'Colombo', 'No 169', 'Main Street', 'Colombo', 'chaminda.silva@example.com', '0764059205', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1007, 'N.W', 'Nuwan Wickramasinghe', 'E', 'N', 'L', 10007, 1, 3, 1, 4, 7, 8, 52000, 'Y', 1007, 'N', 0, 'M', '199379188088', '1993-10-19', 'N', 'Sales Executive', '2017-03-23', '2025-11-22', '63428001', '7083', 'Kandy', 'No 101', 'Temple Road', 'Kurunegala', 'nuwan.wickramasinghe@example.com', '0787718312', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1008, 'D.P', 'Dilshan Perera', 'E', 'Y', 'A', 10008, 1, 2, 2, 1, 6, 8, 52000, 'Y', 1008, 'N', 0, 'M', '198010031310', '1980-02-11', 'Y', 'HR Executive', '2021-01-04', NULL, '19437596', '7083', 'Colombo', 'No 158', 'Station Road', 'Kandy', 'dilshan.perera@example.com', '0785232182', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1009, 'P.B', 'Priyantha Bandara', 'S', 'Y', 'A', 10009, 2, 5, 1, 3, 7, 8, 32000, 'Y', 1009, 'N', 0, 'M', '197721527244', '1977-08-15', 'N', 'Software Engineer', '2019-08-10', NULL, '74239549', '7010', 'Galle', 'No 42', 'Temple Road', 'Kandy', 'priyantha.bandara@example.com', '0777069199', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1010, 'L.F', 'Lasantha Fernando', 'W', 'Y', 'A', 10010, 3, 6, 2, 3, 7, 8, 30000, 'Y', 1010, 'N', 0, 'M', '197532420002', '1975-12-28', 'Y', 'Driver', '2016-09-12', NULL, '42130069', '7056', 'Kandy', 'No 190', 'Main Street', 'Kandy', 'lasantha.fernando@example.com', '0779267507', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1011, 'K.B', 'Kumari Bandara', 'W', 'Y', 'A', 10011, 1, 6, 3, 3, 5, 8, 30000, 'Y', 1011, 'N', 0, 'F', '200070025882', '2000-05-07', 'Y', 'Driver', '2023-10-12', NULL, '40446731', '7083', 'Kandy', 'No 51', 'Lake Road', 'Kandy', 'kumari.bandara@example.com', '0761032016', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1012, 'N.G', 'Nadeesha Gunawardena', 'W', 'Y', 'A', 10012, 2, 6, 3, 1, 7, 9, 24000, 'Y', 1012, 'N', 0, 'F', '199468240437', '1994-12-25', 'N', 'Driver', '2015-08-06', NULL, '63873226', '7083', 'Galle', 'No 243', 'Temple Road', 'Kandy', 'nadeesha.gunawardena@example.com', '0723131350', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1013, 'S.P', 'Sanduni Perera', 'S', 'Y', 'A', 10013, 3, 2, 2, 1, 5, 8, 95000, 'Y', 1013, 'Y', 3, 'F', '197957030900', '1979-10-27', 'Y', 'HR Executive', '2021-08-22', NULL, '80676511', '7010', 'Galle', 'No 240', 'Main Street', 'Kurunegala', 'sanduni.perera@example.com', '0724540702', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1014, 'D.P', 'Dilani Perera', 'S', 'Y', 'A', 10014, 1, 3, 3, 4, 7, 8, 65000, 'Y', 1014, 'Y', 3, 'F', '198527592411', '1985-10-11', 'N', 'Sales Executive', '2016-09-14', NULL, '77330181', '7010', 'Colombo', 'No 137', 'Main Street', 'Colombo', 'dilani.perera@example.com', '0764072040', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1015, 'A.D', 'Anusha Dissanayake', 'E', 'Y', 'A', 10015, 1, 1, 4, 1, 7, 8, 38000, 'Y', 1015, 'N', 0, 'F', '200053752583', '2000-10-24', 'Y', 'Accountant', '2013-09-02', NULL, '43352343', '7083', 'Colombo', 'No 71', 'Temple Road', 'Colombo', 'anusha.dissanayake@example.com', '0778586253', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1016, 'M.S', 'Malini Senanayake', 'S', 'Y', 'A', 10016, 1, 1, 4, 2, 7, 8, 45000, 'Y', 1016, 'N', 0, 'F', '200270712824', '2002-10-17', 'N', 'Accountant', '2015-12-09', NULL, '85096671', '7083', 'Colombo', 'No 216', 'Station Road', 'Kandy', 'malini.senanayake@example.com', '0763040477', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1017, 'I.R', 'Ishara Rajapaksha', 'W', 'Y', 'A', 10017, 2, 4, 3, 2, 6, 8, 27500, 'Y', 1017, 'N', 0, 'F', '199726421523', '1997-02-07', 'N', 'Machine Operator', '2022-05-26', NULL, '39472579', '7010', 'Galle', 'No 244', 'Temple Road', 'Kurunegala', 'ishara.rajapaksha@example.com', '0763731249', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1018, 'T.J', 'Thilini Jayasinghe', 'S', 'Y', 'A', 10018, 3, 2, 3, 1, 6, 8, 65000, 'Y', 1018, 'Y', 3, 'F', '199522374072', '1995-06-14', 'N', 'HR Executive', '2015-06-11', NULL, '69117285', '7083', 'Galle', 'No 5', 'Station Road', 'Galle', 'thilini.jayasinghe@example.com', '0775956897', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1019, 'C.S', 'Chathurika Senanayake', 'E', 'Y', 'A', 10019, 1, 1, 3, 4, 5, 8, 32000, 'Y', 1019, 'N', 0, 'F', '197527388652', '1975-05-09', 'N', 'Accountant', '2012-03-09', NULL, '53895707', '7056', 'Colombo', 'No 72', 'Temple Road', 'Kandy', 'chathurika.senanayake@example.com', '0762214906', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1020, 'H.W', 'Hasini Wickramasinghe', 'E', 'N', 'L', 10020, 3, 1, 4, 3, 7, 8, 95000, 'Y', 1020, 'Y', 1, 'F', '198626331285', '1986-02-20', 'Y', 'Accountant', '2015-02-09', '2025-01-11', '80721337', '7056', 'Galle', 'No 62', 'Temple Road', 'Kandy', 'hasini.wickramasinghe@example.com', '0751845231', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1021, 'P.F', 'Pradeep Fernando', 'S', 'Y', 'A', 10021, 2, 2, 1, 3, 5, 8, 65000, 'Y', 1021, 'Y', 1, 'M', '198346308897', '1983-05-15', 'Y', 'HR Executive', '2020-11-06', NULL, '77867728', '7056', 'Galle', 'No 49', 'Station Road', 'Kandy', 'pradeep.fernando@example.com', '0762783105', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1022, 'A.R', 'Asanka Rajapaksha', 'W', 'Y', 'A', 10022, 2, 6, 4, 3, 5, 8, 30000, 'Y', 1022, 'N', 0, 'M', '198395359381', '1983-04-11', 'Y', 'Driver', '2015-12-24', NULL, '19492255', '7010', 'Galle', 'No 190', 'Lake Road', 'Kurunegala', 'asanka.rajapaksha@example.com', '0721929476', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1023, 'J.S', 'Janaka Silva', 'W', 'Y', 'A', 10023, 2, 6, 3, 3, 6, 9, 27500, 'Y', 1023, 'N', 0, 'M', '198869837566', '1988-01-15', 'Y', 'Driver', '2014-03-09', NULL, '14623360', '7010', 'Kandy', 'No 56', 'Lake Road', 'Kandy', 'janaka.silva@example.com', '0716625950', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1024, 'B.R', 'Buddhika Rajapaksha', 'S', 'Y', 'A', 10024, 2, 1, 2, 4, 7, 8, 65000, 'Y', 1024, 'Y', 1, 'M', '198245456120', '1982-04-17', 'N', 'Accountant', '2024-01-03', NULL, '13019113', '7010', 'Kandy', 'No 78', 'Main Street', 'Colombo', 'buddhika.rajapaksha@example.com', '0779878327', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1025, 'G.F', 'Gayan Fernando', 'W', 'Y', 'A', 10025, 3, 6, 4, 2, 7, 8, 30000, 'Y', 1025, 'N', 0, 'M', '200129428313', '2001-03-10', 'Y', 'Driver', '2023-10-21', NULL, '21420815', '7010', 'Colombo', 'No 11', 'Main Street', 'Galle', 'gayan.fernando@example.com', '0717318605', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1026, 'S.G', 'Sachini Gunawardena', 'E', 'Y', 'A', 10026, 1, 5, 1, 1, 7, 8, 78000, 'Y', 1026, 'Y', 3, 'F', '198519410210', '1985-08-09', 'N', 'Software Engineer', '2012-08-26', NULL, '43848842', '7083', 'Colombo', 'No 217', 'Lake Road', 'Kandy', 'sachini.gunawardena@example.com', '0784442978', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1027, 'M.J', 'Madhavi Jayasinghe', 'W', 'Y', 'A', 10027, 3, 6, 2, 1, 7, 8, 34000, 'Y', 1027, 'N', 0, 'F', '199416274341', '1994-02-16', 'N', 'Driver', '2022-05-25', NULL, '44083287', '7083', 'Galle', 'No 191', 'Lake Road', 'Kandy', 'madhavi.jayasinghe@example.com', '0719093676', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1028, 'R.P', 'Rasika Perera', 'W', 'Y', 'A', 10028, 2, 4, 1, 2, 6, 8, 27500, 'Y', 1028, 'N', 0, 'M', '200172531718', '2001-05-23', 'N', 'Machine Operator', '2020-05-15', NULL, '12349408', '7056', 'Kandy', 'No 118', 'Temple Road', 'Kurunegala', 'rasika.perera@example.com', '0757490238', '14', '7', '0', 'Y', 'Y', 'N', 'N', 'N'),
  (1029, 'T.J', 'Tharaka Jayasinghe', 'E', 'Y', 'A', 10029, 1, 2, 3, 2, 6, 8, 38000, 'Y', 1029, 'N', 0, 'M', '198647522967', '1986-06-05', 'N', 'HR Executive', '2021-11-17', NULL, '62892592', '7010', 'Colombo', 'No 41', 'Temple Road', 'Kurunegala', 'tharaka.jayasinghe@example.com', '0788562502', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N'),
  (1030, 'M.R', 'Menaka Rajapaksha', 'E', 'Y', 'A', 10030, 3, 3, 4, 1, 5, 8, 52000, 'Y', 1030, 'N', 0, 'F', '199253560039', '1992-07-11', 'Y', 'Sales Executive', '2013-06-01', NULL, '48900721', '7056', 'Kandy', 'No 96', 'Temple Road', 'Kurunegala', 'menaka.rajapaksha@example.com', '0762281790', '14', '7', '0', 'N', 'Y', 'N', 'N', 'N');


-- keep the SERIAL counters in step after explicit inserts
SELECT setval(pg_get_serial_sequence('p_empmast','empsno'), (SELECT MAX(empsno) FROM p_empmast));
