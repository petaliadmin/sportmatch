-- liquibase formatted sql

-- changeset sportmatch:003-message-sender-name
alter table message add column sender_name varchar(120);
-- rollback alter table message drop column sender_name;
