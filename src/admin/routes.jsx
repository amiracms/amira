import {Screen, i18n} from "@amira/ui";

export default function initRoutes() {
	const error = Screen.config('error');

	if (error) {
		const errorCode = Screen.config('errorCode');

		Screen.routePath({
			path: [
				'/admin',
				'/admin/(.*)'
			],
			typeNow: 'screen-error',
			pageNow: '/admin/' + errorCode.toLowerCase(),
			title: i18n('Error')
		});

		return;
	}

	// 404
	Screen.routePath({
		path: '/404',
		typeNow: '404',
		pageNow: '/admin/404',
		title: i18n('Page Not Found')
	});

	// Login
	Screen.routePath({
		path: '/login',
		typeNow: 'login',
		pageNow: '/admin/login',
		title: i18n('Login')
	});

	// Forgot password
	Screen.routePath({
		path: '/admin/forgot-password',
		typeNow: 'forgot-password',
		pageNow: '/admin/forgot-password',
		title: i18n('Forgot Password?')
	});

	// Dashboard
	Screen.routePath({
		path: '/admin',
		typeNow: 'dashboard',
		pageNow: '/admin/dashboard',
		user: 'login'
	});

	// Settings
	Screen.routePath({
		path: '/admin/settings',
		typeNow: 'settings',
		pageNow: '/admin/settings',
		title: i18n('Settings')
	});
}