import React from "react";
import {object, string} from "yup";
import {Screen, Form, i18n} from "@amira/ui";

export default function AdminLoginForm({
	className = 'admin-login-form',
	title
}) {
	const fields = [
		{
			name: 'email',
			type: 'email',
			label: i18n('Email Address')
		},
		{
			name: 'pwd',
			type: 'password',
			label: i18n('Password')
		}
	];

	const onSubmit = (values, action) => {
		action.setAlert({
			type: 'progress',
			message: i18n('Validating...')
		});

		console.log(Screen.CurrentUser);
	}

	const initial = {email: '', pwd: ''};
	const validator = object({
		email: string()
			.required(i18n('Email is required!'))
			.email(i18n('Invalid email address!')),
		pwd: string()
			.required(i18n('Enter password!'))
	})

	return (
		<Form
			title = {title}
			className = {className}
			fields = {fields}
			templateId = {'/admin/template/login-form'}
			submitLabel = {i18n('Login')}
			onSubmit = {onSubmit}
			initialValues = {initial}
			validationSchema = {validator}
		/>
	)
}