"use strict";

const _ = require('underscore');
const Server = require('./server');
const {i18n} = require('./lang');
const {
	setError, 
	generateHashKey, 
	isHashKey,
	serialize,
	unserialize,
	toSlug
} = require('./utils');

/**
 * Creates new user base on the supplied data.
 * 
 * @param {string} email
 * 		Required. The user's email address.
 * @param {string} pass
 * 		Required. The human readable password.
 * @param {string} status
 * 		The user status to set for the user.
 * @param {int} group
 * 		The id of the group where the user belongs to.
 * @return {Promise<[Error, Int]>}
 **/
exports.create_user = async function({
	portrait,
	email,
	pass,
	group,
	status = 'pending'
}) {
	if (!email) {
		return [setError(i18n('Email is required!'), 'required_email')];
	}

	// Check duplicate
	const [, oldUser] = await exports.get_user_by('email', email);

	if (oldUser && oldUser.Id) {
		return [setError(i18n('Email already exist!'), 'email_exist')];
	}

	// Generate password
	const [err, hash] = await generateHashKey(pass);

	if (err) {
		return [err];
	}

	const [err2, res] = await Server.db.insert(
		'users',
		{
			portrait,
			email,
			pass: hash,
			group,
			status
		}
	);

	if (err2) {
		return [err2];
	}

	const Id = res.insertId;

	/**
	 * Triggered whenever a new user is created.
	 * 
	 * @param {int} Id
	 * 	The id of the user newly created.
	 **/
	await Server.trigger('user/created', Id);

	return [null, Id];
}

/**
 * Updates user's data.
 * 
 * @param {int} Id
 * 	Required. The id of the user to update the data to.
 * @param {string} portrait
 * 	The relative location of the user's unique portrait.
 * @param {string} email
 * 	The new email address of the user.
 * @param {string} status
 * 	The user's current status.
 * @param {string} group
 * 	The new group name to which user belongs to.
 * @return {Promise<[Error, Int]>}
 **/
exports.update_user = async function({
	Id,
	portrait,
	email,
	pass,
	status,
	group
}) {
	const [, user] = await exports.get_user(Id);

	if (!user || !user.Id) {
		return [setError(i18n('User does not exist!'), 'not_exist')];
	}

	if (email && email !== user.email) {
		const [, otherUser] = await exports.get_user_by('email', email);

		if (otherUser && otherUser.Id) {
			return [setError(i18n('Email already exist!'), 'email_exist')];
		}
	}

	const data = _.pick({
		Id,
		portrait,
		email,
		pass,
		status,
		group
	}, v => !!v);

	if (data.pass && !isHashKey(pass)) {
		const [, hash] = await generateHashKey(pass);

		data.pass = hash;
	}

	const [err] = await Server.db.update(
		'users',
		data,
		{Id}
	);

	if (err) {
		return [err];
	}

	/**
	 * Triggered whenever user data is updated.
	 * 
	 * @param {int} Id
	 * 	The id of the user being updated.
	 **/
	await Server.trigger('user/updated', Id);

	return [null, Id];
}

/**
 * Get user data base on the given column name and it's corresponding value.
 * 
 * @param {string} column
 * 	The name of column to match to.
 * @param {*} value
 * 	The corresponding value of the given column name.
 * @return {Promise<[Error, Int]>}
 **/
exports.get_user_by = async function(column, value) {
	return Server.db.get_row('users', {[column]: value});
}

/**
 * Get user data base on the given id.
 * 
 * @param {int} Id
 * 	The id of the user to get the data to.
 * @return {Promise<[Error, Object]>}
 **/
exports.get_user = function(Id) {
	return exports.get_user_by('Id', Id);
}

