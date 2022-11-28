"use strict";

const {setError, generateHashKey, decryptHashKey} = require('../utils');
const {i18n} = require('../lang');

exports.typeDef = `
directive @user(cap: String) on OBJECT | FIELD_DEFINITION

type User {
	Id: String
	email: String
	group: String
	status: String
	portrait: String
	meta: Object
	caps: Array
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
	meta: Object
	created: DateTime
	updated: DateTime
}

type UsersResult {
	items: [User]
	totalItems: Int
	groupCount: Object
	statusCount: Object
}

type UserGroup {
	Id: String
	name: String
	slug: String
	description: String
	caps: Array
	userCount: Int
}

input UserGroupInput {
	Id: String
	name: String
	slug: String
	description: String
	caps: Array
}

extend type Query {
	getCurrentUser: User
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
	logout: Boolean
	getUserGroup(Id: String slug: String): UserGroup
	getUserGroups: [UserGroup]
}

extend type Mutation {
	login(email: String pwd: String): User
	createUser(input: UserInput): User @user(cap: "edit-users")
	updateUser(input: UserInput): User @user(cap: "edit-users")
	deleteUser(Id: String!): Boolean @user(cap: "delete-users")
	setUserGroup(input: UserGroupInput): UserGroup @user(cap: "edit-users")
	deleteUserGroup(Id: String! action: String): Boolean @user(cap: "edit-users")
}
`;

exports.resolvers = {
	User: {
		meta({Id}, __, {Server}) {
			return Server.get_user_meta(Id);
		},

		async caps({group}, __, {Server}) {
			const [, groupData] = await Server.get_group_by_slug(group);

			return groupData && groupData.caps || [];
		}
	},
	
	Query: {
		CurrentUser: (__, ___, {Server}) => Server.currentUser,

		async logout(__, ___, {Server}) {
			const user = Server.currentUser;

			if (!user.Id) {
				// Nothing to logout, just bail!
				return true;
			}

			/**
			 * Trigger whenever a user logs out from the system.
			 * 
			 * @param {object} user
			 * 	Currently logged in user.
			 **/
			await Server.trigger('user/logout', user);

			// Generate new session Id
			Server.sessionId = await Server.create_session_id();

			// Change current user into guest
			Server.currentUser = {Id: 0};

			return true;
		},

		// Just pass the arguments
		getUsers: (__, args) => ({args}),

		async getUserGroup(__, {Id, slug}, {Server}) {
			// Id take precedence
			if (Id) {
				const [err, group] = await Server.get_user_group(Id);

				return err||group;
			}

			const [err2, group2] = await Server.get_group_by_slug(slug);

			return err2||group2;
		},

		getUserGroups: (__, ___, {Server}) => Server.get_user_groups()
	},

	Mutation: {
		async login(__, {email, pwd}, {Server}) {
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

		async createUser(__, {input}, {Server}) {
			const [err, userId] = await Server.create_user(input);

			if (err) {
				return err;
			}

			// Add user meta data if there's any
			if (input.meta) {
				for(const [name, value] of Object.entries(input.meta)) {
					// Just add them
					await Server.set_user_meta(userId, name, value);
				}
			}

			const [err2, user] = await Server.get_user(userId);

			return err2||user;
		},

		async updateUser(__, {input}, {Server}) {
			const [err] = await Server.update_user(input);

			if (err) {
				return err;
			}

			// Add user meta data if there's any
			if (input.meta) {
				for(const [name, value] of Object.entries(input.meta)) {
					// Just add them
					await Server.set_user_meta(input.Id, name, value);
				}
			}

			const [err2, user] = await Server.get_user(input.Id);

			return err2||user;
		},

		async deleteUser(__, {Id}, {Server}) {
			const [err] = await Server.delete_user(Id);

			return err||true;
		},

		async setUserGroup(__, {input}, {Server}) {
			const [err, groupId] = await Server.set_user_group(input);

			if (err) {
				return err;
			}

			const [err2, group] = await Server.get_user_group(groupId);

			return err2||group;
		},

		async deleteUserGroup(__, {Id, action}, {Server}) {
			const [err] = await Server.delete_user_group(Id, action);

			return err||true;
		}
	},

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
	},

	UserGroup: {
		async userCount({slug}, __, {Server}) {
			const [, items = []] = await Server.get_users({
				field: 'Id',
				group: slug
			});

			return items.length;
		}
	}
};

exports.directives = [
	{
		name: 'user',
		async resolve({cap}, {Server}) {
			const currentUser = Server.currentUser;

			// All adminstrator can do anything
			if ('administrator' === currentUser.group) {
				return true;
			}

			const [, group] = await Server.get_group_by_slug(currentUser.group);

			if (group && group.caps && _.contains(group.caps, cap)) {
				return true;
			}

			return false;
		}
	}
];