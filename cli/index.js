#!/usr/bin/env node

const [,f,cmd,...argsList] = process.argv;

switch(cmd) {
	case 'config' :
		return require('./config')(argsList[0]);

	case 'init' :
		return require('./init')();
}