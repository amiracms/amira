import React from "react";
import {
	Screen, 
	BrowserConfig, 
	i18n,
	addComponent,
	CurrentUser
} from "@amira/ui";
import initRoutes from "./routes";
import AdminHeader from "./template/header";
import AdminLogo from "./template/logo";
import AdminLoginForm from "./user/login-form";

// Set components
addComponent(<AdminHeader/>);
addComponent(<AdminLogo/>);
addComponent(<AdminLoginForm/>);

export function Browser(config, docRoot) {
	// Fetch configuration from the server
	Screen.gql({
		name: 'getConfig',
		args: {
			platform: {
				type: 'Object'
			}
		},
		fields: [
			'sessionId', 
			'templates',
			'error',
			'errorCode'
		],
		onSuccess: data => Screen.configure(data)
	});

	// Fetch settings from the server
	Screen.gql({
		name: 'getSettings',
		onSuccess: data => Screen.settings(data)
	});

	// Add Current user
	Screen.CurrentUser = new CurrentUser();
	Screen.gql(Screen.CurrentUser.query());

	// Set routes during initialization
	Screen.on('screen/init', initRoutes);

	return BrowserConfig(
		config,
		docRoot
	);
}