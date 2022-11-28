"use strict";

exports.typeDef = `
extend type Query {
	getSettings: Object
}

extend type Mutation {
	setSettings(settings: Object): Boolean @user(cap: "edit-settings")
	setSetting(name: String value: String): Boolean @user(cap: "edit-settings")
	deleteSetting(name: String!): Boolean @user(cap: "delete-settings")
}
`;

exports.resolvers = {
	Query: {
		getSettings: (__, ___, {Server}) => Server.get_settings(),
	},

	Mutation: {
		async setSettings(__, {settings}, {Server}) {
			for(const [name, value] of Object.entries(settings)) {
				await Server.set_setting(name, value);
			}

			return true;
		},

		async setSetting(__, {name, value}, {Server}) {
			const [err] = await Server.set_setting(name, value);

			return err||true;
		},

		async deleteSetting(__, {name}, {Server}) {
			const [err] = await Server.unset_setting(name);

			return err||true;
		}
	}
};