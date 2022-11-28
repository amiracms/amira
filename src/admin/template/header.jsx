import React from "react";
import {useSelector} from "react-redux";
import {renderElement} from "@amira/ui";

/**
 * The wrapper use to display the administrative header.
 **/
export default function AdminHeader({
	type,
	templateId,
	children,
	className
}) {
	const {user} = useSelector(state => state.state);

	return renderElement(
		{
			templateId: templateId||`/admin/header/-${type}`,
			defaultTemplateId: '/admin/header',
			children
		},
		{
			className,
			user,
			homeUrl: '/admin'
		}
	)
}