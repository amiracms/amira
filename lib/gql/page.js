"use strict";

const _ = require('underscore');

exports.typeDef = `
type Page {
	Id: String
	title: String
	slug: String
	status: String
	section: Array
	group: String
	created: DateTime
	updated: DateTime
}

input PageInput {
	Id: String
	title: String
	slug: String
	status: String
	section: Array
	group: String
	created: DateTime
	updated: DateTime
}

type PageResult {
	items: [Page]
	totalItems: Int
	statusCount: Object
	groupCount: Object
}

extend type Query {
	getPages(
		status: String
		statusIn: Array
		group: String
		groupIn: Array
		orderBy: String
		order: String
		page: Int
		perPage: Int
	): PageResult
	getPage(Id: String slug: String): Page
}

extend type Mutation {
	setPage(input: PageInput): Page @user(cap: "edit-page")
	deletePage(Id: String!): Boolean @user(cap: "delete-page")
}
`;

exports.resolvers = {
	// Just return the arguments
	getPages: (args) => ({args}),

	PageResult: {
		async items({args}, __, {Server}) {
			const [err, items = []] = await Server.get_pages(args);

			return err||items;
		},

		async totalItems({args}, __, {Server}) {
			const _args = _.omit(args, 'page', 'perPage', 'orderBy');
			const [, items = []] = await Server.get_pages(_args);

			return items.length;
		},

		async statusCount(__, ___, {Server}) {
			const [, items = []] = await Server.get_pages({field: 'status'});

			return items
				.reduce(
					(s, {status}) => {
						if (!s[status]) {
							s[status] = 0;
						}

						s[status] += 1;

						return s;
					},
					{}
				)
		},

		async groupCount(__, ___, {Server}) {
			const [, items = []] = await Server.get_pages({field: 'group'});

			return items
				.reduce(
					(g, {group}) => {
						if (!g[group]) {
							g[group] = 0;
						}

						g[group] += 1;

						return g;
					},
					{}
				)
		}
	},

	async getPage({Id, slug}, {Server}) {
		// Id take precedence
		if (Id) {
			const [err, page] = await Server.get_page(Id);

			return err||page;
		}

		// Get by slug
		const [err2, page2] = await Server.get_page_by_slug(slug);

		return err2||page2;
	},

	async setPage({input}, {Server}) {
		const [err, pageId] = await Server.set_page(input);

		if (err) {
			return err;
		}

		const [err2, page] = await Server.get_page(pageId);

		return err2||page;
	},

	async deletePage({Id}, {Server}) {
		const [err] = await Server.delete_page(Id);

		return err||true;
	}
};