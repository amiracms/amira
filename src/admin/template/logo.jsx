import React from "react";
import {Screen, renderElement} from "@amira/ui";

export default function AdminLogo({
	className = 'admin-logo',
	defaultSrc,
	templateId,
	children
}) {
	const name = Screen.setting('name')||Screen.config('name');
	const tagline = Screen.setting('tagline')||Screen.config('tagline')

	return renderElement(
		{
			templateId: templateId||'/admin/template/logo',
			defaultTemplateId: '/template/logo',
			children
		},
		{
			className,
			name,
			tagline,
			homeUrl: '/admin',
			src: Screen.setting('logo')||defaultSrc||'/admin/logo.png'
		}
	)
}