/**
 * Get users from the database.
 * 
 * @param {string} field
 * 	The user data field to retrieve to. Default is all.
 * @param {string} search
 * 	A search term to use as the basis for filtering the result.
 * @param {string} group
 * 	The group to which the users belongs to.
 * @param {array<string>} groupIn
 * 	The list of user group to which users belongs to.
 * @param {array<string>} groupNotIn
 * 	The list of user group to which the users does not belong to.
 * @param {array<int>} exclude
 * 	The list of user id to exclude in the result.
 * @param {array<int>} include
 * 	The list of user id to include in the result.
 * @param {string} status
 * 	The status of the user to base from when filtering the result.
 * @param {array<string>} statusIn
 * 	The list of user statuses to base the query from.
 * @param {string} orderBy
 * 	The name of the column to sort the result.
 * @param {string} order
 * 	Whether the return result sorted in ascending or descending order.
 * @param {int} page
 * 	The page number to which the query will start.
 * @param {int} perPage
 * 	The number of items to return to.
 * @return {Promise<[Error, Array]>}
 **/
exports.get_users = async function({
	field = "*",
	search,
	group,
	groupIn,
	groupNotIn,
	exclude,
	include,
	status,
	statusIn,
	orderBy = "email",
	order = "asc",
	page = 1,
	perPage
}) {
	const where = {};

	if (search) {
		// todo: get Id from user meta

		where.email = {$like: `*${search}`};
	}

	if (group) {
		where.group = group;
	} else if (groupIn) {
		where.group = {$in: groupIn};
	} else if (groupNotIn) {
		where.group = {$notIn: groupNotIn};
	}

	if (exclude) {
		where.Id = {$notIn: exclude};
	}

	if (include) {
		where.Id = {$in: include};
	}

	if (status) {
		where.status = status;
	} else if (statusIn) {
		where.status = {$in: statusIn};
	}

	return Server.db.get({
		table: 'users',
		columns: field,
		where: !_.isEmpty(where) ? where : undefined,
		orderBy: {[orderBy]: order},
		page,
		perPage
	});
}

/**
 * Delete user from the database.
 * 
 * @param {int} Id
 * 	The id of the user to delete to.
 * @return {Promise<[Error, Boolean]>}
 **/
exports.delete_user = async function(Id) {
	const [err, user] = await exports.get_user(Id);

	if (err || !user || !user.Id) {
		return [setError(i18n('User does not exist!'), 'not_exist')];
	}

	const [err2] = await Server.db.delete('users', {Id});

	if (err2) {
		return [err2];
	}

	/**
	 * Triggered whenever user is deleted from the database.
	 * 
	 * @param {int} Id
	 * 	The id of the user deleted to.
	 * @param {object} user
	 * 	The old data of the deleted user.
	 **/ 
	await Server.trigger('user/deleted', Id, user);

	return [null, true];
}

/**
 * Sets or update user's meta data.
 * 
 * @param {int} userId
 * 	The id of the user to attached the meta data to.
 * @param {string} name
 * 	The name of the meta data.
 * @param {*} value
 * 	The corresponding value of the given meta name.
 * @return {Promise<[Error, Boolean]>}
 **/
exports.set_user_meta = async function(userId, name, value) {
	// Check if meta already exist
	const [, meta] = await Server.db.get_row('usermeta',{userId, name});

	if (meta && meta.userId) {
		// Update instead
		const [err] = await Server.db.update(
			'usermeta',
			{userId, name, value: serialize(value)}
			);

		return [err, !err];
	}

	const [err2] = await Server.db.insert(
		'usermeta',
		{userId, name, value: serialize(value)}
		);

	return [err2, !err2];
}

/**
 * Removes user meta from the database.
 * 
 * @param {int} userId
 * 	The id of the user to remove the meta data at.
 * @param {string} name
 * 	The name of the meta data to remove to.
 * @return {Promise<[Error, Boolean]>}
 **/
exports.unset_user_meta = async function(userId, name) {
	const[err] = await Server.db.delete('usermeta', {userId, name});

	return [err, !err];
}

/**
 * Get user meta data from the database.
 * 
 * @param {int} userId
 * 	The id of the user to retrieve the meta data at.
 * @param {string} name
 * 	Optional. The name of the meta data to get to. If omitted, will return
 * 	all meta data of the given user id.
 * @return {*}
 **/
