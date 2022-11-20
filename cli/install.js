"use strict";

const Server = require('../lib/server');

exports.install_mysql_tables = async function() {
	const db = Server.db;

	// Settings
	const [err] = await db.query(
		`CREATE TABLE IF NOT EXISTS ?? (
		\`name\` VARCHAR(60) NOT NULL PRIMARY KEY,
		\`value\` LONGTEXT
		)`,
		[db.table_name('settings')]
	);

	if (err) {
		db.close();

		throw err;
	}

	// Users
	const user = db.table_name('users');
	const [err2] = await db.query(
		`CREATE TABLE IF NOT EXISTS ?? (
		\`Id\` BIGINT(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,
		\`portrait\` VARCHAR(160),
		\`pass\` VARCHAR(160) NOT NULL,
		\`email\` VARCHAR(60) NOT NULL UNIQUE,
		\`status\` VARCHAR(20),
		\`group\` VARCHAR(20),
		\`created\` DATETIME DEFAULT CURRENT_TIMESTAMP,
		\`updated\` DATETIME ON UPDATE CURRENT_TIMESTAMP,
		INDEX (\`Id\`, \`email\`)
		)`, 
		[user]
	);

	if (err2) {
		db.close();

		throw err2;
	}

	// User meta
	const meta = db.table_name('usermeta');
	const [err3] = await db.query(
		`CREATE TABLE IF NOT EXISTS ?? (
		\`userId\` BIGINT(20) NOT NULL,
		\`name\` VARCHAR(60) NOT NULL,
		\`value\` LONGTEXT,
		FOREIGN KEY (\`userId\`) 
			REFERENCES ${user}(\`Id\`) ON DELETE CASCADE
		)`,
		[meta]
	);

	if (err3) {
		db.close();

		throw err3;
	}

	/**
	const [err4] = await db.query(
		`CREATE TABLE IF NOT EXISTS ?? (
		\`userId\` BIGINT(20) NOT NULL,
		\`sessionId\` VARCHAR(100) NOT NULL,
		\`platform\` VARCHAR(255),
		\`status\` VARCHAR(10) NOT NULL,
		\`date\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		FOREIGN KEY (\`userId\`) 
			REFERENCES ${user}(\`Id\`) ON DELETE CASCADE
		)`,
		[db.table_name('user_session')]
	);

	if (err4) {
		db.close();

		throw err4;
	}
	**/

	// Page
	const [err5] = await db.query(
		`CREATE TABLE IF NOT EXISTS ?? (
		\`Id\` BIGINT(20) NOT NULL PRIMARY KEY AUTO_INCREMENT,
		\`group\` VARCHAR(30) NOT NULL,
		\`title\` VARCHAR(120) NOT NULL,
		\`description\` VARCHAR(255),
		\`slug\` VARCHAR(180) NOT NULL,
		\`status\` VARCHAR(20) DEFAULT 'pending',
		\`section\` LONGTEXT,
		\`created\` DATETIME DEFAULT CURRENT_TIMESTAMP,
		\`updated\` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)`, 
		[db.table_name('page')]
	);

	if (err5) {
		db.close();
		
		throw err5;
	}
}