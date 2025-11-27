-- Job Applications Data Export
-- Generated on Thu Sep 12 17:05:10 PM UTC 2025

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public.users (id, username, email, password, first_name, last_name, position, phone_number, role, employee_id, account_enabled, status, created_at, updated_at, organization_id, branch_id, date_of_birth, address, emergency_contact_name, emergency_contact_phone, profile_completed, profile_completion_percentage, trial_end_date, subscription_status, subscription_id) VALUES (1, 'Shehzad_6811', 'hr@themeetingmatters.com', '$2b$10$abcd1234567890abcd1234567890abcd1234567890', 'Shehzad ', 'Ahmad', 'HR Manager', '+92-300-1234567', 'hr_admin', 'EMP001', true, 'active', '2025-08-18 02:54:04.859264', '2025-08-18 02:54:04.859264', 1, 1, NULL, NULL, NULL, NULL, false, 0, NULL, NULL, NULL);
INSERT INTO public.users (id, username, email, password, first_name, last_name, position, phone_number, role, employee_id, account_enabled, status, created_at, updated_at, organization_id, branch_id, date_of_birth, address, emergency_contact_name, emergency_contact_phone, profile_completed, profile_completion_percentage, trial_end_date, subscription_status, subscription_id) VALUES (22, 'admin', 'admin@example.com', '$2b$10$CV.LjHuhfludM.0UZA0JXuUyUld5X2UnzO0eG.Cn4jUGN0c7v3bXm', 'Admin', 'User', 'System Administrator', '+92-300-9876543', 'hr_admin', 'ADMIN001', true, 'active', '2025-08-18 02:54:04.859264', '2025-08-18 02:54:04.859264', 1, 1, NULL, NULL, NULL, NULL, false, 0, NULL, NULL, NULL);
INSERT INTO public.users (id, username, email, password, first_name, last_name, position, phone_number, role, employee_id, account_enabled, status, created_at, updated_at, organization_id, branch_id, date_of_birth, address, emergency_contact_name, emergency_contact_phone, profile_completed, profile_completion_percentage, trial_end_date, subscription_status, subscription_id) VALUES (2, 'muhammad0lfc', 'meetingmattersofficial@gmail.com', '$2b$10$xyz7890xyz7890xyz7890xyz7890xyz7890xyz7890', 'Muhammad', '', 'Business Manager', '+92-321-7654321', 'hr_admin', 'EMP002', true, 'active', '2025-08-18 02:54:04.859264', '2025-08-18 02:54:04.859264', 1, 1, NULL, NULL, NULL, NULL, false, 0, '2025-09-15 00:00:00', 'trial', NULL);

--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

-- NOTE: This is a truncated version showing structure. Full file contains all 27 applications.
-- Copy the complete content from /tmp/production_data_import.sql for full import.