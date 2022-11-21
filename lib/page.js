"use strict";

const _ = require('underscore');
const {i18n} = require('./lang');
const {
	toSlug,
	serialize,
	unserialize,
	setError
} = require('./utils');
const Server = require('./server');

/**
 * Create or update a page.
 * 
 * @param {int} Id
 * 	The id of the page to update to.
 * @param {string} group
 * 	The group which the page belongs to.
 * @param {string} title
 * 	The human readable title of the page.
 * @param {string} slug
 * 	Optional. The unique slug name of the page, use as
 * 	unique identifier in a url.
 * @param {string} status
 * 	The page status. Options are draft|pending|publish
 * @param {array} section
 * 	The page content.
 * @return {Promise<[Error, Int]>}
 **/
exports.set_page = async function({
	Id,
	group = 'page',
	title,
	slug,
	status = 'draft',
	section
}) {
	const page = _.pick({
		Id,
		group,
		title,
		slug: slug||title && toSlug(title),
		status,
		section: section && serialize(section)
	}, v => !!v);

	if (Id) {
		const [err, res] = await Server.db.update('page', page, {Id});

		return [err, res && Id];
	}

	const [err2, res2] = await Server.db.insert('page', page);

	return [err2, res2 && res2.insertId];
}

/**
 * Get the page by the given slug.
 * 
 * @param {string} slug
 * 	The unique page slug.
 * @return {Promise<[Error, Object]>}
 **/
exports.get_page_by_slug = function(slug) {
	return Server.db.get_row('page', {slug});
}

/**
 * Get page by the given id.
 * 
 * @param {int|string} Id
 * 	The id of the page to retrieve to.
 * @return {Promise<[Error, Object]>}
 **/
exports.get_page = function(Id) {
	return Server.db.get_row('page', {Id});
}

/**
 * Delete a page in the database.
 * 
 * @param {string|int} Id
 * 	The id of the page to delete to.
 * @return {Promise<[Error, Boolean]>}
 **/
exports.delete_page = async function(Id) {
	const [err] = await Server.db.delete('page', {Id});

	return [err, !err];
}

/**
 * Get the list of pages from the database.
 * 
 * @param {string|array} field
 * 	The column field to return to. Default is all columns.
 * @param {string} status
 * 	The status of the page to return to.
 * @param {array} statusIn
 * 	The list of page statuses to filter the results from.
 * @param {string} group
 * 	The name of the group the page belongs to.
 * @param {array<string>} groupIn
 * 	The list of group name use to filter the results from.
 * @param {string} orderBy
 * 	The column name to which to sort the result from.
 * @param {string} order
 * 	Whether to return the result in ascending or decending manner.
 * @param {int} page
 * 	The page number to base the query from.
 * @param {int} perPage
 * 	The number of items to return to.
 * @return {Promise<[Error, Array]>}
 **/
exports.get_pages = function({
	field = '*',
	status,
	statusIn,
	group,
	groupIn,
	orderBy,
	order,
	page = 1,
	perPage
}) {
	const where = _.pick({status, group}, v => !!v);

	if (statusIn) {
		where.status = {$in: statusIn};
	}

	if (groupIn) {
		where.group = {$in: groupIn};
	}

	return Server.db
		.get({
			table: 'page',
			columns: field,
			where: _.isEmpty(where) ? null : where,
			orderBy: orderBy ? {[orderBy]: order} : null,
			page,
			perPage
		});
}