"use strict";

const {setError, generateHashKey, decryptHashKey} = require('../utils');
const {i18n} = require('../lang');

exports.typeDef = `
directive @user(user: String perm: String) on OBJECT | FIELD_DEFINITION

type User {
	Id: String
	email: String
	group: String
	status: String
	portrait: String
	meta: Object
	created: DateTime
	updated: DateTime
}

input UserInput {
	Id: String
	email: String
	group: String
	status: String
	portrait: String
	pass: String
}

type UsersResult {
	items: [User]
	totalItems: Int
	groupCount: Object
	statusCount: Object
}

extend type Query {
	CurrentUser: User
	getUsers(
		search: String
		group: String
		groupIn: Array
		status: String
		statusIn: Array
		orderBy: String
		order: String
		page: Int
		perPage: Int
	): UsersResult
}

extend type Mutation {
	login(email: String pwd: String): User
	createUser(input: UserInput): User @user(user: "login" perm: "edit-users")
}
`;

exports.resolvers = {
	CurrentUser: (__, {Server}) => Server.currentUser,

	async login({email, pwd}, {Server}) {
		const [, user] = await Server.get_user_by('email', email);
		const invalid = setError(i18n('Mismatch email and/or password!'), 'invalid');

		if (!user) {
			return invalid;
		}

		const [, hash] = await decryptHashKey(user.pass);

		if (!hash || hash !== pwd) {
			return invalid;
		}

		// Only active user may logged in
		if ('active' !== user.status) {
			return invalid;
		}

		// Change session Id
		Server.sessionId = await Server.create_session_id(user.email);

		/**
		 * Triggered whenever a user successfully logged in.
		 * 
		 * @param {object} User
		 **/
		await Server.trigger('user/login', user);

		return user;
	},

	async createUser({input}, {Server}) {
		const [err, userId] = await Server.create_user(input);

		if (err) {
			return err;
		}

		const [err2, user] = await Server.get_user(userId);

		return err2||user;
	},

	// Just pass the arguments
	getUsers: args => ({args}),

	UsersResult: {
		async items({args}, __, {Server}) {
			const [, items = []] = await Server.get_users(args);

			return items;
		},

		async totalItems({args}, __, {Server}) {
			const {
				search,
				status,
				statusIn,
				group,
				groupIn
			} = args;

			const [, items = []] = await Server.get_users({
				field: 'Id',
				search,
				status,
				statusIn,
				group,
				groupIn
			});

			return items.length;
		},

		async groupCount(__, ___, {Server}) {
			const [err, items = []] = await Server.get_users({field: 'group'});

			return items
				.reduce(
					(d, item) => {
						if (!d[item.group]) {
							d[item.group] = 0;
						}

						d[item.group] += 1;

						return d;
					},
					{}
				);
		},

		async statusCount(__, ___, {Server}) {
			const [, items = []] = await Server.get_users({field: 'status'});

			return items
				.reduce(
					(d, item) => {
						if (!d[item.status]) {
							d[item.status] = 0;
						}

						d[item.status] += 1;

						return d;
					},
					{}
				)
		}
	}
};

exports.directives = [
	{
		name: 'user',
		before: true,
		resolve({user, perm}, __, {Server}) {
			console.log(user, perm);
		}
	}
];