exports.get_user_meta = async function(userId, name) {
	if (name) {
		// Just return the meta value
		const value = await Server.db.get_var('usermeta', 'value', {userId});

		return value && unserialize(value);
	}

	const [, meta = []] = await Server.db.get({
		table: 'usermeta',
		where: {userId}
	});

	return meta
		.reduce(
			(d, {name, value}) => {
				d[name] = unserialize(value);

				return d;
			},
			{}
		)
}

/**
 * Create or update user group.
 * 
 * @param {int} Id
 * 	The id of the group to update to.
 * @param {string} name
 * 	The human readable name of the group.
 * @param {string} description
 * 	A short description describing what the group is about.
 * @param {array<string>} caps
 * 	The list of capabilities a group may have.
 * @return {Promise<[Error, Int]>}
 **/
exports.set_user_group = async function({
	Id,
	name,
	description,
	caps = []
}) {
	const group = _.pick({
		Id,
		name,
		slug: toSlug(name),
		description,
		caps: serialize(caps)
	}, v => !!v);

	if (!Id) {
		const [err, res] = await Server.db.insert('usergroup', group);

		return [err, res && res.insertId];
	}

	const [, data] = await exports.get_user_group(Id);

	if (!data) {
		return [setError(i18n('User group does not exist!'), 'not_exist')];
	}

	const [err2] = await Server.db.update(
		'usergroup',
		group,
		{Id}
	);

	if (err2) {
		return [err2];
	}

	/**
	 * Triggered whenever a user group data is updated.
	 * 
	 * @param {object} group
	 * 	The new user group data properties.
	 * @param {object} data
	 * 	The group data properties prior to update.
	 **/
	await Server.trigger('usergroup/updated', group, data);

	return [null, Id];
}

/**
 * Get user group data by the given group slug.
 * 
 * @param {string} slug
 * 	The unique slug of the group.
 * @return {Promise<[Error, Object]>}
 **/
exports.get_group_by_slug = async function(slug) {
	const [err, group] = await Server.db.get_row('usergroup', {slug});

	if (group && group.caps) {
		group.caps = unserialize(group.caps);
	}

	return [err, group];
}

/**
 * Get user group by id.
 * 
 * @param {int} Id
 * 	The id of the group to get to.
 * @return {Promise<[Error, Object]>}
 **/
exports.get_user_group = async function(Id) {
	const [err, group] = await Server.db.get_row('usergroup', {Id});

	if (group && group.caps) {
		group.caps = unserialize(group.caps);
	}

	return [err, group];
}

/**
 * Delete user group from the database.
 * 
 * @param {int} Id
 * 	The id of the group to delete to.
 * @param {string} action
 * 	A delete action or the name of the group to move the users
 * 	to.
 * @return {Promise<[Error, Boolean]>}
 **/
exports.delete_user_group = async function(Id, action) {
	const [, group] = await exports.get_user_group(Id);

	if (!group) {
		return [setError(i18n('User group does not exist!'), 'not_exist')];
	}

	const [err] = await Server.db.delete('usergroup', {Id});

	if (err) {
		return [err];
	}

	if (action) {
		// Get users
		const [, users = []] = await exports.get_users({field: 'Id', group: group.slug});
		const slug = toSlug(action);

		for(const {Id} of users) {
			if ('delete' === action) {
				await exports.delete_user(Id);

				continue;
			}

			await exports.update_user({Id, group: slug});
		}
	}

	/**
	 * Triggered whenever a user group is deleted from the database.
	 * 
	 * @param {object} group
	 * 	The data of the user group deleted at.
	 **/
	await Server.trigger('usergroup/deleted', group);

	return [null, true];
}

/**
 * Get all user group from the database.
 * 
 * @return {Promise<Array>}
 **/
exports.get_user_groups = async function() {
	const [, items = []] = await Server.db.get({table: 'usergroup'});

	// Always include administrator
	items.unshift({
		Id: 0,
		name: i18n('Administrator'),
		slug: 'administrator',
		caps: []
	});

	return items.map(
		item => {
			if (item.caps) {
				item.caps = unserialize(item.caps);
			}

			return item;
		})
}